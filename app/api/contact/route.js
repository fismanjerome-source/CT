import { NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { jsonError } from '@/lib/utils';
import { envoyerNotificationTelegram } from '@/lib/telegram';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { nom, email, telephone, nom_centre, message, type } = body;

  if (!nom || !email || !message) {
    return jsonError(400, 'Nom, email et message sont requis.');
  }

  const typeMessage = type === 'question_client' ? 'question_client' : 'contact';

  await run(
    `INSERT INTO contacts (nom, email, telephone, nom_centre, message, type, statut, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'nouveau', ?)`,
    [nom, email, telephone || null, nom_centre || null, message, typeMessage, new Date().toISOString()]
  );

  const etiquette = typeMessage === 'question_client' ? '❓ Question client (page d\'accueil)' : '🤝 Contact / demande de centre';
  envoyerNotificationTelegram(
    `${etiquette}\n${nom} (${email})${telephone ? ` — ${telephone}` : ''}\n\n${message}`
  ).catch(() => {});

  return NextResponse.json({ message: 'Votre message a bien été envoyé. Nous vous recontacterons rapidement.' }, { status: 201 });
}
