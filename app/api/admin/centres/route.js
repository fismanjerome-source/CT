import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  // Une seule ligne par centre : avec un LEFT JOIN direct sur
  // controleur_centres, un centre géré par plusieurs comptes (une même
  // centre partagé entre deux gérants) apparaissait autant de fois que de
  // gérants, avec la même clé React à chaque doublon — silencieux en petite
  // base de test, mais un vrai risque d'affichage cassé dès qu'un centre a
  // plus d'un gérant. Le gérant principal (le plus ancien) est choisi par
  // sous-requête, comme déjà fait pour "se connecter en tant que ce centre".
  const centres = await all(`
    SELECT
      ce.id, ce.nom, ce.adresse, ce.code_postal, ce.ville, ce.telephone AS centre_telephone,
      ce.enseigne, ce.types_vehicules_acceptes, ce.ical_url, ce.est_premium, ce.est_demo,
      ce.commission_taux_fixe, ce.premium_offert, ce.note_interne,
      (SELECT ctrl.id FROM controleur_centres cc JOIN controleurs ctrl ON ctrl.id = cc.controleur_id
       WHERE cc.centre_id = ce.id ORDER BY ctrl.id LIMIT 1) AS gerant_id,
      (SELECT ctrl.nom FROM controleur_centres cc JOIN controleurs ctrl ON ctrl.id = cc.controleur_id
       WHERE cc.centre_id = ce.id ORDER BY ctrl.id LIMIT 1) AS gerant_nom,
      (SELECT ctrl.email FROM controleur_centres cc JOIN controleurs ctrl ON ctrl.id = cc.controleur_id
       WHERE cc.centre_id = ce.id ORDER BY ctrl.id LIMIT 1) AS gerant_email,
      (SELECT ctrl.telephone FROM controleur_centres cc JOIN controleurs ctrl ON ctrl.id = cc.controleur_id
       WHERE cc.centre_id = ce.id ORDER BY ctrl.id LIMIT 1) AS gerant_telephone,
      (SELECT COUNT(*) FROM controleur_centres cc WHERE cc.centre_id = ce.id) AS nombre_gerants,
      (SELECT COUNT(*) FROM creneaux c WHERE c.centre_id = ce.id AND c.statut = 'disponible') AS creneaux_disponibles,
      (SELECT COUNT(*) FROM creneaux c WHERE c.centre_id = ce.id AND c.statut = 'reserve') AS creneaux_reserves,
      (SELECT COUNT(*) FROM creneaux c WHERE c.centre_id = ce.id AND c.statut = 'bloque') AS creneaux_bloques
    FROM centres ce
    ORDER BY ce.nom
  `);

  return NextResponse.json({ centres });
}
