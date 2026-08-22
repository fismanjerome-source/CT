import { all } from '@/lib/db';

const SITE_URL = process.env.SITE_URL || 'https://ct-rdv.onrender.com';

export default async function sitemap() {
  const pagesStatiques = [
    { url: '', priorite: 1.0, frequence: 'daily' },
    { url: '/guide', priorite: 0.8, frequence: 'monthly' },
    { url: '/guide/auto', priorite: 0.7, frequence: 'monthly' },
    { url: '/guide/moto', priorite: 0.7, frequence: 'monthly' },
    { url: '/faq-clients', priorite: 0.6, frequence: 'monthly' },
    { url: '/faq-centres', priorite: 0.5, frequence: 'monthly' },
    { url: '/suivi', priorite: 0.4, frequence: 'monthly' },
    { url: '/contact', priorite: 0.4, frequence: 'monthly' },
    { url: '/partenaires', priorite: 0.3, frequence: 'monthly' },
    { url: '/pro/login', priorite: 0.5, frequence: 'monthly' },
    { url: '/pro/register', priorite: 0.5, frequence: 'monthly' },
    { url: '/cgu', priorite: 0.2, frequence: 'yearly' },
    { url: '/mentions-legales', priorite: 0.2, frequence: 'yearly' },
  ].map((p) => ({
    url: `${SITE_URL}${p.url}`,
    changeFrequency: p.frequence,
    priority: p.priorite,
  }));

  let pagesCentres = [];
  try {
    const centres = await all('SELECT id FROM centres');
    pagesCentres = centres.map((c) => ({
      url: `${SITE_URL}/centre/${c.id}`,
      changeFrequency: 'daily',
      priority: 0.9,
    }));
  } catch {
    // Si la base est indisponible au moment de la génération, on renvoie
    // au moins les pages statiques plutôt que de faire échouer le sitemap.
  }

  return [...pagesStatiques, ...pagesCentres];
}
