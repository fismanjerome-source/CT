import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { resoudreCentreActif } from '@/lib/pro';
import { jsonError } from '@/lib/utils';
import { facturesEnRetard, commissionMoisEnCours } from '@/lib/facturation';

export async function GET(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const { searchParams } = new URL(request.url);
  const centreId = await resoudreCentreActif(session.controleurId, searchParams.get('centre'));
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  const retards = await facturesEnRetard(centreId);
  const moisEnCours = await commissionMoisEnCours(centreId);

  return NextResponse.json({ retards, bloque: retards.length > 0, mois_en_cours: moisEnCours });
}
