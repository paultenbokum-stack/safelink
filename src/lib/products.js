/**
 * SafeLink x Sentinel IoT - customer catalogue.
 *
 * The eight products below are the exact intersection of the supplied
 * reseller workbook and brochure folder. Volume prices are sourced from the
 * workbook's "Price Ex Vat" column. The SAMPLE row is used for quantities
 * 1-9, followed by the stated 10, 100, 500 and 1,000 unit breaks.
 */

export const VAT_RATE = 0.15;
export const MAX_ORDER_QUANTITY = 1000;

const sharedConnectivity = 'Global BLE crowdsourced ecosystem (Gen 3 - dual-broadcast)';

export const SENTINEL_PRODUCTS = [
  {
    id: 'aura-cube', ref: 1, name: 'Sentinel Cube', range: 'AURA', category: 'Asset Trackers', badge: 'Best Seller',
    connectivity: sharedConnectivity,
    platform: 'Platform subscription included for 30 months at a 10-minute refresh rate.',
    image: '/products/aura-cube-studio.png', costPrice: 1144.87, sellingPrice: 1259,
    priceTiers: [
      { minQty: 1, maxQty: 9, label: '1-9', sourceLabel: 'Sample', unitPriceExVat: 1144.87 },
      { minQty: 10, maxQty: 99, label: '10-99', unitPriceExVat: 840.74 },
      { minQty: 100, maxQty: 499, label: '100-499', unitPriceExVat: 779.91 },
      { minQty: 500, maxQty: 999, label: '500-999', unitPriceExVat: 719.09 },
      { minQty: 1000, maxQty: null, label: '1,000+', unitPriceExVat: 658.26 },
    ],
    specs: ['30-month battery life', 'Audible locator', 'Weather resistant', 'Global availability', 'Geo-fence abilities', '48 x 38 x 13.7 mm'],
    desc: 'A compact asset tracker for monitoring and recovering valuable items through a global crowdsourced network, with no SIM card required.',
    useCases: ['Luggage and travel', 'Parcels and boxes', 'Industrial assets'],
  },
  {
    id: 'aura-pebble', ref: 2, name: 'Sentinel Pebble', range: 'AURA', category: 'Asset Trackers', badge: 'Vehicle Ready',
    connectivity: sharedConnectivity,
    platform: 'Platform subscription included for 36 months at a 10-minute refresh rate.',
    image: '/products/aura-pebble-studio.png', costPrice: 1223.13, sellingPrice: 1349,
    priceTiers: [
      { minQty: 1, maxQty: 9, label: '1-9', sourceLabel: 'Sample', unitPriceExVat: 1223.13 },
      { minQty: 10, maxQty: 99, label: '10-99', unitPriceExVat: 897.26 },
      { minQty: 100, maxQty: 499, label: '100-499', unitPriceExVat: 832.09 },
      { minQty: 500, maxQty: 999, label: '500-999', unitPriceExVat: 766.91 },
      { minQty: 1000, maxQty: null, label: '1,000+', unitPriceExVat: 701.74 },
    ],
    specs: ['36-month battery life', 'Magnetic deployment case', 'Trip replays', 'Audible locator', 'Weather resistant', '42.5 x 24 mm'],
    desc: 'A compact tracker with a magnetic deployment case for discreetly monitoring vehicles and other valuable assets without a SIM card.',
    useCases: ['Vehicle tracking', 'Shipping containers', 'Fleet assets'],
  },
  {
    id: 'aura-blade', ref: 3, name: 'Sentinel Blade', range: 'AURA', category: 'Asset Trackers', badge: 'Wallet Slim',
    connectivity: sharedConnectivity,
    platform: 'Platform subscription included for 24 months at a 10-minute refresh rate.',
    image: '/products/aura-blade-studio.png', costPrice: 1027.48, sellingPrice: 1124,
    priceTiers: [
      { minQty: 1, maxQty: 9, label: '1-9', sourceLabel: 'Sample', unitPriceExVat: 1027.48 },
      { minQty: 10, maxQty: 99, label: '10-99', unitPriceExVat: 810.26 },
      { minQty: 100, maxQty: 499, label: '100-499', unitPriceExVat: 755.96 },
      { minQty: 500, maxQty: 999, label: '500-999', unitPriceExVat: 701.65 },
      { minQty: 1000, maxQty: null, label: '1,000+', unitPriceExVat: 647.35 },
    ],
    specs: ['24-month battery life', 'Audible locator', 'Weather resistant', 'Multi-user access', 'No charging needed', '84.5 x 54.4 x 2 mm'],
    desc: 'A slim, credit-card-sized tracker for monitoring wallets, bags and other valuables through the crowdsourced Sentinel network.',
    useCases: ['Wallets and bags', 'Passports and documents', 'Backpacks'],
  },
  {
    id: 'aura-tag', ref: 4, name: 'Sentinel TAG', range: 'AURA', category: 'Tags & Labels', badge: 'Entry Level',
    connectivity: sharedConnectivity,
    platform: 'Platform subscription included for 2 months at a 10-minute refresh rate.',
    image: '/products/aura-tag-studio.png', costPrice: 597.05, sellingPrice: 629,
    priceTiers: [
      { minQty: 1, maxQty: 9, label: '1-9', sourceLabel: 'Sample', unitPriceExVat: 597.05 },
      { minQty: 10, maxQty: 99, label: '10-99', unitPriceExVat: 475.48 },
      { minQty: 100, maxQty: 499, label: '100-499', unitPriceExVat: 445.09 },
      { minQty: 500, maxQty: 999, label: '500-999', unitPriceExVat: 414.70 },
      { minQty: 1000, maxQty: null, label: '1,000+', unitPriceExVat: 384.31 },
    ],
    specs: ['2-month battery life', 'Trip replay', 'Battery monitoring', 'Weather resistant', 'Indoor and outdoor use', '0.4-1.5 mm thick'],
    desc: 'A low-profile asset-tracking label for parcels and flat surfaces, providing worldwide location updates without a SIM card.',
    useCases: ['Parcels and envelopes', 'Flat-surface tracking', 'High-volume logistics'],
  },
  {
    id: 'aura-tagplus', ref: 5, name: 'Sentinel TAG+', range: 'AURA', category: 'Tags & Labels', badge: 'Extended Life',
    connectivity: sharedConnectivity,
    platform: 'Platform subscription included for 12 months at a 10-minute refresh rate.',
    image: '/products/aura-tagplus-studio.png', costPrice: 831.83, sellingPrice: 899,
    priceTiers: [
      { minQty: 1, maxQty: 9, label: '1-9', sourceLabel: 'Sample', unitPriceExVat: 831.83 },
      { minQty: 10, maxQty: 99, label: '10-99', unitPriceExVat: 658.09 },
      { minQty: 100, maxQty: 499, label: '100-499', unitPriceExVat: 614.66 },
      { minQty: 500, maxQty: 999, label: '500-999', unitPriceExVat: 571.22 },
      { minQty: 1000, maxQty: null, label: '1,000+', unitPriceExVat: 527.79 },
    ],
    specs: ['12-month battery life', 'Audible locator', 'Mobile and desktop control', 'Multi-user access', 'Weather resistant', '1.5 mm thick'],
    desc: 'An extended-life, low-profile tracker for recurring shipments and valuable equipment, with mobile and desktop control included.',
    useCases: ['Medical equipment', 'High-value shipments', 'IT equipment'],
  },
  {
    id: 'aura-scout', ref: 6, name: 'Sentinel Scout', range: 'AURA', category: 'Asset Trackers', badge: 'People & Bags',
    connectivity: sharedConnectivity,
    platform: 'Platform subscription included for 36 months at a 10-minute refresh rate.',
    image: '/products/aura-scout-studio.png', costPrice: 831.83, sellingPrice: 899,
    priceTiers: [
      { minQty: 1, maxQty: 9, label: '1-9', sourceLabel: 'Sample', unitPriceExVat: 831.83 },
      { minQty: 10, maxQty: 99, label: '10-99', unitPriceExVat: 658.09 },
      { minQty: 100, maxQty: 499, label: '100-499', unitPriceExVat: 614.66 },
      { minQty: 500, maxQty: 999, label: '500-999', unitPriceExVat: 571.22 },
      { minQty: 1000, maxQty: null, label: '1,000+', unitPriceExVat: 527.79 },
    ],
    specs: ['36-month battery life', 'Audible locator', 'Mobile and desktop control', 'Multi-user access', 'Weather resistant', '42.5 x 24 mm'],
    desc: 'A compact card-format tracker for people, bags and portable assets, with worldwide location tracking and no SIM card required.',
    useCases: ['Staff and employees', 'School bags', 'Vulnerable family members'],
  },
  {
    id: 'aura-stem', ref: 7, name: 'Sentinel Stem', range: 'AURA', category: 'Specialist Trackers', badge: 'Cylindrical',
    connectivity: sharedConnectivity,
    platform: 'Platform subscription included for 24 months at a 10-minute refresh rate.',
    image: '/products/aura-stem-studio.png', costPrice: 1027.48, sellingPrice: 1124,
    priceTiers: [
      { minQty: 1, maxQty: 9, label: '1-9', sourceLabel: 'Sample', unitPriceExVat: 1027.48 },
      { minQty: 10, maxQty: 99, label: '10-99', unitPriceExVat: 810.26 },
      { minQty: 100, maxQty: 499, label: '100-499', unitPriceExVat: 755.96 },
      { minQty: 500, maxQty: 999, label: '500-999', unitPriceExVat: 701.65 },
      { minQty: 1000, maxQty: null, label: '1,000+', unitPriceExVat: 647.35 },
    ],
    specs: ['24-month battery life', 'Battery health monitoring', 'Trip replay', 'Weather resistant', 'No charging needed', '17 mm diameter x 45 mm'],
    desc: 'A cylindrical tracker designed for discreet installation in narrow spaces while monitoring valuable assets through the Sentinel network.',
    useCases: ['Bicycles and e-bikes', 'Power tools', 'Tubes and poles'],
  },
  {
    id: 'aura-node', ref: 8, name: 'Sentinel Node', range: 'AURA', category: 'Asset Trackers', badge: 'Key Finder',
    connectivity: sharedConnectivity,
    platform: 'Platform subscription included for 12 months at a 10-minute refresh rate.',
    image: '/products/aura-node-studio.png', costPrice: 722.26, sellingPrice: 773,
    priceTiers: [
      { minQty: 1, maxQty: 9, label: '1-9', sourceLabel: 'Sample', unitPriceExVat: 722.26 },
      { minQty: 10, maxQty: 99, label: '10-99', unitPriceExVat: 572.87 },
      { minQty: 100, maxQty: 499, label: '100-499', unitPriceExVat: 535.52 },
      { minQty: 500, maxQty: 999, label: '500-999', unitPriceExVat: 498.18 },
      { minQty: 1000, maxQty: null, label: '1,000+', unitPriceExVat: 460.83 },
    ],
    specs: ['12-month battery life', 'Audible locator', 'Mobile and desktop control', 'Multi-user access', 'Weather resistant', '42.5 x 24 mm'],
    desc: 'A compact disc tracker for keys, pets and smaller valuables, with an audible locator and worldwide crowdsourced tracking.',
    useCases: ['Keys and remotes', 'Pets and collars', 'Small valuables'],
  },
];

function normaliseQuantity(quantity) {
  const parsed = Number.parseInt(quantity, 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, MAX_ORDER_QUANTITY) : 1;
}

export function roundCurrency(amount) {
  return Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
}

export function getPriceTier(product, quantity = 1) {
  const qty = normaliseQuantity(quantity);
  return product.priceTiers.find((tier) => qty >= tier.minQty && (tier.maxQty === null || qty <= tier.maxQty))
    ?? product.priceTiers[product.priceTiers.length - 1];
}

export function getNextPriceTier(product, quantity = 1) {
  const qty = normaliseQuantity(quantity);
  return product.priceTiers.find((tier) => tier.minQty > qty) ?? null;
}

export function getUnitPriceExVat(product, quantity = 1) {
  return getPriceTier(product, quantity).unitPriceExVat;
}

export function getLinePriceBreakdown(product, quantity = 1) {
  const qty = normaliseQuantity(quantity);
  const tier = getPriceTier(product, qty);
  const unitPriceExVat = tier.unitPriceExVat;
  const subtotalExVat = roundCurrency(unitPriceExVat * qty);
  const vat = roundCurrency(subtotalExVat * VAT_RATE);

  return {
    quantity: qty,
    tier,
    unitPriceExVat,
    unitPriceInclVat: roundCurrency(unitPriceExVat * (1 + VAT_RATE)),
    subtotalExVat,
    vat,
    totalInclVat: roundCurrency(subtotalExVat + vat),
  };
}

/** Compatibility helpers used by the existing admin views. */
export function getMargin(product) {
  return product.sellingPrice - product.costPrice;
}

export function getMarginPct(product) {
  return ((getMargin(product) / product.sellingPrice) * 100).toFixed(1);
}

export function formatZAR(amount) {
  return `R${Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const PRODUCT_CATEGORIES = ['All', 'Asset Trackers', 'Tags & Labels', 'Specialist Trackers'];
