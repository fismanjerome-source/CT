import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function GET(request, { params }) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const { cle } = await params;
  const doc = await get('SELECT * FROM documents_legaux WHERE cle = ?', [cle]);
  if (!doc) return jsonError(404, 'Document introuvable.');
  return NextResponse.json({ document: doc });
}

export async function PATCH(request, { params }) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const { cle } = await params;
  const body = await request.json().catch(() => ({}));
  const { contenu } = body;
  if (!contenu || !contenu.trim()) return jsonError(400, 'Le contenu ne peut pas être vide.');

  await run(
    `INSERT INTO documents_legaux (cle, contenu, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(cle) DO UPDATE SET contenu = excluded.contenu, updated_at = excluded.updated_at`,
    [cle, contenu, new Date().toISOString()]
  );
  return NextResponse.json({ message: 'Document mis à jour.' });
}
