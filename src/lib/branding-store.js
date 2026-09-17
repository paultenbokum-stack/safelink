import { getAdminFirestore } from '@/lib/firebase-admin';

export const DEFAULT_BRANDINGS = {
  sovereign_intervention: {
    companyId: 'sovereign_intervention',
    partnerName: 'Sovereign Intervention',
    shortName: 'Sovereign',
    logoUrl: '/sovereign-intervention-logo.png',
    showLogoInHeader: true,
    headerBgColor: '#04070E',
    headerBgImage: '',
    headerTextColor: '#D4AF37',
    headerTextAuto: false,
    pageBgColor: '#040D16',
    pageBgImage: '',
    pageTextColor: '#F8FAFC',
    fontFamily: 'modern', // 'modern' (Inter) | 'classic' (Cinzel/Serif) | 'simple' (Space Grotesk)
    highlightedButtonBg: '#D4AF37',
    highlightedButtonText: '#04070E',
    highlightedButtonAuto: false,
    buttonBgColor: '#0F1A26',
    buttonTextColor: '#D4AF37',
    buttonOpacity: 75,
    updatedAt: new Date().toISOString(),
  },
  sb_security: {
    companyId: 'sb_security',
    partnerName: 'SB Security',
    shortName: 'SB Security',
    logoUrl: '/presentation/security-brokers-logo.png',
    showLogoInHeader: true,
    headerBgColor: '#04070E',
    headerBgImage: '',
    headerTextColor: '#F7BB23',
    headerTextAuto: false,
    pageBgColor: '#040D16',
    pageBgImage: '',
    pageTextColor: '#F8FAFC',
    fontFamily: 'modern',
    highlightedButtonBg: '#F7BB23',
    highlightedButtonText: '#04070E',
    highlightedButtonAuto: false,
    buttonBgColor: '#0F1A26',
    buttonTextColor: '#F7BB23',
    buttonOpacity: 75,
    updatedAt: new Date().toISOString(),
    sourceUrl: 'https://sbsecurity.co.za/',
  },
  security_brokers: {
    companyId: 'security_brokers',
    partnerName: 'Security Brokers',
    shortName: 'SB Security',
    logoUrl: '/presentation/security-brokers-logo.png',
    showLogoInHeader: true,
    headerBgColor: '#04070E',
    headerBgImage: '',
    headerTextColor: '#F7BB23',
    headerTextAuto: false,
    pageBgColor: '#040D16',
    pageBgImage: '',
    pageTextColor: '#F8FAFC',
    fontFamily: 'modern',
    highlightedButtonBg: '#F7BB23',
    highlightedButtonText: '#04070E',
    highlightedButtonAuto: false,
    buttonBgColor: '#0F1A26',
    buttonTextColor: '#F7BB23',
    buttonOpacity: 75,
    updatedAt: new Date().toISOString(),
    sourceUrl: 'https://sbsecurity.co.za/',
  },
  default: {
    companyId: 'default',
    partnerName: 'SafeLink Security',
    shortName: 'SafeLink',
    logoUrl: '/safelink-shield.png',
    showLogoInHeader: true,
    headerBgColor: '#07131F',
    headerBgImage: '',
    headerTextColor: '#00E5FF',
    headerTextAuto: false,
    pageBgColor: '#040D16',
    pageBgImage: '',
    pageTextColor: '#E2E8F0',
    fontFamily: 'modern',
    highlightedButtonBg: '#E53E3E',
    highlightedButtonText: '#FFFFFF',
    highlightedButtonAuto: true,
    buttonBgColor: '#121E2C',
    buttonTextColor: '#00E5FF',
    buttonOpacity: 70,
    updatedAt: new Date().toISOString(),
  },
};

// Global in-memory cache to support demo mutations across serverless executions
const memoryBrandStore = new Map();

/**
 * Fetch branding configuration for a specific security company.
 */
export async function getCompanyBranding(companyId) {
  const cleanId = String(companyId || '').trim().toLowerCase();
  
  if (memoryBrandStore.has(cleanId)) {
    return memoryBrandStore.get(cleanId);
  }

  const resolvePreset = (cid) => {
    if (DEFAULT_BRANDINGS[cid]) return DEFAULT_BRANDINGS[cid];
    if (cid === 'sb' || cid === 'sbsecurity' || cid === 'securitybrokers' || cid.includes('sb_sec')) {
      return DEFAULT_BRANDINGS.sb_security;
    }
    if (cid === 'si' || cid === 'sovereign' || cid.includes('sovereign')) {
      return DEFAULT_BRANDINGS.sovereign_intervention;
    }
    return null;
  };

  const preset = resolvePreset(cleanId);

  try {
    const db = getAdminFirestore();
    const doc = await db.collection('security_companies').doc(cleanId).get();
    if (doc.exists && doc.data()?.branding) {
      const merged = {
        ...(preset || DEFAULT_BRANDINGS.default),
        ...doc.data().branding,
        companyId: cleanId,
      };
      memoryBrandStore.set(cleanId, merged);
      return merged;
    }
  } catch (err) {
    console.warn(`[branding-store] Firestore lookup failed for ${cleanId}, using preset:`, err.message);
  }

  const fallback = preset || {
    ...DEFAULT_BRANDINGS.default,
    companyId: cleanId,
    partnerName: cleanId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  };

  memoryBrandStore.set(cleanId, fallback);
  return fallback;
}

/**
 * Save or update branding configuration for a security company.
 */
export async function saveCompanyBranding(companyId, brandingData) {
  const cleanId = String(companyId || '').trim().toLowerCase();
  const current = await getCompanyBranding(cleanId);

  const updated = {
    ...current,
    ...brandingData,
    companyId: cleanId,
    updatedAt: new Date().toISOString(),
  };

  memoryBrandStore.set(cleanId, updated);

  try {
    const db = getAdminFirestore();
    await db.collection('security_companies').doc(cleanId).set(
      {
        branding: updated,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn(`[branding-store] Firestore persistence failed for ${cleanId} (cached in memory):`, err.message);
  }

  return updated;
}
