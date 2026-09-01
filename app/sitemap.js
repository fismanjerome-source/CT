import { headers } from 'next/headers';
import { all } from '@/lib/db';
import { detecterSite } from '@/lib/site';
import { parseTypes, typesParSite } from '@/lib/vehicules';

const SITE_URL = process.env.SITE_URL || 'https://ct-rdv.onrender.com';
const SITE_URL_PL = 'https://pl.creneauct.fr';

// Fichier indépendant du layout principal : lire le host ici ne rend pas
// le reste du site dynamique (voir app/pl/ et middleware.js pour la
// séparation qui, elle, doit rester statiquement optimisable).
export default async function sitemap() {
  const host = (await headers()).get('host');
  const site = detecterSite(host);
  const baseUrl = site === 'pl' ? SITE_URL_PL : SITE_URL;

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
    url: `${baseUrl}${p.url}`,
    changeFrequency: p.frequence,
    priority: p.priorite,
  }));

  let pagesCentres = [];
  try {
    const valeursSite = typesParSite(site).map((t) => t.value);
    const centres = await all('SELECT id, types_vehicules_acceptes FROM centres');
    pagesCentres = centres
      .filter((c) => {
        const types = parseTypes(c.types_vehicules_acceptes);
        if (types.length === 0) return site === 'vl'; // même repli que /api/centres
        return types.some((v) => valeursSite.includes(v));
      })
      .map((c) => ({
        url: `${baseUrl}/centre/${c.id}`,
        changeFrequency: 'daily',
        priority: 0.9,
      }));
  } catch {
    // Si la base est indisponible au moment de la génération, on renvoie
    // au moins les pages statiques plutôt que de faire échouer le sitemap.
  }

  return [...pagesStatiques, ...pagesCentres];
}
