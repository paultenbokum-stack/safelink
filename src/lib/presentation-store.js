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
  const fallback = DEFAULT_PRESENTATIONS.find((item) => item.slug === safeSlug);

  try {
    const document = await getAdminFirestore().collection('presentationProfiles').doc(safeSlug).get();
    if (document.exists) {
      const profile = normalize(document.data());
      return profile.status === 'published' ? profile : null;
    }
  } catch (error) {
    console.warn('[presentationProfiles] Falling back to seeded profile:', error.message);
  }

  return fallback?.status === 'published' ? fallback : null;
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
