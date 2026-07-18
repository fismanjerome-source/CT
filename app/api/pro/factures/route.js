import { NextResponse } from 'next/server';
import { all, get } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const controleur = await get('SELECT centre_id FROM controleurs WHERE id = ?', [session.controleurId]);

  const factures = await all(
    `SELECT
       strftime('%Y-%m', r.created_at) AS mois,
       COUNT(r.id) AS nombre_rdv,
       COALESCE(SUM(r.commission_montant), 0) AS total_commission
     FROM rdv r JOIN creneaux c ON c.id = r.creneau_id
     WHERE c.centre_id = ? AND r.statut = 'confirme'
     GROUP BY mois
     ORDER BY mois DESC`,
    [controleur.centre_id]
  );

  return NextResponse.json({ factures });
}
