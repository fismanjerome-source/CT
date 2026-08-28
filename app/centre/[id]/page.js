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
      alternates: { canonical: `/centre/${id}` },
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
  let initialCentre = null;

  try {
    // Une seule requête, réutilisée à la fois pour les données structurées
    // (SEO) et pour le rendu initial côté serveur : sans elle, le nom et
    // l'adresse du centre n'apparaissaient que côté client, invisibles à
    // Google et à tout aperçu de partage sur les réseaux.
    // Colonnes explicites plutôt que SELECT * : évite de ramener depuis la
    // base des colonnes internes (note_interne, commission_taux_fixe,
    // ical_url — le lien d'agenda PRIVÉ du centre) et surtout la photo
    // encodée en base64 (jusqu'à ~800 Ko), inutile ici puisqu'elle est
    // désormais servie à part par /api/centres/[id]/image — sans quoi
    // chaque chargement de cette page la retéléchargeait intégralement
    // depuis la base à chaque requête, sans aucune mise en cache.
    const centre = await get(
      `SELECT id, nom, adresse, code_postal, ville, telephone, enseigne, types_vehicules_acceptes,
         (image_data IS NOT NULL) AS a_une_image, est_premium, est_demo, latitude, longitude
       FROM centres WHERE id = ?`,
      [id]
    );
    // Liste blanche des champs publics uniquement (jamais un simple
    // {...centre} transmis tel quel) — voir ci-dessus pour la raison. Un
    // objet litéral simple ici règle aussi, en passant, l'avertissement
    // React "Only plain objects can be passed..." — une ligne renvoyée par
    // @libsql/client n'étant pas un objet "plain".
    initialCentre = centre ? {
      id: centre.id,
      nom: centre.nom,
      adresse: centre.adresse,
      code_postal: centre.code_postal,
      ville: centre.ville,
      enseigne: centre.enseigne,
      types_vehicules_acceptes: centre.types_vehicules_acceptes,
      a_une_image: centre.a_une_image,
      est_premium: centre.est_premium,
      est_demo: centre.est_demo,
    } : null;
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
        <CentrePageClient id={id} initialTypeVisite={sp?.visite} initialCentre={initialCentre} />
      </Suspense>
    </>
  );
}
