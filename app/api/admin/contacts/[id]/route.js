import { NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function PATCH(request, { params }) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const statut = body.statut === 'traite' ? 'traite' : 'nouveau';

  await run('UPDATE contacts SET statut = ? WHERE id = ?', [statut, id]);
  return NextResponse.json({ message: 'Statut mis à jour.' });
}
