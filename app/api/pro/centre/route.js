import { NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { verifierAccesCentre } from '@/lib/pro';
import { jsonError } from '@/lib/utils';
import { serializeTypes } from '@/lib/vehicules';

const TAILLE_MAX_IMAGE = 1_500_000; // ~1.5 Mo en base64, large marge pour un logo/photo raisonnable

export async function PATCH(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const { types_vehicules_acceptes, image_data, image_mime, centre_id } = body;

  const centreId = await verifierAccesCentre(session.controleurId, centre_id);
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  if (types_vehicules_acceptes !== undefined) {
    if (!Array.isArray(types_vehicules_acceptes) || types_vehicules_acceptes.length === 0) {
      return jsonError(400, 'Sélectionnez au moins un type de véhicule accepté par votre centre.');
    }
    await run('UPDATE centres SET types_vehicules_acceptes = ? WHERE id = ?', [
      serializeTypes(types_vehicules_acceptes),
      centreId,
    ]);
  }

  if (image_data !== undefined) {
    if (image_data && image_data.length > TAILLE_MAX_IMAGE) {
      return jsonError(400, 'Image trop volumineuse (1,5 Mo maximum). Choisissez une image plus légère.');
    }
    await run('UPDATE centres SET image_data = ?, image_mime = ? WHERE id = ?', [
      image_data || null,
      image_data ? image_mime : null,
      centreId,
    ]);
  }

  return NextResponse.json({ message: 'Centre mis à jour.' });
}
