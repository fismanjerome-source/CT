import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const rdvs = await all(
    `SELECT r.*, c.date, c.heure FROM rdv r JOIN creneaux c ON c.id = r.creneau_id
     WHERE c.controleur_id = ? AND r.statut = 'confirme' ORDER BY c.date, c.heure`,
    [session.controleurId]
  );

  return NextResponse.json({ rdvs });
}
