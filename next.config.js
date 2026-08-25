// CSP sans nonce (garde le rendu statique des pages) : autorise le style et
// le script en ligne, car ce projet utilise massivement les props style={{}}
// et quelques scripts injectés par Next.js — un CSP strict à base de nonce
// forcerait tout le site en rendu dynamique. Reste utile contre le
// chargement de ressources externes non prévues, le clickjacking, le vol de
// formulaire et l'injection de balise <base>.
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://*.cloudflareinsights.com",
  "worker-src 'self'",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Retire l'en-tête "X-Powered-By: Next.js" — ne change rien au
  // fonctionnement, évite juste d'annoncer gratuitement la stack technique.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Empêche le site d'être affiché dans un cadre invisible sur un autre site (clickjacking).
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: cspHeader },
          // Empêche le navigateur de deviner le type d'un fichier différemment de ce qu'annonce le serveur.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Force HTTPS pendant 2 ans, y compris pour les sous-domaines, une fois activé.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          // Limite les informations envoyées aux sites externes lors d'un clic sortant.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Désactive l'accès à la caméra/micro/géolocalisation par défaut pour le site.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
