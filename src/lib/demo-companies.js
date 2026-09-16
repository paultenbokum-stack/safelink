// Presentation records only: never seed these into Firestore or send them to dispatch.
export const DEMO_COMPANIES = [
  {
    id: 'sovereign_intervention',
    name: 'Sovereign Intervention',
    status: 'active',
    registrationNumber: 'PSIRA-2023/88102',
    psiraNumber: 'PSIRA-2023/88102',
    dispatchPhone: '064 530 3940',
    contactEmail: 'sales@soveriegnintervention.co.za',
    memberCount: 215,
    deviceCount: 68,
    isDemo: true,
    accounting: { provider: 'sage', status: 'connected' },
    cameraSystem: { defaultBrand: 'Hikvision', status: 'connected' },
    aura: { enabled: true, environment: 'staging' },
  },
  { id: 'demo_coastal', name: 'Coastal Shield Security', status: 'active', memberCount: 142, deviceCount: 38, isDemo: true, accounting: { provider: 'sage' }, cameraSystem: { defaultBrand: 'HIKVision' }, aura: { enabled: false } },
  { id: 'demo_highveld', name: 'Highveld Response', status: 'active', memberCount: 89, deviceCount: 19, isDemo: true, accounting: { provider: 'xero' }, cameraSystem: { defaultBrand: 'Dahua' }, aura: { enabled: false } },
  { id: 'demo_neighbourhood', name: 'Neighbourhood Protection', status: 'active', memberCount: 64, deviceCount: 12, isDemo: true, accounting: { provider: 'zoho' }, cameraSystem: { defaultBrand: 'EZViz' }, aura: { enabled: false } },
];
