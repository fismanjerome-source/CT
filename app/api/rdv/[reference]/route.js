import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { jsonError } from '@/lib/utils';

export async function GET(request, { params }) {
  const { reference } = await params;
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || '';

  const rdv = await get(
    `SELECT r.*, c.date, c.heure, c.centre_id, ce.nom AS centre_nom, ce.adresse, ce.ville
     FROM rdv r JOIN creneaux c ON c.id = r.creneau_id JOIN centres ce ON ce.id = c.centre_id
     WHERE r.reference = ?`,
    [reference]
  );

  if (!rdv || rdv.client_email.toLowerCase() !== email.toLowerCase()) {
    return jsonError(404, 'Rendez-vous introuvable pour cette référence et cet email.');
  }

  return NextResponse.json({ rdv });
}

export async function DELETE(request, { params }) {
  const { reference } = await params;
  const { searchParams } = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const email = body.email || searchParams.get('email') || '';

  const rdv = await get('SELECT * FROM rdv WHERE reference = ?', [reference]);
  if (!rdv || rdv.client_email.toLowerCase() !== email.toLowerCase()) {
    return jsonError(404, 'Rendez-vous introuvable pour cette référence et cet email.');
  }

  await run(`UPDATE rdv SET statut = 'annule' WHERE id = ?`, [rdv.id]);
  await run(`UPDATE creneaux SET statut = 'disponible' WHERE id = ?`, [rdv.creneau_id]);

  return NextResponse.json({ message: 'Rendez-vous annulé. Le créneau est de nouveau disponible.' });
}
