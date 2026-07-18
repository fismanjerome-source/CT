import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';
import { serializeTypes } from '@/lib/vehicules';

export async function PATCH(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const { types_vehicules_acceptes } = body;

  if (!Array.isArray(types_vehicules_acceptes) || types_vehicules_acceptes.length === 0) {
    return jsonError(400, 'Sélectionnez au moins un type de véhicule accepté par votre centre.');
  }

  const controleur = await get('SELECT centre_id FROM controleurs WHERE id = ?', [session.controleurId]);
  await run('UPDATE centres SET types_vehicules_acceptes = ? WHERE id = ?', [
    serializeTypes(types_vehicules_acceptes),
    controleur.centre_id,
  ]);

  return NextResponse.json({ message: 'Types de véhicules mis à jour.' });
}
