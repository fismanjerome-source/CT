import { NextResponse } from 'next/server';
import { all, get } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function GET(request) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const { searchParams } = new URL(request.url);
  const jours = Number(searchParams.get('jours')) || 30;
  const depuis = new Date();
  depuis.setDate(depuis.getDate() - jours);
  const depuisISO = depuis.toISOString();

  const totaux = await all(
    `SELECT categorie, COUNT(*) AS total FROM visites WHERE created_at >= ? GROUP BY categorie`,
    [depuisISO]
  );

  const parJour = await all(
    `SELECT substr(created_at, 1, 10) AS jour, categorie, COUNT(*) AS total
     FROM visites WHERE created_at >= ? GROUP BY jour, categorie ORDER BY jour`,
    [depuisISO]
  );

  const parVille = await all(
    `SELECT ville, region, COUNT(*) AS total FROM visites
     WHERE created_at >= ? AND ville IS NOT NULL
     GROUP BY ville, region ORDER BY total DESC LIMIT 15`,
    [depuisISO]
  );

  const parRegion = await all(
    `SELECT region, COUNT(*) AS total FROM visites
     WHERE created_at >= ? AND region IS NOT NULL
     GROUP BY region ORDER BY total DESC LIMIT 15`,
    [depuisISO]
  );

  const pagesPopulaires = await all(
    `SELECT chemin, COUNT(*) AS total FROM visites
     WHERE created_at >= ? GROUP BY chemin ORDER BY total DESC LIMIT 10`,
    [depuisISO]
  );

  const { total: totalGeolocalisees } = await get(
    `SELECT COUNT(*) AS total FROM visites WHERE created_at >= ? AND ville IS NOT NULL`,
    [depuisISO]
  );
  const { total: totalGeneral } = await get(
    `SELECT COUNT(*) AS total FROM visites WHERE created_at >= ?`,
    [depuisISO]
  );

  return NextResponse.json({
    totaux,
    par_jour: parJour,
    par_ville: parVille,
    par_region: parRegion,
    pages_populaires: pagesPopulaires,
    taux_geolocalisation: totalGeneral > 0 ? Math.round((totalGeolocalisees / totalGeneral) * 100) : 0,
  });
}
