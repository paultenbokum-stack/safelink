/**
 * Sentinel Aura product catalogue — pricing in ZAR.
 * costPrice: the wholesale Sentinel cost used for profit/margin tracking.
 * price:     what the customer pays via SafeLink.
 *
 * TODO: Update costPrice values once confirmed from the Sentinel pricing sheet.
 */
export const sentinelProducts = [
  {
    id: 'aura-hub-pro',
    sku: 'SNTL-AURA-HUB-PRO',
    category: 'Aura Hub',
    name: 'Sentinel Aura Hub Pro',
    tagline: 'Complete home security command centre',
    description:
      'The Sentinel Aura Hub Pro is the brain of your home security system. It monitors all connected sensors, provides real-time alerts, and keeps your family safe 24/7.',
    price: 4999,
    costPrice: 3200, // TODO: confirm exact figure from Sentinel pricing doc
    originalPrice: 5999,
    badge: 'Best Seller',
    features: [
      '4G LTE + WiFi connectivity',
      'Real-time SMS & push alerts',
      '72-hour backup battery',
      'Weatherproof IP65 rated',
      '2-year warranty',
    ],
    imeiRequired: true,
    quantity: 1,
    deliveryDays: '5–7 business days',
    color: '#2c5a85',
  },
  {
    id: 'aura-portable',
    sku: 'SNTL-AURA-PORT',
    category: 'Portable',
    name: 'Sentinel Aura Portable',
    tagline: 'Personal & vehicle panic device',
    description:
      'Stay protected on the go. The Aura Portable clips to your keyring and connects directly to armed response with one press.',
    price: 1999,
    costPrice: 1250, // TODO: confirm exact figure from Sentinel pricing doc
    originalPrice: null,
    badge: null,
    features: [
      'Panic button with GPS tracking',
      'Vehicle tracking capability',
      'Waterproof IPX4',
      '30-day standby battery',
      'Nationwide network coverage',
    ],
    imeiRequired: true,
    quantity: 1,
    deliveryDays: '5–7 business days',
    color: '#805ad5',
  },
  {
    id: 'aura-sensor-pack',
    sku: 'SNTL-AURA-SENS-3PK',
    category: 'Sensors',
    name: 'Aura Sensor Pack (3-pack)',
    tagline: 'Door, window & motion sensors',
    description:
      'Expand your Aura Hub coverage with this sensor pack. Includes 2 door/window sensors and 1 PIR motion detector.',
    price: 1299,
    costPrice: 750, // TODO: confirm exact figure from Sentinel pricing doc
    originalPrice: 1599,
    badge: 'Save R300',
    features: [
      '2× door/window sensors',
      '1× PIR motion detector',
      'Wireless 868MHz',
      'Tamper-proof design',
      'Plug-and-play setup',
    ],
    imeiRequired: false,
    quantity: 1,
    deliveryDays: '5–7 business days',
    color: '#38a169',
  },
  {
    id: 'aura-camera',
    sku: 'SNTL-AURA-CAM-4K',
    category: 'Cameras',
    name: 'Aura Smart Camera 4K',
    tagline: 'Outdoor 4K security camera',
    description:
      'Crystal-clear 4K footage with night vision. Mounts in minutes and streams live to the SafeLink app.',
    price: 2499,
    costPrice: 1600, // TODO: confirm exact figure from Sentinel pricing doc
    originalPrice: null,
    badge: 'New',
    features: [
      '4K Ultra HD resolution',
      'Colour night vision',
      'AI motion detection',
      'Two-way audio',
      'Local + cloud storage',
    ],
    imeiRequired: false,
    quantity: 1,
    deliveryDays: '5–7 business days',
    color: '#dd6b20',
  },
];

// Legacy export kept for backward compatibility
export const storeProducts = sentinelProducts;

// Also keep the old mock alerts for dashboard fallback
export const recentAlerts = [
  { id: 1, icon: '🔔', message: 'Alarm system armed', time: '10m ago', unread: true },
  { id: 2, icon: '🔋', message: 'Hub battery at 85%', time: '2h ago', unread: false },
  { id: 3, icon: '✅', message: 'Monthly test successful', time: '1d ago', unread: false },
];
