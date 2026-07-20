import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function PATCH(request, { params }) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { ical_url } = body;

  const centre = await get('SELECT id FROM centres WHERE id = ?', [id]);
  if (!centre) return jsonError(404, 'Centre introuvable.');

  await run('UPDATE centres SET ical_url = ? WHERE id = ?', [ical_url ? ical_url.trim() : null, id]);
  return NextResponse.json({ message: 'Lien agenda mis à jour.' });
}
