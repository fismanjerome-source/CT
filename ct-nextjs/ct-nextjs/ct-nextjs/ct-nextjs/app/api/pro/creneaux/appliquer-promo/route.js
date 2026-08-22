import { NextResponse } from 'next/server';
import { all, run } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

// Permet d'appliquer une remise différente à chaque période, indépendamment
// les unes des autres (ex : 20 % sur la semaine du 3 au 9, 25 % sur celle du
// 10 au 16, et rien sur le reste) — contrairement à « Combler les horaires
// vides » qui ne fait que créer de nouveaux créneaux, ceci modifie les
// créneaux disponibles déjà existants.
export async function POST(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const { centre_id, date_debut, date_fin, promo_pourcentage } = body;

  if (!centre_id || !date_debut || !date_fin) {
    return jsonError(400, 'Centre, date de début et date de fin requis.');
  }

  const acces = await all(
    'SELECT 1 FROM controleur_centres WHERE controleur_id = ? AND centre_id = ?',
    [session.controleurId, centre_id]
  );
  if (acces.length === 0) return jsonError(403, "Vous n'avez pas accès à ce centre.");

  const nouveauPourcentage = promo_pourcentage === '' || promo_pourcentage == null ? null : Number(promo_pourcentage);
  if (nouveauPourcentage != null && (Number.isNaN(nouveauPourcentage) || nouveauPourcentage <= 0 || nouveauPourcentage > 90)) {
    return jsonError(400, 'La remise doit être comprise entre 1 et 90 %, ou vide pour la retirer.');
  }

  const resultat = await run(
    `UPDATE creneaux SET promo_pourcentage = ?
     WHERE centre_id = ? AND statut = 'disponible' AND date >= ? AND date <= ?`,
    [nouveauPourcentage, centre_id, date_debut, date_fin]
  );

  return NextResponse.json({
    message: nouveauPourcentage
      ? `Remise de ${nouveauPourcentage} % appliquée aux créneaux disponibles de la période.`
      : 'Remise retirée sur les créneaux disponibles de la période.',
    creneaux_modifies: resultat.rowsAffected ?? null,
  });
}
