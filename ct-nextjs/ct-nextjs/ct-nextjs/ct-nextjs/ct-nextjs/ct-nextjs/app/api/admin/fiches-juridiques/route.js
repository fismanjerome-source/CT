import { NextResponse } from 'next/server';
import { all, run } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');
  const fiches = await all('SELECT * FROM fiches_juridiques ORDER BY ordre, id');
  return NextResponse.json({ fiches });
}

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const body = await request.json().catch(() => ({}));
  const { titre, resume, contenu, lien_externe, lien_libelle, ordre } = body;
  if (!titre || !contenu) return jsonError(400, 'Titre et contenu sont requis.');

  const maintenant = new Date().toISOString();
  const result = await run(
    `INSERT INTO fiches_juridiques (titre, resume, contenu, lien_externe, lien_libelle, ordre, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [titre, resume || null, contenu, lien_externe || null, lien_libelle || null, Number(ordre) || 0, maintenant, maintenant]
  );
  return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
}
