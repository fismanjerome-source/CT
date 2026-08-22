import { NextResponse } from 'next/server';
import { all, get } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError, todayISO } from '@/lib/utils';
import { parseTypes } from '@/lib/vehicules';

export async function GET(request, { params }) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const { id } = await params;

  const centre = await get(
    `SELECT ce.*, ctrl.nom AS gerant_nom, ctrl.email AS gerant_email, ctrl.telephone AS gerant_telephone
     FROM centres ce
     LEFT JOIN controleur_centres cc ON cc.centre_id = ce.id
     LEFT JOIN controleurs ctrl ON ctrl.id = cc.controleur_id
     WHERE ce.id = ?
     LIMIT 1`,
    [id]
  );
  if (!centre) return jsonError(404, 'Centre introuvable.');

  const compteurs = await get(
    `SELECT
       SUM(CASE WHEN statut = 'disponible' THEN 1 ELSE 0 END) AS disponibles,
       SUM(CASE WHEN statut = 'reserve' THEN 1 ELSE 0 END) AS reserves,
       SUM(CASE WHEN statut = 'bloque' THEN 1 ELSE 0 END) AS bloques
     FROM creneaux WHERE centre_id = ? AND date >= ?`,
    [id, todayISO()]
  );

  const prochainsRdv = await all(
    `SELECT r.reference, r.client_prenom, r.client_nom, r.type_vehicule, r.statut, c.date, c.heure
     FROM rdv r JOIN creneaux c ON c.id = r.creneau_id
     WHERE c.centre_id = ? AND c.date >= ? AND r.statut IN ('confirme', 'absent')
     ORDER BY c.date, c.heure LIMIT 15`,
    [id, todayISO()]
  );

  const factures = await all(
    `SELECT DISTINCT strftime('%Y-%m', c.date) AS mois
     FROM rdv r JOIN creneaux c ON c.id = r.creneau_id
     WHERE c.centre_id = ? AND r.statut = 'confirme'
     ORDER BY mois DESC LIMIT 6`,
    [id]
  );
  const statutsFactures = await all(
    `SELECT mois, statut FROM factures_statuts WHERE centre_id = ?`,
    [id]
  );
  const facturesAvecStatut = factures.map((f) => ({
    mois: f.mois,
    statut: statutsFactures.find((s) => s.mois === f.mois)?.statut || 'non_paye',
  }));

  return NextResponse.json({
    centre: {
      ...centre,
      types_vehicules_acceptes: parseTypes(centre.types_vehicules_acceptes),
      a_une_image: !!centre.image_data,
      a_un_agenda: !!centre.ical_url,
    },
    compteurs: {
      disponibles: Number(compteurs?.disponibles || 0),
      reserves: Number(compteurs?.reserves || 0),
      bloques: Number(compteurs?.bloques || 0),
    },
    prochains_rdv: prochainsRdv,
    factures: facturesAvecStatut,
  });
}
