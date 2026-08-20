import 'server-only';

import crypto from 'crypto';
import {
  MAX_ORDER_QUANTITY,
  SENTINEL_PRODUCTS,
  VAT_RATE,
  getLinePriceBreakdown,
  roundCurrency,
} from '@/lib/products';

const PRODUCT_BY_ID = new Map(SENTINEL_PRODUCTS.map((product) => [product.id, product]));
const MAX_CART_LINES = SENTINEL_PRODUCTS.length;
const MAX_EMAIL_LENGTH = 254;

export class CheckoutInputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CheckoutInputError';
  }
}

function requiredText(value, field, maxLength) {
  if (typeof value !== 'string') {
    throw new CheckoutInputError(`${field} is required.`);
  }

  const text = value.trim();
  if (!text || text.length > maxLength) {
    throw new CheckoutInputError(`${field} is invalid.`);
  }
  return text;
}

export function normaliseEmail(value) {
  const email = requiredText(value, 'Email address', MAX_EMAIL_LENGTH).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CheckoutInputError('A valid email address is required.');
  }
  return email;
}

export function normaliseDelivery(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new CheckoutInputError('Delivery details are required.');
  }

  const delivery = {
    name: requiredText(value.name, 'Full name', 120),
    phone: requiredText(value.phone, 'Phone number', 30),
    addressLine1: requiredText(value.addressLine1, 'Street address', 180),
    suburb: requiredText(value.suburb, 'Suburb', 100),
    city: requiredText(value.city, 'City', 100),
    province: requiredText(value.province, 'Province', 100),
    postalCode: requiredText(value.postalCode, 'Postal code', 10),
  };

  if (!/^[0-9]{4}$/.test(delivery.postalCode)) {
    throw new CheckoutInputError('Postal code must contain four digits.');
  }

  if (!/^[+0-9()\s-]{7,30}$/.test(delivery.phone)) {
    throw new CheckoutInputError('Phone number is invalid.');
  }

  return delivery;
}

export function buildCanonicalCheckout(cart) {
  if (!Array.isArray(cart) || cart.length < 1 || cart.length > MAX_CART_LINES) {
    throw new CheckoutInputError('Your cart is empty or contains too many product lines.');
  }

  const quantities = new Map();

  for (const item of cart) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new CheckoutInputError('Your cart contains an invalid product.');
    }

    const productId = typeof item.id === 'string' ? item.id : '';
    const product = PRODUCT_BY_ID.get(productId);
    const quantity = Number(item.qty);

    if (!product) {
      throw new CheckoutInputError('Your cart contains a product that is no longer available.');
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ORDER_QUANTITY) {
      throw new CheckoutInputError(`Quantity for ${product.name} must be between 1 and ${MAX_ORDER_QUANTITY}.`);
    }
    if (quantities.has(productId)) {
      throw new CheckoutInputError(`${product.name} appears more than once in your cart.`);
    }

    quantities.set(productId, quantity);
  }

  const items = [...quantities.entries()].map(([productId, quantity]) => {
    const product = PRODUCT_BY_ID.get(productId);
    const price = getLinePriceBreakdown(product, quantity);

    return {
      id: product.id,
      ref: product.ref,
      name: product.name,
      qty: price.quantity,
      price: price.unitPriceExVat,
      unitPriceExVat: price.unitPriceExVat,
      unitPriceInclVat: price.unitPriceInclVat,
      subtotalExVat: price.subtotalExVat,
      vat: price.vat,
      totalInclVat: price.totalInclVat,
      priceTier: price.tier.label,
    };
  });

  const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.subtotalExVat, 0));
  const vat = roundCurrency(subtotal * VAT_RATE);
  const total = roundCurrency(subtotal + vat);
  const amountSubunit = Math.round(total * 100);
  const fingerprintSource = items.map(({ id, qty }) => ({ id, qty }));
  const fingerprint = crypto
    .createHash('sha256')
    .update(JSON.stringify({ items: fingerprintSource, amountSubunit, currency: 'ZAR' }))
    .digest('hex');

  return {
    items,
    subtotal,
    vat,
    total,
    amountSubunit,
    currency: 'ZAR',
    fingerprint,
  };
}

export function getPaystackSecret() {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret || !/^sk_(test|live)_/.test(secret)) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured correctly.');
  }
  return secret;
}

export function paystackMode(secret) {
  return secret.startsWith('sk_live_') ? 'live' : 'test';
}

function readMetadata(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value !== 'string') return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function validatePaystackTransaction(transaction, paymentIntent) {
  if (!transaction || !paymentIntent) return false;

  const metadata = readMetadata(transaction.metadata);
  let transactionEmail;
  try {
    transactionEmail = normaliseEmail(transaction.customer?.email);
  } catch {
    return false;
  }

  return (
    transaction.status === 'success'
    && transaction.reference === paymentIntent.reference
    && Number(transaction.amount) === Number(paymentIntent.amountSubunit)
    && String(transaction.currency || '').toUpperCase() === paymentIntent.currency
    && transactionEmail === normaliseEmail(paymentIntent.email)
    && metadata?.safelink_checkout === true
    && metadata?.safelink_user_id === paymentIntent.uid
    && metadata?.cart_fingerprint === paymentIntent.fingerprint
    && Number(metadata?.expected_amount_subunit) === Number(paymentIntent.amountSubunit)
  );
}
