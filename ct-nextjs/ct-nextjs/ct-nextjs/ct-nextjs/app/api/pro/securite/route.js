import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const controleur = await get('SELECT nom, email, totp_actif FROM controleurs WHERE id = ?', [session.controleurId]);
  if (!controleur) return jsonError(404, 'Compte introuvable.');

  return NextResponse.json({ nom: controleur.nom, email: controleur.email, totp_actif: !!controleur.totp_actif });
}
