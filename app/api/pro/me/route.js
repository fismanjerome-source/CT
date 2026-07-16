import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const controleur = await get('SELECT id, nom, email, centre_id FROM controleurs WHERE id = ?', [session.controleurId]);
  if (!controleur) return jsonError(401, 'Compte introuvable.');
  const centre = await get('SELECT * FROM centres WHERE id = ?', [controleur.centre_id]);

  return NextResponse.json({ controleur, centre });
}
