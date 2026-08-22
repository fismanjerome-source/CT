import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resoudreCentreActif } from '@/lib/pro';
import { jsonError } from '@/lib/utils';

export async function GET(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const { searchParams } = new URL(request.url);
  const centreId = await resoudreCentreActif(session.controleurId, searchParams.get('centre'));
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  const factures = await all(
    `SELECT
       strftime('%Y-%m', r.created_at) AS mois,
       COUNT(r.id) AS nombre_rdv,
       COALESCE(SUM(r.commission_montant), 0) AS total_commission
     FROM rdv r JOIN creneaux c ON c.id = r.creneau_id
     WHERE c.centre_id = ? AND r.statut = 'confirme'
     GROUP BY mois
     ORDER BY mois DESC`,
    [centreId]
  );

  return NextResponse.json({ factures });
}
