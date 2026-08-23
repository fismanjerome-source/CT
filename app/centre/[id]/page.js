import { Suspense } from 'react';
import { get } from '@/lib/db';
import CentrePageClient from './CentrePageClient';

export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    const centre = await get('SELECT nom, ville, adresse, enseigne FROM centres WHERE id = ?', [id]);
    if (!centre) {
      return { title: 'Centre introuvable' };
    }
    const titre = `Contrôle technique ${centre.nom} — ${centre.ville}`;
    const description = `Réservez en ligne votre contrôle technique chez ${centre.nom}${centre.enseigne ? ` (${centre.enseigne})` : ''}, ${centre.adresse}, ${centre.ville}. Créneaux disponibles en temps réel, y compris de dernière minute.`;
    return {
      title: titre,
      description,
      openGraph: { title: titre, description },
    };
  } catch {
    return { title: 'Centre de contrôle technique' };
  }
}

export default async function CentrePage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  let donneesStructurees = null;

  try {
    const centre = await get('SELECT nom, ville, code_postal, adresse, telephone, latitude, longitude FROM centres WHERE id = ?', [id]);
    if (centre) {
      donneesStructurees = {
        '@context': 'https://schema.org',
        '@type': 'AutomotiveBusiness',
        name: centre.nom,
        address: {
          '@type': 'PostalAddress',
          streetAddress: centre.adresse,
          addressLocality: centre.ville,
          postalCode: centre.code_postal,
          addressCountry: 'FR',
        },
        ...(centre.telephone ? { telephone: centre.telephone } : {}),
        ...(centre.latitude && centre.longitude
          ? { geo: { '@type': 'GeoCoordinates', latitude: centre.latitude, longitude: centre.longitude } }
          : {}),
      };
    }
  } catch {
    // Pas grave si indisponible : les données structurées sont un bonus, pas un bloquant.
  }

  return (
    <>
      {donneesStructurees && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesStructurees) }}
        />
      )}
      <Suspense fallback={<div className="container" style={{ padding: 40 }}><p className="help-text">Chargement…</p></div>}>
        <CentrePageClient params={params} initialTypeVisite={sp?.visite} />
      </Suspense>
    </>
  );
}
