import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function PATCH(request, { params }) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const { id } = await params;
  const fiche = await get('SELECT id FROM fiches_juridiques WHERE id = ?', [id]);
  if (!fiche) return jsonError(404, 'Fiche introuvable.');

  const body = await request.json().catch(() => ({}));
  const { titre, resume, contenu, lien_externe, lien_libelle, ordre } = body;
  if (!titre || !contenu) return jsonError(400, 'Titre et contenu sont requis.');

  await run(
    `UPDATE fiches_juridiques SET titre = ?, resume = ?, contenu = ?, lien_externe = ?, lien_libelle = ?, ordre = ?, updated_at = ? WHERE id = ?`,
    [titre, resume || null, contenu, lien_externe || null, lien_libelle || null, Number(ordre) || 0, new Date().toISOString(), id]
  );
  return NextResponse.json({ message: 'Fiche mise à jour.' });
}

export async function DELETE(request, { params }) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const { id } = await params;
  await run('DELETE FROM fiches_juridiques WHERE id = ?', [id]);
  return NextResponse.json({ message: 'Fiche supprimée.' });
}
