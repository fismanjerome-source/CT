const SITE_URL = process.env.SITE_URL || 'https://ct-rdv.onrender.com';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/pro/', '/admin/', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
