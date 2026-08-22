import { NextResponse } from 'next/server';
import { get, all } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resoudreCentreActif } from '@/lib/pro';
import { jsonError } from '@/lib/utils';

export async function GET(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const { searchParams } = new URL(request.url);
  const centreId = await resoudreCentreActif(session.controleurId, searchParams.get('centre'));
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  const centre = await get('SELECT code_parrainage FROM centres WHERE id = ?', [centreId]);
  if (!centre) return jsonError(404, 'Centre introuvable.');

  const filleuls = centre.code_parrainage
    ? await all(
        `SELECT nom, ville, created_at, parrainage_recompense_le FROM centres WHERE parraine_par_code = ? ORDER BY created_at DESC`,
        [centre.code_parrainage]
      )
    : [];

  return NextResponse.json({ code_parrainage: centre.code_parrainage, filleuls });
}
