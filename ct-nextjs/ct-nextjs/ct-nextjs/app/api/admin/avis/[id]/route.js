import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function PATCH(request, { params }) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const { id } = await params;
  const avis = await get('SELECT id, visible FROM avis WHERE id = ?', [id]);
  if (!avis) return jsonError(404, 'Avis introuvable.');

  await run('UPDATE avis SET visible = ? WHERE id = ?', [avis.visible ? 0 : 1, id]);
  return NextResponse.json({ message: avis.visible ? 'Avis masqué.' : 'Avis remis visible.' });
}
