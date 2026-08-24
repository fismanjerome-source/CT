import { NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resoudreCentreActif } from '@/lib/pro';
import { genererCleApi, hashCleApi, apercuCleApi } from '@/lib/apiAuth';
import { jsonError } from '@/lib/utils';

export async function POST(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const { searchParams } = new URL(request.url);
  const centreId = await resoudreCentreActif(session.controleurId, searchParams.get('centre'));
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  const body = await request.json().catch(() => ({}));
  const nom = (body.nom || '').trim() || 'Clé API';

  const cle = genererCleApi();
  const hash = hashCleApi(cle);
  await run(
    // La colonne "cle" (historique, en clair) reste NOT NULL sur toute base
    // créée avant la migration vers le hachage — SQLite ne permet pas de
    // retirer une contrainte NOT NULL sans reconstruire la table, ce qui
    // serait risqué à faire directement en production. On y stocke donc le
    // hash (déjà unique par clé) plutôt que la clé en clair : la colonne
    // n'est plus jamais lue nulle part, seule cle_hash sert à l'authentification.
    'INSERT INTO api_cles (centre_id, cle, cle_hash, cle_apercu, nom, created_at, actif) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [centreId, hash, hash, apercuCleApi(cle), nom, new Date().toISOString()]
  );

  // La clé en clair n'est renvoyée qu'une seule fois, à la création — elle
  // n'est plus jamais récupérable ensuite (seule sa version masquée l'est).
  return NextResponse.json({ cle }, { status: 201 });
}
