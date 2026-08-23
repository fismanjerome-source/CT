import { NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { jsonError } from '@/lib/utils';
import { envoyerNotificationTelegram } from '@/lib/telegram';
import { verifierLimite, enregistrerEchec, obtenirIp } from '@/lib/rateLimit';

export async function POST(request) {
  const ip = obtenirIp(request);
  const cle = `contact:${ip}`;
  const limite = verifierLimite(cle);
  if (!limite.autorise) {
    return jsonError(429, `Trop de messages envoyés depuis cette adresse. Réessayez dans ${limite.minutesRestantes} minute(s).`);
  }
  enregistrerEchec(cle);

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
