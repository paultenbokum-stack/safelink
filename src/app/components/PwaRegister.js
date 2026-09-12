'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const InstallContext = createContext(null);
const DISMISS_KEY = 'safelink_pwa_dismissed';

export default function PwaRegister({ children }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [platform, setPlatform] = useState('desktop');

  useEffect(() => {
    // Register even when hydration happens after the window load event.
    const register = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
          .catch((error) => console.warn('[PWA] Registration failed:', error));
      }
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });

    const standalone = window.matchMedia('(display-mode: standalone)');
    const syncDisplayMode = () => setInstalled(standalone.matches || navigator.standalone === true);
    // Let the initial page settle before offering installation.
    const timer = window.setTimeout(() => {
      syncDisplayMode();
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setPlatform(ios ? 'ios' : /Android/.test(navigator.userAgent) ? 'android' : 'desktop');
      try {
        setDismissed(Number(localStorage.getItem(DISMISS_KEY)) > Date.now());
      } catch { /* Still usable when storage is unavailable. */ }
      setReady(true);
    }, 500);

    const beforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const appInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', appInstalled);
    standalone.addEventListener('change', syncDisplayMode);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', register);
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', appInstalled);
      standalone.removeEventListener('change', syncDisplayMode);
    };
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    } catch { /* Keep the dismissal for this visit. */ }
  };

  const install = async () => {
    if (!installPrompt) return false;
    const prompt = installPrompt;
    setInstallPrompt(null); // Browser install events can only be used once.
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      else dismiss();
      return true;
    } catch {
      return false; // Fall back to manual instructions if the event expired.
    }
  };

  return (
    <InstallContext.Provider value={{ visible: ready && !installed && !dismissed, canInstall: !!installPrompt, platform, install, dismiss }}>
      {children}
    </InstallContext.Provider>
  );
}

export function InstallAppPrompt() {
  const context = useContext(InstallContext);
  const [showHelp, setShowHelp] = useState(false);
  const [installing, setInstalling] = useState(false);
  if (!context?.visible) return null;

  const handleInstall = async () => {
    setInstalling(true);
    const handled = await context.install();
    setInstalling(false);
    if (!handled) setShowHelp(true);
  };

  return (
    <aside aria-label="Install SafeLink app" className="rounded-2xl border border-secondary/40 bg-surface-container p-4 text-left text-on-surface shadow-sm">
      <h2 className="text-base font-bold">Take SafeLink with you</h2>
      <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">Install SafeLink as an app for quick access from your home screen.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={installing} onClick={context.canInstall ? handleInstall : () => setShowHelp(!showHelp)}
          aria-expanded={context.canInstall ? undefined : showHelp}
          className="min-h-11 rounded-xl bg-secondary px-4 py-2 text-sm font-bold text-on-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60">
          {installing ? 'Opening installer…' : context.canInstall ? 'Install app' : 'How to install'}
        </button>
        <button type="button" onClick={context.dismiss} className="min-h-11 rounded-xl px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Not now</button>
      </div>
      {showHelp && (
        <p role="status" className="mt-3 text-sm leading-relaxed text-on-surface-variant">
          {context.platform === 'ios'
            ? 'On iPhone or iPad, open SafeLink in Safari, tap Share, then Add to Home Screen. If shown, turn on Open as Web App, then tap Add.'
            : context.platform === 'android'
              ? 'In Chrome, open the three-dot menu and choose Add to Home screen or Install app, then follow the instructions. If the option is missing, try opening SafeLink directly in Chrome.'
              : 'Look for Install app in your browser’s address bar or menu. In Safari on Mac, choose File → Add to Dock. If your browser does not offer installation, you can keep using SafeLink here.'}
        </p>
      )}
    </aside>
  );
}
