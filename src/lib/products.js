/**
 * SafeLink × Sentinel IoT — AURA Range Product Catalogue
 *
 * Pricing logic:
 *  - costPrice  = "Price Ex VAT" (what SafeLink pays — sample/1-unit rate)
 *  - rrp        = "RRP (Incl VAT)" — Sentinel's full retail price
 *  - sellingPrice = MAP (Incl VAT) — what customers see and pay
 *  - margin     = sellingPrice − costPrice (calculated field)
 *
 * The admin dashboard allows overriding costPrice and sellingPrice per product.
 * Overrides are persisted in Firestore and merged at runtime.
 */

export const SENTINEL_PRODUCTS = [
  {
    id: 'aura-cube',
    ref: 1,
    name: 'Sentinel Cube',
    range: 'AURA',
    category: 'Asset Trackers',
    badge: 'Best Seller',
    connectivity: 'Global BLE Crowdsourced Ecosystem (Gen 3 – Dual-Broadcast)',
    platform: 'Platform Subscription — INCLUDED for 30 months @ 10 min refresh rate',
    image: '/products/aura-cube.png',
    costPrice: 1144.87, // Price Ex VAT (sample/1-unit)
    rrp: 1399,          // RRP Incl VAT
    sellingPrice: 1259, // MAP Incl VAT — displayed price
    specs: ['30-Month Battery', 'Weather Resistant', 'Global Availability', 'Geo-Fence Alerts', 'No SIM Required', '48×38×13.7mm'],
    desc: 'Compact asset tracker leveraging a crowdsourced BLE network for worldwide location tracking without a SIM card. Platform subscription included.',
    useCases: ['Luggage & Travel', 'Parcels & Boxes', 'Industrial Assets'],
  },
  {
    id: 'aura-pebble',
    ref: 2,
    name: 'Sentinel Pebble',
    range: 'AURA',
    category: 'Asset Trackers',
    badge: 'Vehicle Ready',
    connectivity: 'Global BLE Crowdsourced Ecosystem (Gen 3 – Dual-Broadcast)',
    platform: 'Platform Subscription — INCLUDED for 36 months @ 10 min refresh rate',
    image: '/products/aura-pebble.png',
    costPrice: 1223.13,
    rrp: 1499,
    sellingPrice: 1349,
    specs: ['36-Month Battery', 'Magnetic Deployment', 'Trip Replays', 'Weather Resistant', 'Global Availability', '42.5×24mm'],
    desc: 'Spherical form-factor with magnetic case for covert vehicle or asset deployment. Longest battery life in the AURA range.',
    useCases: ['Vehicle Covert Tracking', 'Shipping Containers', 'Fleet Assets'],
  },
  {
    id: 'aura-blade',
    ref: 3,
    name: 'Sentinel Blade',
    range: 'AURA',
    category: 'Asset Trackers',
    badge: 'Wallet Slim',
    connectivity: 'Global BLE Crowdsourced Ecosystem (Gen 3 – Dual-Broadcast)',
    platform: 'Platform Subscription — INCLUDED for 24 months @ 10 min refresh rate',
    image: '/products/aura-blade.png',
    costPrice: 1027.48,
    rrp: 1249,
    sellingPrice: 1124,
    specs: ['24-Month Battery', 'Credit Card Size', 'Weather Resistant', 'Mobile & Desktop App', 'No Charging Needed', '84.5×54.4×2mm'],
    desc: 'Ultra-thin credit-card tracker that fits in any wallet, bag, or document sleeve. Global crowdsourced network, no SIM required.',
    useCases: ['Wallets & Bags', 'Passports & Documents', 'Backpacks'],
  },
  {
    id: 'aura-tag',
    ref: 4,
    name: 'Sentinel TAG',
    range: 'AURA',
    category: 'Tags & Labels',
    badge: 'Entry Level',
    connectivity: 'Global BLE Crowdsourced Ecosystem (Gen 3 – Dual-Broadcast)',
    platform: 'Platform Subscription — INCLUDED for 2 months @ 10 min refresh rate',
    image: '/products/aura-tag.png',
    costPrice: 597.05,
    rrp: 699,
    sellingPrice: 629,
    specs: ['2-Month Battery', 'Ultra-Thin 0.4–1.5mm', 'Trip Replay', 'Battery Monitoring', 'Weather Resistant', 'Indoor & Outdoor'],
    desc: 'Peel-and-stick BLE label for parcels, envelopes, and flat surfaces. Disposable or rechargeable — the most affordable entry into the Sentinel ecosystem.',
    useCases: ['Parcels & Envelopes', 'Flat Surface Tracking', 'High-Volume Logistics'],
  },
  {
    id: 'aura-tagplus',
    ref: 5,
    name: 'Sentinel TAG+',
    range: 'AURA',
    category: 'Tags & Labels',
    badge: 'Extended Life',
    connectivity: 'Global BLE Crowdsourced Ecosystem (Gen 3 – Dual-Broadcast)',
    platform: 'Platform Subscription — INCLUDED for 12 months @ 10 min refresh rate',
    image: '/products/aura-tagplus.png',
    costPrice: 831.83,
    rrp: 999,
    sellingPrice: 899,
    specs: ['12-Month Battery', '1.5mm Thickness', 'Mobile App & Desktop', 'Multi-User Access', 'Weather Resistant', 'No Charging Needed'],
    desc: 'Premium reusable version of the TAG with extended 12-month battery life and full app integration. Ideal for high-value recurring shipments.',
    useCases: ['Medical Equipment', 'High-Value Shipments', 'IT Equipment'],
  },
  {
    id: 'aura-scout',
    ref: 6,
    name: 'Sentinel Scout',
    range: 'AURA',
    category: 'Asset Trackers',
    badge: 'People & Bags',
    connectivity: 'Global BLE Crowdsourced Ecosystem (Gen 3 – Dual-Broadcast)',
    platform: 'Platform Subscription — INCLUDED for 36 months @ 10 min refresh rate',
    image: '/products/aura-scout.png',
    costPrice: 831.83,
    rrp: 999,
    sellingPrice: 899,
    specs: ['36-Month Battery', 'Lanyard/Clip Ready', 'Weather Resistant', 'Mobile App & Desktop', 'Multi-User Access', '42.5×24mm'],
    desc: 'Card-format tracker designed for people tracking — staff, students, and family members. Wear it, clip it, or slot it into a bag.',
    useCases: ['Staff & Employees', 'School Bags', 'Elderly & Vulnerable'],
  },
  {
    id: 'aura-stem',
    ref: 7,
    name: 'Sentinel Stem',
    range: 'AURA',
    category: 'Specialist Trackers',
    badge: 'Cylindrical',
    connectivity: 'Global BLE Crowdsourced Ecosystem (Gen 3 – Dual-Broadcast)',
    platform: 'Platform Subscription — INCLUDED for 24 months @ 10 min refresh rate',
    image: '/products/aura-stem.png',
    costPrice: 1027.48,
    rrp: 1249,
    sellingPrice: 1124,
    specs: ['24-Month Battery', 'Ø17mm × 45mm Cylinder', 'Battery Health Monitor', 'Trip Replay', 'Weather Resistant', 'No Charging Needed'],
    desc: 'Cylindrical form factor for tight spaces — bicycle frames, tool handles, tubes, and pipes. Covert installation made easy.',
    useCases: ['Bicycles & E-Bikes', 'Power Tools', 'Scaffolding & Poles'],
  },
  {
    id: 'aura-node',
    ref: 8,
    name: 'Sentinel Node',
    range: 'AURA',
    category: 'Asset Trackers',
    badge: 'Key Finder',
    connectivity: 'Global BLE Crowdsourced Ecosystem (Gen 3 – Dual-Broadcast)',
    platform: 'Platform Subscription — INCLUDED for 12 months @ 10 min refresh rate',
    image: '/products/aura-node.png',
    costPrice: 722.26,
    rrp: 849,
    sellingPrice: 773,
    specs: ['12-Month Battery', 'Disc Form-Factor', 'Audible Locator', 'Mobile App & Desktop', 'Weather Resistant', '42.5×24mm'],
    desc: 'Flat disc tracker for pets, keys, remotes, and small valuables. Trigger an audible alert from the app to find it instantly.',
    useCases: ['Keys & Remotes', 'Pets & Collars', 'Valuables & Accessories'],
  },
];

/** Calculate margin for display */
export function getMargin(product) {
  return product.sellingPrice - product.costPrice;
}

/** Calculate margin percentage */
export function getMarginPct(product) {
  return ((getMargin(product) / product.sellingPrice) * 100).toFixed(1);
}

/** Format ZAR currency */
export function formatZAR(amount) {
  return `R${Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const PRODUCT_CATEGORIES = ['All', 'Asset Trackers', 'Tags & Labels', 'Specialist Trackers'];
