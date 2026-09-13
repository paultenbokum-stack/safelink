'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getHousehold } from '@/lib/db';
import AuthGuard from '@/app/components/AuthGuard';
import {
  SENTINEL_PRODUCTS,
  VAT_RATE,
  formatZAR,
  getLinePriceBreakdown,
  roundCurrency,
} from '@/lib/products';

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <CheckoutContent />
    </AuthGuard>
  );
}

function CheckoutContent() {
  const { user } = useAuth();
  const router   = useRouter();

  const [cart, setCart]       = useState([]);
  const [household, setHousehold] = useState(null);
  const [step, setStep]       = useState(1); // 1=review, 2=delivery, 3=payment
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');
  const [orderId, setOrderId] = useState(null);
  const [confirmedTotal, setConfirmedTotal] = useState(null);
  const [delivery, setDelivery] = useState({
    name: '', phone: '', addressLine1: '',
    suburb: '', city: '', province: '', postalCode: '',
  });

  useEffect(() => {
    const stored = sessionStorage.getItem('safelink_cart');
    if (!stored) { router.replace('/store'); return; }
    let restored;
    try {
      restored = JSON.parse(stored);
      if (!Array.isArray(restored) || !restored.length || restored.some(item => !SENTINEL_PRODUCTS.some(product => product.id === item.id) || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 1000)) throw new Error('Invalid cart');
    } catch { sessionStorage.removeItem('safelink_cart'); router.replace('/store'); return; }
    const timer = window.setTimeout(() => setCart(restored), 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    getHousehold(user.uid).then(h => {
      if (h) {
        setHousehold(h);
        setDelivery({
          name:         `${h.adminFirstName} ${h.adminLastName}`,
          phone:        h.phone || '',
          addressLine1: h.address?.line1 || '',
          suburb:       h.address?.suburb || '',
          city:         h.address?.city || '',
          province:     h.address?.province || '',
          postalCode:   h.address?.postalCode || '',
        });
      }
    }).catch(() => { /* Delivery details can be entered manually. */ });
  }, [user]);

  const pricedCart = cart.map((item) => {
    const product = SENTINEL_PRODUCTS.find((candidate) => candidate.id === item.id) ?? item;
    return { ...product, ...item, ...getLinePriceBreakdown(product, item.qty) };
  });
  const subtotal = roundCurrency(pricedCart.reduce((sum, item) => sum + item.subtotalExVat, 0));
  const vat      = roundCurrency(subtotal * VAT_RATE);
  const total    = roundCurrency(subtotal + vat);

  const updateDelivery = (field) => (e) =>
    setDelivery(d => ({ ...d, [field]: e.target.value }));

  // ── Payment via Paystack popup ────────────────────────────────
  const cartForPayment = () => cart.map(({ id, qty }) => ({ id, qty }));

  const readApiResponse = async (response) => {
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error || 'The payment service could not complete this request.');
    }
    return data;
  };

  const handlePaymentSuccess = async (paystackRef) => {
    setBusy(true);
    setError('');
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference: paystackRef }),
      });
      const verification = await readApiResponse(response);

      if (!verification.verified || !verification.orderId) {
        throw new Error('Paystack has not confirmed this payment yet.');
      }

      setOrderId(verification.orderId);
      setConfirmedTotal(verification.amount);
      sessionStorage.removeItem('safelink_cart');
      setStep(4); // confirmation
    } catch (err) {
      setError(`${err.message} No order has been created. Keep this Paystack reference for support: ${paystackRef}`);
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const initPaystack = async () => {
    if (!user || !cart.length) return;

    setBusy(true);
    setError('');
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cart: cartForPayment(), delivery }),
      });
      const payment = await readApiResponse(response);
      const { default: PaystackPop } = await import('@paystack/inline-js');
      const popup = new PaystackPop();

      popup.resumeTransaction(payment.accessCode, {
        onSuccess: (transaction) => {
          void handlePaymentSuccess(transaction.reference || payment.reference);
        },
        onCancel: () => setBusy(false),
        onError: (paystackError) => {
          console.error('Paystack popup error:', paystackError);
          setError('Paystack could not open the secure payment window. Please try again.');
          setBusy(false);
        },
      });
    } catch (err) {
      console.error('Paystack initialize error:', err);
      setError(err.message || 'The payment gateway is temporarily unavailable.');
      setBusy(false);
    }
  };

  // ── Step 4: Confirmation ─────────────────────────────────────
  if (step === 4 && orderId) {
    return (
      <div className="checkout-page">
        <ConfirmationScreen orderId={orderId} total={confirmedTotal ?? total} onDone={() => router.push('/orders')} />
        <CheckoutStyles />
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {/* Header */}
      <div className="checkout-header">
        <button className="back-btn" onClick={() => step === 1 ? router.back() : setStep(s => s - 1)}>
          ← Back
        </button>
        <h1 className="checkout-title">Checkout</h1>
        <div style={{ width: 60 }} />
      </div>

      {/* Step indicator */}
      <div className="step-indicators">
        {['Review', 'Delivery', 'Payment'].map((label, i) => (
          <div key={label} className={`step-ind ${step >= i + 1 ? 'active' : ''}`}>
            <div className="step-ind-dot">{step > i + 1 ? '✓' : i + 1}</div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {error && <div role="alert" className="checkout-error">{error}</div>}

      {/* Step 1: Review cart */}
      {step === 1 && (
        <div className="checkout-body">
          <h2 className="section-head">Order Summary</h2>
          {pricedCart.map(item => (
            <div key={item.id} className="cart-line">
              <div className="cart-line-name">
                <div style={{ fontWeight: 700 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Qty: {item.qty.toLocaleString('en-ZA')} at {formatZAR(item.unitPriceExVat)} ex VAT
                </div>
              </div>
              <div className="cart-line-price">{formatZAR(item.subtotalExVat)}</div>
            </div>
          ))}
          <div className="price-row"><span>Subtotal ex VAT</span><span>{formatZAR(subtotal)}</span></div>
          <div className="price-row"><span>VAT (15%)</span><span>{formatZAR(vat)}</span></div>
          <div className="price-row total"><span>Total incl. VAT</span><span>{formatZAR(total)}</span></div>
          <button className="checkout-btn" onClick={() => setStep(2)}>Confirm Order →</button>
        </div>
      )}

      {/* Step 2: Delivery */}
      {step === 2 && (
        <form className="checkout-body" onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
          <h2 className="section-head">Delivery Details</h2>
          {household && (
            <div className="prefill-notice">
              ✓ Pre-filled from your household profile — update if needed
            </div>
          )}
          <CField label="Full Name"     value={delivery.name}         onChange={updateDelivery('name')} />
          <CField label="Phone"         value={delivery.phone}        onChange={updateDelivery('phone')} type="tel" />
          <CField label="Street Address" value={delivery.addressLine1} onChange={updateDelivery('addressLine1')} />
          <CField label="Suburb"         value={delivery.suburb}       onChange={updateDelivery('suburb')} />
          <CField label="City"           value={delivery.city}         onChange={updateDelivery('city')} />
          <CField label="Province"       value={delivery.province}     onChange={updateDelivery('province')} />
          <CField label="Postal Code"    value={delivery.postalCode}   onChange={updateDelivery('postalCode')} pattern="[0-9]{4}" />
          <button type="submit" className="checkout-btn">Proceed to Payment →</button>
        </form>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <div className="checkout-body">
          <h2 className="section-head">Payment</h2>
          <div className="payment-summary-card">
            <div className="psc-label">Amount due</div>
            <div className="psc-amount">{formatZAR(total)}</div>
            <div className="psc-items">{cart.reduce((s, i) => s + i.qty, 0)} item{cart.length !== 1 ? 's' : ''} · delivery to {delivery.suburb}</div>
          </div>

          <div className="paystack-info">
            <div className="paystack-logo">
              <svg viewBox="0 0 120 40" width="120" height="40" fill="none">
                <rect width="120" height="40" rx="8" fill="rgba(255,255,255,0.05)" />
                <text x="10" y="26" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial">Paystack</text>
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Paystack processes your payment securely. SafeLink verifies the amount and payment status before creating your order.
            </p>
          </div>

          <button className="checkout-btn paystack-pay-btn" onClick={initPaystack} disabled={busy}>
            {busy ? <span className="spinner" /> : `Pay ${formatZAR(total)} Securely →`}
          </button>

          <div className="secure-badges">
            <span>🔒 SSL Encrypted</span>
            <span>🏦 PCI Compliant</span>
            <span>✅ Paystack Secured</span>
          </div>
        </div>
      )}

      <CheckoutStyles />
    </div>
  );
}

function ConfirmationScreen({ orderId, total, onDone }) {
  return (
    <div className="confirmation">
      <div className="confirm-icon">✅</div>
      <h2 className="confirm-title">Order Confirmed!</h2>
      <p className="confirm-sub">Your Sentinel devices are on their way</p>

      <div className="confirm-card">
        <div className="confirm-row"><span>Order ID</span><span className="confirm-val">#{orderId.slice(0, 8).toUpperCase()}</span></div>
        <div className="confirm-row"><span>Referral Code</span><span className="confirm-val">SBSec-{orderId.slice(-10).toUpperCase()}</span></div>
        <div className="confirm-row"><span>Amount Paid</span><span className="confirm-val">{formatZAR(total)}</span></div>
        <div className="confirm-row"><span>Delivery</span><span className="confirm-val">5–7 business days</span></div>
      </div>

      <div className="confirm-note">
        <span>📦</span>
        <span>We are processing your order with Sentinel and will confirm delivery details via email and SMS.</span>
      </div>

      <button className="checkout-btn" onClick={onDone}>Track My Orders →</button>
    </div>
  );
}

function CField({ label, value, onChange, type = 'text', pattern }) {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      <input
        type={type}
        aria-label={label}
        className="field-input"
        value={value}
        onChange={onChange}
        required
        pattern={pattern}
      />
    </div>
  );
}

function CheckoutStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      .checkout-page {
        min-height: 100dvh;
        padding-bottom: calc(96px + env(safe-area-inset-bottom));
        background: var(--bg-dark, #0f1923);
        color: var(--text-primary, #fff);
        display: flex; flex-direction: column;
      }
      .checkout-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 20px 20px 0;
      }
      .back-btn {
        background: none; border: none; color: var(--accent);
        font-size: 15px; font-weight: 600; cursor: pointer; padding: 0;
      }
      .checkout-title { margin: 0; font-size: 20px; font-weight: 800; }

      .step-indicators {
        display: flex; padding: 20px 20px 0; gap: 0;
      }
      .step-ind {
        display: flex; flex-direction: column; align-items: center;
        gap: 4px; flex: 1; position: relative;
        color: var(--text-secondary); font-size: 11px; font-weight: 600;
        text-transform: uppercase;
      }
      .step-ind::before {
        content: '';
        position: absolute; top: 12px; left: 50%; right: -50%;
        height: 2px; background: rgba(255,255,255,0.1); z-index: 0;
      }
      .step-ind:last-child::before { display: none; }
      .step-ind-dot {
        width: 24px; height: 24px; border-radius: 50%;
        background: rgba(255,255,255,0.08);
        border: 2px solid rgba(255,255,255,0.15);
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 700; z-index: 1;
        transition: all 0.3s;
      }
      .step-ind.active .step-ind-dot {
        background: var(--primary); border-color: var(--primary);
        box-shadow: 0 0 12px rgba(44,90,133,0.5);
      }

      .checkout-body {
        padding: 24px 20px; display: flex; flex-direction: column; gap: 14px;
        flex: 1;
      }
      .checkout-error {
        margin: 16px 20px 0;
        background: rgba(229,62,62,0.15);
        border: 1px solid rgba(229,62,62,0.4);
        border-radius: 10px; padding: 12px;
        font-size: 13px; color: #fc8181; line-height: 1.4;
      }

      .section-head { margin: 0 0 4px; font-size: 18px; font-weight: 700; }

      .cart-line {
        display: flex; justify-content: space-between; align-items: flex-start;
        padding: 12px 14px;
        background: rgba(255,255,255,0.04);
        border-radius: 10px; border: 1px solid rgba(255,255,255,0.07);
      }
      .cart-line-name { display: flex; flex-direction: column; gap: 2px; }
      .cart-line-price { font-size: 16px; font-weight: 700; color: var(--accent); }

      .price-row {
        display: flex; justify-content: space-between;
        font-size: 14px; color: var(--text-secondary);
        padding: 4px 0;
      }
      .price-row.total {
        font-size: 18px; font-weight: 800;
        color: var(--text-primary);
        border-top: 1px solid rgba(255,255,255,0.1);
        padding-top: 12px; margin-top: 4px;
      }

      .checkout-btn {
        width: 100%; padding: 16px;
        background: linear-gradient(135deg, var(--primary), #1a3a5c);
        border: none; border-radius: 14px;
        color: #fff; font-size: 16px; font-weight: 700;
        cursor: pointer; margin-top: 8px;
        box-shadow: 0 4px 20px rgba(44,90,133,0.4);
        display: flex; align-items: center; justify-content: center;
        min-height: 52px;
        transition: opacity 0.2s;
      }
      .checkout-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .paystack-pay-btn { background: linear-gradient(135deg, #00b300, #007700); box-shadow: 0 4px 20px rgba(0,179,0,0.3); }

      .prefill-notice {
        background: rgba(56,161,105,0.12);
        border: 1px solid rgba(56,161,105,0.3);
        border-radius: 10px; padding: 10px 12px;
        font-size: 12px; color: #68d391;
      }

      .payment-summary-card {
        background: rgba(44,90,133,0.15);
        border: 1px solid rgba(44,90,133,0.3);
        border-radius: 14px; padding: 20px;
        text-align: center;
      }
      .psc-label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
      .psc-amount { font-size: 40px; font-weight: 900; color: var(--accent); margin: 4px 0; }
      .psc-items { font-size: 13px; color: var(--text-secondary); }

      .paystack-info {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px; padding: 16px;
        display: flex; flex-direction: column; gap: 10px;
      }
      .paystack-logo { display: flex; }

      .secure-badges {
        display: flex; justify-content: center; gap: 16px;
        flex-wrap: wrap;
        font-size: 11px; color: var(--text-secondary);
      }

      .field-group { display: flex; flex-direction: column; gap: 6px; }
      .field-label { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
      .field-input {
        padding: 13px 15px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px; color: var(--text-primary); font-size: 15px;
        outline: none; transition: border-color 0.2s;
      }
      .field-input:focus { border-color: var(--primary); }

      /* Confirmation */
      .confirmation {
        display: flex; flex-direction: column; align-items: center;
        padding: 48px 24px; gap: 16px; text-align: center;
      }
      .confirm-icon { font-size: 72px; }
      .confirm-title { margin: 0; font-size: 28px; font-weight: 800; }
      .confirm-sub   { margin: 0; font-size: 14px; color: var(--text-secondary); }
      .confirm-card {
        width: 100%;
        background: rgba(22,34,49,0.7);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 16px; padding: 16px;
        display: flex; flex-direction: column; gap: 10px;
        text-align: left;
      }
      .confirm-row { display: flex; justify-content: space-between; font-size: 14px; color: var(--text-secondary); }
      .confirm-val  { font-weight: 700; color: var(--text-primary); }
      .confirm-note {
        display: flex; gap: 10px; align-items: flex-start;
        background: rgba(44,90,133,0.12);
        border: 1px solid rgba(44,90,133,0.25);
        border-radius: 10px; padding: 14px;
        font-size: 13px; color: var(--text-secondary); line-height: 1.5;
        text-align: left;
      }
      .spinner {
        display: inline-block; width: 22px; height: 22px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: #fff; border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    `}} />
  );
}
