import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata = {
  title: 'SafeLink - Digital Bodyguard',
  description: 'Your Safety. Our Priority. Armed response, Sentinel devices, and emergency services at your fingertips.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#041522',
};

import PwaRegister from '@/app/components/PwaRegister';
import GpsConsentModal from '@/app/components/GpsConsentModal';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-background min-h-screen selection:bg-secondary/30 selection:text-secondary">
        <AuthProvider>
          <PwaRegister />
          <GpsConsentModal />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
