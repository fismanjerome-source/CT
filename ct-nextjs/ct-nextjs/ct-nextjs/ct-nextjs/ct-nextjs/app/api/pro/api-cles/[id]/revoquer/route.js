import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resoudreCentreActif } from '@/lib/pro';
import { jsonError } from '@/lib/utils';

export async function POST(request, { params }) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const centreId = await resoudreCentreActif(session.controleurId, searchParams.get('centre'));
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  const cle = await get('SELECT id FROM api_cles WHERE id = ? AND centre_id = ?', [id, centreId]);
  if (!cle) return jsonError(404, 'Clé introuvable.');

  await run('UPDATE api_cles SET actif = 0 WHERE id = ?', [id]);
  return NextResponse.json({ message: 'Clé révoquée.' });
}
