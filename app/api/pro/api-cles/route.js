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

  const cles = await all(
    `SELECT id, nom, created_at, derniere_utilisation, actif,
            cle_apercu AS cle_masquee
     FROM api_cles WHERE centre_id = ? ORDER BY created_at DESC`,
    [centreId]
  );
  return NextResponse.json({ cles });
}
