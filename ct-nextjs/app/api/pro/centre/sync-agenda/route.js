import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { verifierAccesCentre } from '@/lib/pro';
import { jsonError } from '@/lib/utils';
import { synchroniserAgendaCentre } from '@/lib/ical';

export async function POST(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const centreId = await verifierAccesCentre(session.controleurId, body.centre_id);
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  try {
    const resultat = await synchroniserAgendaCentre(centreId);
    return NextResponse.json(resultat);
  } catch (e) {
    return jsonError(e.statusCode || 502, e.message || "Échec de la synchronisation de l'agenda.");
  }
}
