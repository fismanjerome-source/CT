import { NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { jsonError } from '@/lib/utils';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { nom, email, telephone, nom_centre, message } = body;

  if (!nom || !email || !message) {
    return jsonError(400, 'Nom, email et message sont requis.');
  }

  await run(
    `INSERT INTO contacts (nom, email, telephone, nom_centre, message, statut, created_at)
     VALUES (?, ?, ?, ?, ?, 'nouveau', ?)`,
    [nom, email, telephone || null, nom_centre || null, message, new Date().toISOString()]
  );

  return NextResponse.json({ message: 'Votre message a bien été envoyé. Nous vous recontacterons rapidement.' }, { status: 201 });
}
