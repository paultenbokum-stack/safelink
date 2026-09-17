import 'server-only';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';

export const DEFAULT_PRESENTATIONS = [
  {
    slug: 'security-brokers',
    partnerName: 'Security Brokers',
    shortName: 'Security Brokers',
    websiteUrl: 'https://www.securitybrokers.co.za',
    logoUrl: '/presentation/security-brokers-logo.png',
    primaryColor: '#00E5FF',
    secondaryColor: '#00FFA3',
    warningColor: '#FF6B00',
    heroScene: 'network',
    status: 'published',
    contactName: 'Kyle Saffy',
    contactEmail: 'kyle@creamtech.co.za',
    contactWebsite: 'creamtech.co.za',
    presentationVersion: 'safelink-core-v1',
  },
  {
    slug: 'marshall-security',
    partnerName: 'Marshall Security',
    shortName: 'Marshall',
    websiteUrl: '',
    logoUrl: '',
    primaryColor: '#4F7CFF',
    secondaryColor: '#00FFA3',
    warningColor: '#FF6B00',
    heroScene: 'orbit',
    status: 'draft',
    contactName: 'Kyle Saffy',
    contactEmail: 'kyle@creamtech.co.za',
    contactWebsite: 'creamtech.co.za',
    presentationVersion: 'safelink-core-v1',
  },
  {
    slug: 'sovereign-intervention',
    partnerName: 'Sovereign Intervention',
    shortName: 'Sovereign',
    websiteUrl: 'https://sovereignintervention.co.za',
    logoUrl: '/sovereign-intervention-logo.png',
    primaryColor: '#D4AF37',
    secondaryColor: '#E5C158',
    warningColor: '#FF4D4D',
    heroScene: 'network',
    status: 'published',
    contactName: 'Kyle Saffy',
    contactEmail: 'kyle@creamtech.co.za',
    contactWebsite: 'creamtech.co.za',
    presentationVersion: 'safelink-core-v1',
  },
  {
    slug: 'sb-security',
    partnerName: 'SB Security',
    shortName: 'SB Security',
    websiteUrl: 'https://sbsecurity.co.za',
    logoUrl: '/presentation/security-brokers-logo.png',
    primaryColor: '#F7BB23',
    secondaryColor: '#FFD700',
    warningColor: '#FF4D4D',
    heroScene: 'network',
    status: 'published',
    contactName: 'Kyle Saffy',
    contactEmail: 'kyle@creamtech.co.za',
    contactWebsite: 'creamtech.co.za',
    presentationVersion: 'safelink-core-v1',
  },
];

const normalize = (value = {}) => ({
  ...DEFAULT_PRESENTATIONS[0],
  ...value,
  slug: String(value.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
  partnerName: String(value.partnerName || '').trim(),
  status: value.status === 'draft' ? 'draft' : 'published',
});

export async function getPublishedPresentation(slug) {
  const safeSlug = String(slug || '').toLowerCase();
  const safeSlugDash = safeSlug.replace(/_/g, '-');
  const safeSlugUnderscore = safeSlug.replace(/-/g, '_');

  const fallback = DEFAULT_PRESENTATIONS.find(
    (item) => item.slug === safeSlugDash || item.slug === safeSlugUnderscore || item.slug === safeSlug
  );

  try {
    const db = getAdminFirestore();
    const docDash = await db.collection('presentationProfiles').doc(safeSlugDash).get();
    if (docDash.exists) {
      const profile = normalize(docDash.data());
      return profile.status === 'published' ? profile : null;
    }

    const docUnder = await db.collection('presentationProfiles').doc(safeSlugUnderscore).get();
    if (docUnder.exists) {
      const profile = normalize(docUnder.data());
      return profile.status === 'published' ? profile : null;
    }
  } catch (error) {
    console.warn('[presentationProfiles] Falling back to seeded profile:', error.message);
  }

  if (fallback?.status === 'published') return fallback;

  // Dynamically resolve presentation profile from security company branding
  try {
    const { getCompanyBranding } = await import('@/lib/branding-store');
    const branding = await getCompanyBranding(safeSlugUnderscore);

    const db = getAdminFirestore();
    let compData = null;
    try {
      const compDoc = await db.collection('security_companies').doc(safeSlugUnderscore).get();
      if (compDoc.exists) compData = compDoc.data();
    } catch {}

    const partnerName = branding?.partnerName || compData?.name || safeSlugUnderscore.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    const primaryColor = branding?.highlightedButtonBg || branding?.buttonTextColor || '#D4AF37';
    const secondaryColor = branding?.buttonTextColor || branding?.highlightedButtonBg || '#E5C158';
    const logoUrl = branding?.logoUrl || '/safelink-shield.png';

    return normalize({
      slug: safeSlugDash,
      partnerName,
      shortName: branding?.shortName || partnerName,
      websiteUrl: branding?.sourceUrl || compData?.websiteUrl || '',
      logoUrl,
      primaryColor,
      secondaryColor,
      warningColor: '#FF4D4D',
      heroScene: 'network',
      status: 'published',
      contactName: 'Kyle Saffy',
      contactEmail: compData?.contactEmail || 'kyle@creamtech.co.za',
      contactWebsite: 'creamtech.co.za',
      presentationVersion: 'safelink-core-v1',
    });
  } catch (err) {
    console.warn('[presentationProfiles] Error dynamically resolving presentation profile:', err);
  }

  return null;
}

export async function listPresentationProfiles() {
  try {
    const snapshot = await getAdminFirestore().collection('presentationProfiles').orderBy('partnerName').get();
    const records = snapshot.docs.map((item) => normalize(item.data()));
    return records.length ? records : DEFAULT_PRESENTATIONS;
  } catch (error) {
    console.warn('[presentationProfiles] Seeded listing only:', error.message);
    return DEFAULT_PRESENTATIONS;
  }
}

export async function savePresentationProfile(input) {
  const profile = normalize(input);
  if (!profile.slug || !profile.partnerName) throw new Error('A partner name and URL slug are required.');

  const payload = {
    ...profile,
    updatedAt: FieldValue.serverTimestamp(),
  };
  await getAdminFirestore().collection('presentationProfiles').doc(profile.slug).set({
    ...payload,
    createdAt: input.createdAt || FieldValue.serverTimestamp(),
  }, { merge: true });
  return profile;
}

export async function removePresentationProfile(slug) {
  await getAdminFirestore().collection('presentationProfiles').doc(slug).delete();
}
