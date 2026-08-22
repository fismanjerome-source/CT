import { NextResponse } from 'next/server';
import { all } from '@/lib/db';

export async function GET(request, { params }) {
  const { id } = await params;

  const avis = await all(
    `SELECT note, commentaire, client_prenom, created_at FROM avis WHERE centre_id = ? AND visible = 1 ORDER BY created_at DESC`,
    [id]
  );

  const total = avis.length;
  const moyenne = total > 0 ? Math.round((avis.reduce((s, a) => s + a.note, 0) / total) * 10) / 10 : null;

  return NextResponse.json({ avis, total, moyenne });
}
