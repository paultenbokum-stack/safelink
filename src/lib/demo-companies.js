// Canonical security companies for SafeLink multi-tenant platform.
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
    isDemo: false,
    accounting: { provider: 'sage', status: 'connected' },
    cameraSystem: { defaultBrand: 'Hikvision', status: 'connected' },
    aura: { enabled: true, environment: 'staging' },
  },
  {
    id: 'sb_security',
    name: 'SB Security',
    status: 'active',
    registrationNumber: 'PSIRA-2024/49102',
    psiraNumber: 'PSIRA-2024/49102',
    dispatchPhone: '011 789 1234',
    contactEmail: 'info@sbsecurity.co.za',
    memberCount: 184,
    deviceCount: 52,
    isDemo: false,
    accounting: { provider: 'sage', status: 'connected' },
    cameraSystem: { defaultBrand: 'Hikvision', status: 'connected' },
    aura: { enabled: true, environment: 'staging' },
  },
];

/**
 * Filter predicate to detect and filter out legacy demo/placeholder companies
 */
export function isDummyCompany(c) {
  if (!c) return false;
  const id = String(c.id || '').toLowerCase();
  const name = String(c.name || '').toLowerCase();
  const reg = String(c.registrationNumber || c.psiraNumber || '').toLowerCase();

  return (
    ['demo_coastal', 'demo_highveld', 'demo_neighbourhood'].includes(id) ||
    id.includes('help24') ||
    name.includes('coastal shield') ||
    name.includes('highveld response') ||
    name.includes('neighbourhood protection') ||
    name.includes('help24') ||
    ['psira-2024/99182', 'psira-2024/001', 'psira-2023/55410', 'psira-1998/00124'].includes(reg)
  );
}
