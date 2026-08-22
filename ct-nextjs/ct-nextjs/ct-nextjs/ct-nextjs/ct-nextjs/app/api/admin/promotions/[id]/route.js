import { NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function DELETE(request, { params }) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const { id } = await params;
  await run('DELETE FROM promotions WHERE id = ?', [id]);

  return NextResponse.json({ message: 'Promotion supprimée.' });
}
