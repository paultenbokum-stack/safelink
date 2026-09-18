'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';

const BrandContext = createContext({
  brand: null,
  companyId: 'sovereign_intervention',
  setCompanyId: () => {},
  refreshBrand: () => {},
  isWhiteLabeled: false,
});

export const SOVEREIGN_DEFAULT_BRAND = {
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
  fontFamily: 'modern',
  highlightedButtonBg: '#D4AF37',
  highlightedButtonText: '#04070E',
  highlightedButtonAuto: false,
  buttonBgColor: '#0F1A26',
  buttonTextColor: '#D4AF37',
  buttonOpacity: 75,
};

export const SB_SECURITY_DEFAULT_BRAND = {
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
  sourceUrl: 'https://sbsecurity.co.za/',
};

export function getBrandPreset(targetId) {
  const cid = String(targetId || '').trim().toLowerCase();
  if (cid === 'sb_security' || cid === 'security_brokers' || cid === 'sb' || cid.includes('sb_sec') || cid.includes('security_broker')) {
    return { ...SB_SECURITY_DEFAULT_BRAND, companyId: cid };
  }
  if (cid === 'sovereign_intervention' || cid === 'si' || cid.includes('sovereign')) {
    return { ...SOVEREIGN_DEFAULT_BRAND, companyId: cid };
  }
  if (cid) {
    const formattedName = cid.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return {
      ...SOVEREIGN_DEFAULT_BRAND,
      companyId: cid,
      partnerName: formattedName,
      shortName: formattedName.split(' ')[0] || formattedName,
    };
  }
  return SOVEREIGN_DEFAULT_BRAND;
}

export function BrandProvider({ children }) {
  const [companyId, setCompanyId] = useState('sovereign_intervention');
  const [brand, setBrand] = useState(SOVEREIGN_DEFAULT_BRAND);
  const [isWhiteLabeled, setIsWhiteLabeled] = useState(false);

  const applyCssVariables = useCallback((b) => {
    if (typeof document === 'undefined' || !b) return;
    const root = document.documentElement;

    root.style.setProperty('--brand-header-bg', b.headerBgColor || '#04070E');
    root.style.setProperty('--brand-header-text', b.headerTextColor || '#D4AF37');
    root.style.setProperty('--brand-header-img', b.headerBgImage ? `url("${b.headerBgImage}")` : 'none');

    root.style.setProperty('--brand-page-bg', b.pageBgColor || '#040D16');
    root.style.setProperty('--brand-page-text', b.pageTextColor || '#F8FAFC');
    root.style.setProperty('--brand-page-img', b.pageBgImage ? `url("${b.pageBgImage}")` : 'none');

    const fontMap = {
      classic: '"Cinzel", Georgia, serif',
      simple: '"Space Grotesk", -apple-system, sans-serif',
      modern: '"Inter", -apple-system, sans-serif',
    };
    root.style.setProperty('--brand-font', fontMap[b.fontFamily] || fontMap.modern);

    root.style.setProperty('--brand-primary-btn-bg', b.highlightedButtonBg || '#D4AF37');
    root.style.setProperty('--brand-primary-btn-text', b.highlightedButtonText || '#04070E');

    root.style.setProperty('--brand-btn-bg', b.buttonBgColor || '#0F1A26');
    root.style.setProperty('--brand-btn-text', b.buttonTextColor || '#D4AF37');
    root.style.setProperty('--brand-btn-opacity', String((b.buttonOpacity ?? 75) / 100));

    root.style.setProperty('--brand-logo-url', b.logoUrl ? `url("${b.logoUrl}")` : 'none');
    root.style.setProperty('--brand-show-logo', b.showLogoInHeader ? 'inline-flex' : 'none');
  }, []);

  const loadBrand = useCallback(async (targetId) => {
    const cid = String(targetId || 'sovereign_intervention').trim().toLowerCase();
    const preset = getBrandPreset(cid);

    // Apply optimistic preset immediately so it never flashes incorrect partner branding
    setBrand(preset);
    applyCssVariables(preset);
    
    // Check localStorage cache first for immediate customized hydration
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('safelink_brand_' + cid);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.partnerName) {
            setBrand(parsed);
            setIsWhiteLabeled(true);
            applyCssVariables(parsed);
          }
        }
      } catch {}
    }

    try {
      // Branding endpoint requires auth — skip fetch if user is not signed in.
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('unauthenticated');
      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/cream/company/${cid}/branding`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.branding) {
          setBrand(json.branding);
          setIsWhiteLabeled(true);
          applyCssVariables(json.branding);
          try {
            localStorage.setItem('safelink_brand_' + cid, JSON.stringify(json.branding));
          } catch {}
          return;
        }
      }
    } catch (e) {
      if (e.message !== 'unauthenticated') {
        console.warn('[brand-context] Failed to fetch branding, using fallback:', e);
      }
    }
    
    // Fallback to the target company's preset (never force Sovereign for a non-sovereign company!)
    setBrand(preset);
    setIsWhiteLabeled(true);
    applyCssVariables(preset);
  }, [applyCssVariables]);

  const updateCompanyId = useCallback((newId) => {
    if (!newId) return;
    const cid = String(newId).trim().toLowerCase();
    setCompanyId(cid);
    loadBrand(cid);
  }, [loadBrand]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect company from search params, pathname, or household
    const params = new URLSearchParams(window.location.search);
    let rawParam = params.get('companyId') || params.get('partner') || params.get('tenant') || params.get('company');
    
    if (!rawParam) {
      const path = window.location.pathname;
      const pathMatch = path.match(/\/(?:cream\/company|company|p)\/([^/?#]+)/);
      if (pathMatch && pathMatch[1] && pathMatch[1] !== 'new') {
        rawParam = pathMatch[1];
      }
    }

    const ALIAS_MAP = {
      si: 'sovereign_intervention',
      sovereign: 'sovereign_intervention',
      sb: 'sb_security',
      sb_security: 'sb_security',
      security_brokers: 'sb_security',
      th: 'thompsons_security',
      ms: 'marshals_security',
    };
    
    let resolvedCompany = rawParam ? (ALIAS_MAP[rawParam.toLowerCase()] || rawParam.toLowerCase()) : null;
    if (!resolvedCompany) {
      try {
        const rawH = localStorage.getItem('active_household');
        if (rawH) {
          const h = JSON.parse(rawH);
          if (h.securityCompanyId) resolvedCompany = h.securityCompanyId;
        }
      } catch {}
    }

    // Default to sovereign_intervention if visiting presentation or demo partner
    if (!resolvedCompany && (window.location.pathname.includes('/p/sovereign') || window.location.pathname.includes('sovereign'))) {
      resolvedCompany = 'sovereign_intervention';
    }

    const targetCompany = resolvedCompany || 'sovereign_intervention';
    setCompanyId(targetCompany);
    loadBrand(targetCompany);

    const handleBrandOverride = (e) => {
      if (e.detail) {
        setBrand(e.detail);
        applyCssVariables(e.detail);
      }
    };
    window.addEventListener('safelink_brand_updated', handleBrandOverride);
    return () => window.removeEventListener('safelink_brand_updated', handleBrandOverride);
  }, [loadBrand, applyCssVariables]);

  return (
    <BrandContext.Provider value={{ brand, companyId, setCompanyId: updateCompanyId, refreshBrand: () => loadBrand(companyId), isWhiteLabeled }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrandTheme() {
  return useContext(BrandContext);
}

export const useBrand = useBrandTheme;
