import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';
import { synchroniserAgendaCentre } from '@/lib/ical';

export async function POST(request, { params }) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const { id } = await params;

  try {
    const resultat = await synchroniserAgendaCentre(id);
    return NextResponse.json(resultat);
  } catch (e) {
    return jsonError(e.statusCode || 502, e.message || "Échec de la synchronisation de l'agenda.");
  }
}
