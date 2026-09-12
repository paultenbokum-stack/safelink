import { NextResponse } from 'next/server';
import { requirePresentationAdmin } from '@/lib/presentation-admin';

const blockedHost = (host) => {
  const value = host.toLowerCase();
  return value === 'localhost' || value.endsWith('.local') || /^(127\.|10\.|192\.168\.|0\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(value);
};

const firstMatch = (source, expression) => source.match(expression)?.[1]?.trim() || '';

export async function POST(request) {
  try {
    await requirePresentationAdmin(request);
    const { websiteUrl } = await request.json();
    const url = new URL(websiteUrl);
    if (!['http:', 'https:'].includes(url.protocol) || blockedHost(url.hostname)) {
      return NextResponse.json({ error: 'Use a public HTTP or HTTPS website URL.' }, { status: 400 });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'CREAM Presentation Brand Preview/1.0' },
    });
    clearTimeout(timer);
    if (!response.ok) return NextResponse.json({ error: 'The website could not be reached.' }, { status: 422 });

    const html = (await response.text()).slice(0, 750000);
    const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const image = firstMatch(html, /<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || firstMatch(html, /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);
    const themeColor = firstMatch(html, /<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i);
    const absoluteImage = image ? new URL(image, response.url).toString() : '';

    return NextResponse.json({ title, logoCandidate: absoluteImage, themeColor, source: response.url });
  } catch (error) {
    if (error.message === 'UNAUTHENTICATED') return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Administrator access is required.' }, { status: 403 });
    return NextResponse.json({ error: 'Brand preview could not be created. Add the client details manually instead.' }, { status: 422 });
  }
}
