import { NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { listerMesCentres } from '@/lib/pro';
import { jsonError } from '@/lib/utils';

export async function GET() {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const centres = await listerMesCentres(session.controleurId);
  return NextResponse.json({ centres });
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const { nom, adresse, code_postal, ville, telephone } = body;

  if (!nom || !adresse || !code_postal || !ville) {
    return jsonError(400, 'Nom, adresse, code postal et ville sont requis.');
  }

  const result = await run(
    `INSERT INTO centres (nom, adresse, code_postal, ville, telephone) VALUES (?, ?, ?, ?, ?)`,
    [nom, adresse, code_postal, ville, telephone || null]
  );
  const nouveauCentreId = Number(result.lastInsertRowid);

  await run(
    `INSERT INTO controleur_centres (controleur_id, centre_id) VALUES (?, ?)`,
    [session.controleurId, nouveauCentreId]
  );

  return NextResponse.json({ id: nouveauCentreId }, { status: 201 });
}
