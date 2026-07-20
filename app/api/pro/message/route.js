import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';
import { envoyerNotificationTelegram } from '@/lib/telegram';

export async function POST(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const { message } = body;
  if (!message || !message.trim()) {
    return jsonError(400, 'Merci de saisir un message.');
  }

  const controleur = await get('SELECT nom, email, centre_id FROM controleurs WHERE id = ?', [session.controleurId]);
  const centre = await get('SELECT nom FROM centres WHERE id = ?', [controleur.centre_id]);

  await run(
    `INSERT INTO contacts (nom, email, nom_centre, message, type, statut, created_at)
     VALUES (?, ?, ?, ?, 'message_pro', 'nouveau', ?)`,
    [controleur.nom, controleur.email, centre?.nom || null, message.trim(), new Date().toISOString()]
  );

  envoyerNotificationTelegram(
    `💬 <b>Message d'un centre</b>\n${centre?.nom || 'Centre inconnu'} — ${controleur.nom} (${controleur.email})\n\n${message.trim()}`
  ).catch(() => {});

  return NextResponse.json({ message: 'Votre message a bien été envoyé. Nous revenons vers vous rapidement.' });
}
