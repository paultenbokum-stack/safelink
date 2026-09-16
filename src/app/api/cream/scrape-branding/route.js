import { NextResponse } from 'next/server';
import { scrapeCompanyBrand } from '@/lib/brand-scraper';

/**
 * POST /api/cream/scrape-branding
 * Ingest CI, logo, font, and color scheme from a security company's public website.
 */
export async function POST(request) {
  try {
    const { websiteUrl } = await request.json();
    if (!websiteUrl || typeof websiteUrl !== 'string') {
      return NextResponse.json({ error: 'Please provide a valid website URL.' }, { status: 400 });
    }

    const result = await scrapeCompanyBrand(websiteUrl);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/cream/scrape-branding] Failed to scrape website:', err.message);
    return NextResponse.json(
      { error: err.message || 'Could not ingest branding from website. Enter details manually.' },
      { status: 422 }
    );
  }
}
