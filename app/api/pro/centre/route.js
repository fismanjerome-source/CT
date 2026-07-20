import { NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { verifierAccesCentre } from '@/lib/pro';
import { jsonError } from '@/lib/utils';
import { serializeTypes } from '@/lib/vehicules';
import { geocoderAdresse } from '@/lib/geocoding';

const TAILLE_MAX_IMAGE = 1_500_000; // ~1.5 Mo en base64, large marge pour un logo/photo raisonnable

export async function PATCH(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const { types_vehicules_acceptes, image_data, image_mime, centre_id, nom, adresse, code_postal, ville, telephone, ical_url } = body;

  const centreId = await verifierAccesCentre(session.controleurId, centre_id);
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  if (ical_url !== undefined) {
    await run('UPDATE centres SET ical_url = ? WHERE id = ?', [ical_url ? ical_url.trim() : null, centreId]);
  }

  if (nom !== undefined) {
    if (!nom || !adresse || !code_postal || !ville) {
      return jsonError(400, 'Nom, adresse, code postal et ville sont requis.');
    }
    await run('UPDATE centres SET nom = ?, adresse = ?, code_postal = ?, ville = ?, telephone = ? WHERE id = ?', [
      nom, adresse, code_postal, ville, telephone || null, centreId,
    ]);

    const coords = await geocoderAdresse(adresse, code_postal, ville);
    if (coords) {
      await run('UPDATE centres SET latitude = ?, longitude = ? WHERE id = ?', [coords.latitude, coords.longitude, centreId]);
    }
  }

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
