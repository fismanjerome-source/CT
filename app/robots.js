const SITE_URL = process.env.SITE_URL || 'https://ct-rdv.onrender.com';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      // /pro/login et /pro/register sont les deux seules pages de l'espace
      // pro destinées à être trouvées par un centre qui cherche à s'inscrire
      // (elles sont d'ailleurs dans le sitemap) — une règle "Allow" plus
      // spécifique l'emporte sur le "Disallow: /pro/" plus large qui bloque
      // le reste de l'espace pro (tableau de bord, factures, clients...).
      allow: ['/', '/pro/login', '/pro/register'],
      disallow: ['/pro/', '/admin/', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
