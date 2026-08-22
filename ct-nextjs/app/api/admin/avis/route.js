import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const avis = await all(
    `SELECT a.id, a.note, a.commentaire, a.client_prenom, a.visible, a.created_at, c.nom AS centre_nom
     FROM avis a JOIN centres c ON c.id = a.centre_id
     ORDER BY a.created_at DESC`
  );
  return NextResponse.json({ avis });
}
