import { NextResponse } from 'next/server';
import { all, run } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

// Supprime en une fois tous les créneaux ENCORE DISPONIBLES d'une période
// (jamais un créneau déjà réservé, comme pour la suppression individuelle) —
// utile notamment pour rattraper un lot ouvert avec le mauvais type de
// visite ou le mauvais prix via "Combler des horaires vides", sans avoir à
// supprimer des centaines de créneaux un par un.
export async function POST(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const { centre_id, date_debut, date_fin, type_visite } = body;

  if (!centre_id || !date_debut || !date_fin) {
    return jsonError(400, 'Centre, date de début et date de fin requis.');
  }

  const acces = await all(
    'SELECT 1 FROM controleur_centres WHERE controleur_id = ? AND centre_id = ?',
    [session.controleurId, centre_id]
  );
  if (acces.length === 0) return jsonError(403, "Vous n'avez pas accès à ce centre.");

  const typeVisiteFiltre = type_visite === 'contre_visite' ? 'contre_visite' : type_visite === 'normale' ? 'normale' : null;

  const resultat = await run(
    `DELETE FROM creneaux
     WHERE centre_id = ? AND statut = 'disponible' AND date >= ? AND date <= ?
     ${typeVisiteFiltre ? 'AND type_visite = ?' : ''}`,
    typeVisiteFiltre ? [centre_id, date_debut, date_fin, typeVisiteFiltre] : [centre_id, date_debut, date_fin]
  );

  const nombre = resultat.rowsAffected ?? 0;
  return NextResponse.json({
    message: nombre > 0
      ? `${nombre} créneau(x) supprimé(s).`
      : 'Aucun créneau disponible à supprimer sur cette période (les créneaux déjà réservés ne sont jamais touchés).',
    nombre_supprimes: nombre,
  });
}
