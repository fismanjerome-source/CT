import { NextResponse } from 'next/server';
import { all, run } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

// Modifie le prix des créneaux ENCORE DISPONIBLES d'une période (jamais un
// créneau déjà réservé) — nécessaire car "Combler des horaires vides" ne
// touche jamais un créneau déjà existant (pour ne jamais créer de doublon),
// donc rouvrir les mêmes horaires avec un prix différent ne changeait rien
// au prix déjà en place. C'est l'outil à utiliser pour corriger un prix.
export async function POST(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const { centre_id, date_debut, date_fin, prix, type_visite } = body;

  if (!centre_id || !date_debut || !date_fin) {
    return jsonError(400, 'Centre, date de début et date de fin requis.');
  }
  if (prix === '' || prix == null || Number.isNaN(Number(prix)) || Number(prix) < 0) {
    return jsonError(400, 'Le nouveau prix est requis (0 accepté pour une contre-visite gratuite).');
  }

  const acces = await all(
    'SELECT 1 FROM controleur_centres WHERE controleur_id = ? AND centre_id = ?',
    [session.controleurId, centre_id]
  );
  if (acces.length === 0) return jsonError(403, "Vous n'avez pas accès à ce centre.");

  const typeVisiteFiltre = type_visite === 'contre_visite' ? 'contre_visite' : type_visite === 'normale' ? 'normale' : null;

  const resultat = await run(
    `UPDATE creneaux SET prix = ?
     WHERE centre_id = ? AND statut = 'disponible' AND date >= ? AND date <= ?
     ${typeVisiteFiltre ? 'AND type_visite = ?' : ''}`,
    typeVisiteFiltre ? [Number(prix), centre_id, date_debut, date_fin, typeVisiteFiltre] : [Number(prix), centre_id, date_debut, date_fin]
  );

  const nombre = resultat.rowsAffected ?? 0;
  return NextResponse.json({
    message: nombre > 0
      ? `Prix mis à jour sur ${nombre} créneau(x).`
      : 'Aucun créneau disponible à modifier sur cette période (les créneaux déjà réservés gardent leur prix).',
    nombre_modifies: nombre,
  });
}
