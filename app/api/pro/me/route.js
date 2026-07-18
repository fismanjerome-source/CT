import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resoudreCentreActif, listerMesCentres } from '@/lib/pro';
import { jsonError } from '@/lib/utils';

export async function GET(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const { searchParams } = new URL(request.url);
  const centreDemande = searchParams.get('centre');

  const controleur = await get('SELECT id, nom, email, telephone, centre_id FROM controleurs WHERE id = ?', [session.controleurId]);
  if (!controleur) return jsonError(401, 'Compte introuvable.');

  const centreActifId = await resoudreCentreActif(session.controleurId, centreDemande);
  const centre = await get('SELECT * FROM centres WHERE id = ?', [centreActifId]);
  const mesCentres = await listerMesCentres(session.controleurId);

  return NextResponse.json({ controleur, centre, mesCentres });
}
