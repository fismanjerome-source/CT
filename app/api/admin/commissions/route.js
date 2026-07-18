import { NextResponse } from 'next/server';
import { all, get } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const parCentre = await all(`
    SELECT
      ce.id AS centre_id,
      ce.nom AS centre_nom,
      ce.enseigne,
      ce.ville,
      COUNT(r.id) AS nombre_rdv,
      COALESCE(SUM(r.commission_montant), 0) AS total_commission
    FROM centres ce
    LEFT JOIN creneaux c ON c.centre_id = ce.id
    LEFT JOIN rdv r ON r.creneau_id = c.id AND r.statut = 'confirme'
    GROUP BY ce.id
    ORDER BY total_commission DESC
  `);

  const { total_general } = await get(`
    SELECT COALESCE(SUM(commission_montant), 0) AS total_general
    FROM rdv WHERE statut = 'confirme'
  `);

  const { nombre_rdv_total } = await get(`
    SELECT COUNT(*) AS nombre_rdv_total FROM rdv WHERE statut = 'confirme'
  `);

  return NextResponse.json({ centres: parCentre, total_general, nombre_rdv_total });
}
