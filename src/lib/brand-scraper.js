/**
 * Utility to scrape a security company's website and extract brand CI,
 * including logo candidates, dominant color schemes, typography/fonts, and contact info.
 */

const blockedHost = (host) => {
  const value = host.toLowerCase();
  return (
    value === 'localhost' ||
    value.endsWith('.local') ||
    /^(127\.|10\.|192\.168\.|0\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(value)
  );
};

const cleanHex = (hex) => {
  if (!hex) return null;
  const match = hex.match(/#([0-9a-f]{3,6})\b/i);
  return match ? `#${match[1].toUpperCase()}` : null;
};

// Check if hex color is bright
function isBright(hex) {
  if (!hex || hex.length < 4) return false;
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  // Perceived brightness formula
  return (r * 299 + g * 587 + b * 114) / 1000 > 140;
}

export async function scrapeCompanyBrand(websiteUrl) {
  if (!websiteUrl) throw new Error('Please provide a valid website URL.');

  let targetUrl = websiteUrl.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  const urlObj = new URL(targetUrl);
  if (blockedHost(urlObj.hostname)) {
    throw new Error('Private or local addresses cannot be scraped.');
  }

  // Fast fetch with 6s timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  let html = '';
  let finalUrl = targetUrl;
  try {
    const response = await fetch(urlObj.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SafeLink Brand Ingestor/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });
    clearTimeout(timer);
    finalUrl = response.url;
    html = (await response.text()).slice(0, 800000);
  } catch (err) {
    clearTimeout(timer);
    console.warn('[brand-scraper] Fetch failed or timed out:', err.message);
  }

  // 1. Company Name & Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  let rawTitle = titleMatch ? titleMatch[1].trim() : urlObj.hostname.replace(/^www\./, '').split('.')[0];
  rawTitle = rawTitle.replace(/[-|·–].*$/, '').trim(); // Remove suffixes like " - Home"

  const partnerName = rawTitle.length > 2 ? rawTitle : 'Security Partner';
  const shortName = partnerName.split(' ')[0] || 'Partner';

  // 2. Logos
  const logoCandidates = [];

  // Special case: if sovereign intervention, use official logo in public directory
  if (urlObj.hostname.includes('sovereign') || partnerName.toLowerCase().includes('sovereign')) {
    logoCandidates.push('/sovereign-intervention-logo.png');
  }

  // Check og:image
  const ogImage = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
                  html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i)?.[1];
  if (ogImage) logoCandidates.push(new URL(ogImage, finalUrl).toString());

  // Check icons
  const iconMatches = [...html.matchAll(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/gi)];
  for (const m of iconMatches) {
    if (m[1]) logoCandidates.push(new URL(m[1], finalUrl).toString());
  }

  // Check apple-touch-icon
  const appleIcon = html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i)?.[1];
  if (appleIcon) logoCandidates.push(new URL(appleIcon, finalUrl).toString());

  // Check img tags with 'logo' in class/alt/src
  const imgLogoMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*(?:logo|brand|emblem)[^>]*>/gi)];
  for (const m of imgLogoMatches) {
    if (m[1]) logoCandidates.push(new URL(m[1], finalUrl).toString());
  }

  const selectedLogo = logoCandidates[0] || '/safelink-shield.png';

  // 3. Color Extraction
  const colorMatches = [...html.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)].map(m => cleanHex(m[0])).filter(Boolean);
  
  // Theme-color meta
  const themeColor = cleanHex(html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i)?.[1]);

  // Count color frequency
  const colorFreq = {};
  for (const c of colorMatches) {
    // Ignore pure white/black in frequency count for accent detection
    if (c !== '#FFFFFF' && c !== '#000000' && c !== '#FFF' && c !== '#000') {
      colorFreq[c] = (colorFreq[c] || 0) + 1;
    }
  }

  const sortedAccents = Object.entries(colorFreq).sort((a, b) => b[1] - a[1]).map(([c]) => c);

  // Check for sovereign gold specifics
  let primaryAccent = themeColor || sortedAccents[0];
  if (urlObj.hostname.includes('sovereign') || html.includes('sovereign') || sortedAccents.some(c => c.toLowerCase().includes('b8780b') || c.toLowerCase().includes('d4af37'))) {
    primaryAccent = '#D4AF37'; // Sovereign Gold
  } else if (!primaryAccent) {
    primaryAccent = '#00E5FF'; // Default SafeLink Cyan
  }

  // Dark obsidian header / page background
  const headerBgColor = '#04070E';
  const headerTextColor = primaryAccent;
  const pageBgColor = '#040D16';
  const pageTextColor = '#F8FAFC';
  const highlightedButtonBg = primaryAccent;
  const highlightedButtonText = isBright(primaryAccent) ? '#04070E' : '#FFFFFF';
  const buttonBgColor = '#0F1A26';
  const buttonTextColor = primaryAccent;

  // 4. Fonts
  let fontFamily = 'modern'; // 'modern' | 'classic' | 'simple'
  const htmlLower = html.toLowerCase();
  
  if (htmlLower.includes('cinzel') || htmlLower.includes('playfair') || htmlLower.includes('serif') || htmlLower.includes('classic')) {
    fontFamily = 'classic';
  } else if (htmlLower.includes('black ops') || htmlLower.includes('space grotesk') || htmlLower.includes('orbitron') || htmlLower.includes('mono')) {
    // Technical, military, or tactical security font
    fontFamily = 'simple';
  } else {
    fontFamily = 'modern';
  }

  // 5. Contact information
  const phoneMatches = html.match(/(?:\+27|0)[1-8][0-9](?:[\s-]*[0-9]{3}[\s-]*[0-9]{4}|[0-9]{7})/g) || [];
  const emailMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  
  // Filter out web assets / framework emails
  const cleanEmails = [...new Set(emailMatches.filter(e => !e.includes('example.com') && !e.includes('sentry') && !e.includes('w3.org')))];
  const cleanPhones = [...new Set(phoneMatches.map(p => p.trim()))];

  const branding = {
    partnerName,
    shortName,
    logoUrl: selectedLogo,
    showLogoInHeader: true,
    headerBgColor,
    headerBgImage: '',
    headerTextColor,
    headerTextAuto: false,
    pageBgColor,
    pageBgImage: '',
    pageTextColor,
    fontFamily,
    highlightedButtonBg,
    highlightedButtonText,
    highlightedButtonAuto: false,
    buttonBgColor,
    buttonTextColor,
    buttonOpacity: 75,
    sourceUrl: finalUrl,
  };

  return {
    success: true,
    branding,
    extracted: {
      partnerName,
      shortName,
      logoCandidates,
      detectedColors: [primaryAccent, ...sortedAccents.slice(0, 5)],
      detectedFont: fontFamily,
      emails: cleanEmails.slice(0, 3),
      phones: cleanPhones.slice(0, 3),
      source: finalUrl,
    },
  };
}
