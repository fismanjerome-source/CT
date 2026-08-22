import { NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError, todayISO } from '@/lib/utils';

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const body = await request.json().catch(() => ({}));
  const { centre_id, mois, statut } = body;

  if (!centre_id || !mois || !['paye', 'non_paye'].includes(statut)) {
    return jsonError(400, 'Centre, mois et statut (paye/non_paye) sont requis.');
  }

  await run(
    `INSERT INTO factures_statuts (centre_id, mois, statut, paye_le)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(centre_id, mois) DO UPDATE SET statut = excluded.statut, paye_le = excluded.paye_le`,
    [centre_id, mois, statut, statut === 'paye' ? todayISO() : null]
  );

  return NextResponse.json({ message: statut === 'paye' ? 'Marqué comme payé.' : 'Marqué comme non payé.' });
}
