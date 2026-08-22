import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { jsonError, todayISO } from '@/lib/utils';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { reference, email, note, commentaire } = body;

  if (!reference || !email) return jsonError(400, 'Référence et email requis.');
  const noteNum = Number(note);
  if (!Number.isInteger(noteNum) || noteNum < 1 || noteNum > 5) {
    return jsonError(400, 'La note doit être un nombre entier entre 1 et 5.');
  }

  const rdv = await get(
    `SELECT r.id, r.statut, r.client_prenom, c.date, c.centre_id
     FROM rdv r JOIN creneaux c ON c.id = r.creneau_id
     WHERE r.reference = ?`,
    [reference]
  );
  if (!rdv) return jsonError(404, 'Rendez-vous introuvable pour cette référence.');

  const rdvAvecEmail = await get('SELECT client_email FROM rdv WHERE id = ?', [rdv.id]);
  if (rdvAvecEmail.client_email.toLowerCase() !== email.toLowerCase()) {
    return jsonError(404, 'Rendez-vous introuvable pour cette référence et cet email.');
  }

  if (rdv.statut !== 'confirme') {
    return jsonError(400, "Un avis ne peut être laissé que pour un rendez-vous honoré.");
  }
  if (rdv.date >= todayISO()) {
    return jsonError(400, "Vous pourrez laisser votre avis une fois le rendez-vous passé.");
  }

  const existant = await get('SELECT id FROM avis WHERE rdv_id = ?', [rdv.id]);
  if (existant) return jsonError(409, 'Un avis a déjà été laissé pour ce rendez-vous.');

  await run(
    'INSERT INTO avis (rdv_id, centre_id, note, commentaire, client_prenom, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [rdv.id, rdv.centre_id, noteNum, (commentaire || '').trim() || null, rdv.client_prenom || null, new Date().toISOString()]
  );

  return NextResponse.json({ message: 'Merci pour votre avis !' }, { status: 201 });
}
