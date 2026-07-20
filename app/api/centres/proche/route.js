import { NextResponse } from 'next/server';
import { all, get } from '@/lib/db';
import { jsonError, todayISO, distanceKm } from '@/lib/utils';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  const date = searchParams.get('date'); // optionnel : cible une date précise

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return jsonError(400, 'Coordonnées lat/lng requises.');
  }

  const centres = await all(
    `SELECT id, nom, adresse, code_postal, ville, telephone, enseigne, latitude, longitude
     FROM centres WHERE latitude IS NOT NULL AND longitude IS NOT NULL`
  );

  const centresAvecDistance = centres
    .map((c) => ({ ...c, distance_km: distanceKm(lat, lng, c.latitude, c.longitude) }))
    .sort((a, b) => a.distance_km - b.distance_km);

  const debut = date || todayISO();
  const finFenetre = date || todayISO(21); // sans date précise, on cherche sur 3 semaines

  for (const centre of centresAvecDistance) {
    const creneau = await get(
      `SELECT id, date, heure, prix, promo_pourcentage FROM creneaux
       WHERE centre_id = ? AND statut = 'disponible' AND date BETWEEN ? AND ?
       ORDER BY date, heure LIMIT 1`,
      [centre.id, debut, finFenetre]
    );
    if (creneau) {
      return NextResponse.json({
        centre: {
          id: centre.id, nom: centre.nom, adresse: centre.adresse,
          code_postal: centre.code_postal, ville: centre.ville,
          enseigne: centre.enseigne, distance_km: Math.round(centre.distance_km * 10) / 10,
        },
        creneau,
      });
    }
  }

  return jsonError(404, 'Aucun créneau disponible dans les centres à proximité pour le moment.');
}
