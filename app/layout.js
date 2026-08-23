import { Outfit, DM_Sans, Fira_Code } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

const SITE_URL = process.env.SITE_URL || 'https://ct-rdv.onrender.com';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Créneau CT — Réservez votre contrôle technique en ligne',
    template: '%s — Créneau CT',
  },
  description: "Trouvez et réservez en ligne un créneau de contrôle technique près de chez vous, y compris de dernière minute. Comparez les centres, réservez en 2 minutes, sans frais supplémentaires.",
  keywords: ['contrôle technique', 'contrôle technique en ligne', 'rendez-vous contrôle technique', 'centre de contrôle technique', 'CT voiture', 'CT moto'],
  openGraph: {
    title: 'Créneau CT — Réservez votre contrôle technique en ligne',
    description: "Trouvez et réservez en ligne un créneau de contrôle technique près de chez vous, y compris de dernière minute.",
    url: SITE_URL,
    siteName: 'Créneau CT',
    locale: 'fr_FR',
    type: 'website',
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Créneau CT',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport = {
  themeColor: '#1B3A5C',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${outfit.variable} ${dmSans.variable} ${firaCode.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
              var t = localStorage.getItem('creneau-ct-theme');
              if (t === 'dark') {
                document.documentElement.dataset.theme = t;
              } else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.dataset.theme = 'dark';
              }
            } catch (e) {}`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) {
              window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js').catch(function () {});
              });
            }`,
          }}
        />
      </head>
      <body>
        {process.env.NEXT_PUBLIC_CF_BEACON_TOKEN && (
          <Script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: process.env.NEXT_PUBLIC_CF_BEACON_TOKEN })}
          />
        )}
        {children}
      </body>
    </html>
  );
}
