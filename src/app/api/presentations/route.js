import { NextResponse } from 'next/server';
import { requirePresentationAdmin } from '@/lib/presentation-admin';
import { listPresentationProfiles, removePresentationProfile, savePresentationProfile } from '@/lib/presentation-store';

function accessError(error) {
  const status = error.message === 'FORBIDDEN' ? 403 : 401;
  return NextResponse.json({ error: status === 403 ? 'Administrator access is required.' : 'Sign in to continue.' }, { status });
}

export async function GET(request) {
  try {
    await requirePresentationAdmin(request);
    return NextResponse.json({ profiles: await listPresentationProfiles() });
  } catch (error) {
    return accessError(error);
  }
}

export async function POST(request) {
  try {
    await requirePresentationAdmin(request);
    const profile = await savePresentationProfile(await request.json());
    return NextResponse.json({ profile });
  } catch (error) {
    if (error.message === 'UNAUTHENTICATED' || error.message === 'FORBIDDEN') return accessError(error);
    return NextResponse.json({ error: error.message || 'Could not save this profile.' }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    await requirePresentationAdmin(request);
    const { slug } = await request.json();
    if (!slug) return NextResponse.json({ error: 'A profile slug is required.' }, { status: 400 });
    await removePresentationProfile(slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'UNAUTHENTICATED' || error.message === 'FORBIDDEN') return accessError(error);
    return NextResponse.json({ error: 'Could not remove this profile.' }, { status: 400 });
  }
}
