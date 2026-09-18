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
  // Note: 'security_brokers' is an alias for 'sb_security' — see resolvePreset() below.
  // Only one canonical entry exists to prevent divergence.
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
  },
};

// NOTE: No module-level cache. Serverless instances are short-lived and shared;
// a Map() here can bleed between requests for different tenants on a warm instance.
// Firestore is the source of truth for branding — read it on every request.

/**
 * Fetch branding configuration for a specific security company.
 */
export async function getCompanyBranding(companyId) {
  const cleanId = String(companyId || '').trim().toLowerCase();

  const resolvePreset = (cid) => {
    if (DEFAULT_BRANDINGS[cid]) return DEFAULT_BRANDINGS[cid];
    // Canonical aliases for sb_security — all map to the same brand preset.
    if (
      cid === 'sb' || cid === 'sbsecurity' || cid === 'securitybrokers' ||
      cid === 'security_brokers' || cid.startsWith('sb_sec') || cid.includes('security_broker')
    ) {
      return DEFAULT_BRANDINGS.sb_security;
    }
    // Canonical aliases for sovereign_intervention.
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
      return {
        ...(preset || DEFAULT_BRANDINGS.default),
        ...doc.data().branding,
        companyId: cleanId,
      };
    }
  } catch (err) {
    console.warn(`[branding-store] Firestore lookup failed for ${cleanId}, using preset:`, err.message);
  }

  return preset || {
    ...DEFAULT_BRANDINGS.default,
    companyId: cleanId,
    partnerName: cleanId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  };
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
    updatedAt: new Date().toISOString(), // always set at save time, not at module load
  };

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
    console.warn(`[branding-store] Firestore persistence failed for ${cleanId}:`, err.message);
  }

  return updated;
}
