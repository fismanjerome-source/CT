import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resoudreCentreActif } from '@/lib/pro';
import { jsonError, todayISO } from '@/lib/utils';

// Jusqu'à quelle date le planning est-il déjà ouvert, pour chaque type de
// visite ? Indépendant des dates saisies dans "Combler des horaires vides"
// (qui ne servent qu'à définir une NOUVELLE période à ouvrir) — sans ça,
// un centre qui a déjà ouvert 3 mois voyait le formulaire revenir sur une
// semaine par défaut à chaque rechargement de page, sans aucun moyen de
// voir d'un coup d'œil que les 3 mois étaient bien là.
export async function GET(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const { searchParams } = new URL(request.url);
  const centreId = await resoudreCentreActif(session.controleurId, searchParams.get('centre'));
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  const lignes = await all(
    `SELECT type_visite, MAX(date) AS derniere_date, COUNT(*) AS nombre
     FROM creneaux WHERE centre_id = ? AND statut = 'disponible' AND date >= ?
     GROUP BY type_visite`,
    [centreId, todayISO()]
  );

  const portee = { normale: null, contre_visite: null };
  for (const l of lignes) {
    portee[l.type_visite === 'contre_visite' ? 'contre_visite' : 'normale'] = {
      derniere_date: l.derniere_date,
      nombre: l.nombre,
    };
  }

  return NextResponse.json({ portee });
}
