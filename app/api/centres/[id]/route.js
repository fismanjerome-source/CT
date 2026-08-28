import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { jsonError } from '@/lib/utils';

export async function GET(request, { params }) {
  const { id } = await params;
  // a_une_image plutôt que image_data/image_mime : voir la même remarque
  // dans /api/centres (recherche) et /api/centres/[id]/image.
  const centre = await get(
    `SELECT id, nom, adresse, code_postal, ville, telephone, enseigne, types_vehicules_acceptes,
       (image_data IS NOT NULL) AS a_une_image, est_premium, est_demo
     FROM centres WHERE id = ?`,
    [id]
  );
  if (!centre) return jsonError(404, 'Centre introuvable.');
  return NextResponse.json({ centre });
}
