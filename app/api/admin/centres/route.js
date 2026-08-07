import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const centres = await all(`
    SELECT
      ce.id, ce.nom, ce.adresse, ce.code_postal, ce.ville, ce.telephone AS centre_telephone,
      ce.enseigne, ce.types_vehicules_acceptes, ce.ical_url, ce.est_premium, ce.est_demo,
      ce.commission_taux_fixe, ce.premium_offert, ce.note_interne,
      ctrl.id AS gerant_id, ctrl.nom AS gerant_nom, ctrl.email AS gerant_email, ctrl.telephone AS gerant_telephone,
      (SELECT COUNT(*) FROM creneaux c WHERE c.centre_id = ce.id AND c.statut = 'disponible') AS creneaux_disponibles,
      (SELECT COUNT(*) FROM creneaux c WHERE c.centre_id = ce.id AND c.statut = 'reserve') AS creneaux_reserves,
      (SELECT COUNT(*) FROM creneaux c WHERE c.centre_id = ce.id AND c.statut = 'bloque') AS creneaux_bloques
    FROM centres ce
    LEFT JOIN controleur_centres cc ON cc.centre_id = ce.id
    LEFT JOIN controleurs ctrl ON ctrl.id = cc.controleur_id
    ORDER BY ce.nom
  `);

  return NextResponse.json({ centres });
}
