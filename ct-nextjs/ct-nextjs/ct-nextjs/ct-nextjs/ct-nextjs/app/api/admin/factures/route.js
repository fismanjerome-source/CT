import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  // Une facture par centre et par mois, uniquement s'il y a eu au moins un
  // RDV confirmé ce mois-là. Le mois est déterminé par la date de
  // réservation (created_at), pas par la date du contrôle technique — la
  // commission est due dès la réservation.
  const factures = await all(`
    SELECT
      ce.id AS centre_id,
      ce.nom AS centre_nom,
      ce.enseigne,
      ce.ville,
      strftime('%Y-%m', r.created_at) AS mois,
      COUNT(r.id) AS nombre_rdv,
      COALESCE(SUM(r.commission_montant), 0) AS total_commission
    FROM rdv r
    JOIN creneaux c ON c.id = r.creneau_id
    JOIN centres ce ON ce.id = c.centre_id
    WHERE r.statut = 'confirme'
    GROUP BY ce.id, mois
    ORDER BY mois DESC, total_commission DESC
  `);

  return NextResponse.json({ factures });
}
