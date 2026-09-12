import { notFound } from 'next/navigation';
import { getPublishedPresentation } from '@/lib/presentation-store';
import PresentationExperience from './presentation-experience';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const profile = await getPublishedPresentation(slug);
  return {
    title: profile ? `${profile.partnerName} × SafeLink | CREAM` : 'SafeLink Partner Presentation',
    description: 'A CREAM Technologies white-label security platform presentation.',
  };
}

export default async function PartnerPresentationPage({ params }) {
  const { slug } = await params;
  const profile = await getPublishedPresentation(slug);
  if (!profile) notFound();
  return <PresentationExperience profile={profile} />;
}
