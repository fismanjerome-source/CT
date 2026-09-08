import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import Script from 'next/script';
import { SiteProvider } from './components/SiteContext';
import './globals.css';

// Fraunces (titres) + IBM Plex Sans (texte) + IBM Plex Mono (données) :
// remplace Outfit/DM Sans/Fira Code, des choix "sûrs" très répandus dans les
// designs génériques — Fraunces apporte un vrai caractère éditorial en
// display, IBM Plex a été dessinée par IBM spécifiquement pour un usage
// technique/logiciel, cohérent avec l'identité "instrument de contrôle" du
// site plutôt qu'une sans-serif géométrique interchangeable.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
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
  alternates: { canonical: '/' },
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

// Site par défaut ("vl") — codé en dur, jamais lu depuis une donnée de
// requête (headers/cookies) : c'est justement ce qui permet à Next.js de
// continuer à pré-générer cette page statiquement. Le sous-domaine
// pl.creneauct.fr est servi par app/pl/*, qui fournit "pl" à la place via
// son propre layout — voir middleware.js pour la réécriture d'URL.
export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
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
        <SiteProvider site="vl">{children}</SiteProvider>
      </body>
    </html>
  );
}
