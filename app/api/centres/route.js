import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { todayISO, creneauSuffisammentEloigne } from '@/lib/utils';
import { parseTypes, creneauCompatible } from '@/lib/vehicules';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ville = (searchParams.get('ville') || '').trim();
  const cp = (searchParams.get('cp') || '').trim();
  const dateSouhaitee = (searchParams.get('date') || '').trim();
  const vehiculeSouhaite = (searchParams.get('vehicule') || '').trim();
  const typeVisite = searchParams.get('type_visite') === 'contre_visite' ? 'contre_visite' : 'normale';

  let sql = 'SELECT id, nom, adresse, code_postal, ville, telephone, enseigne, types_vehicules_acceptes, image_data, image_mime, est_premium FROM centres WHERE 1=1';
  const args = [];
  if (ville) { sql += ' AND ville LIKE ?'; args.push(`%${ville}%`); }
  if (cp) { sql += ' AND code_postal LIKE ?'; args.push(`${cp}%`); }
  sql += ' ORDER BY est_premium DESC, ville, nom';

  let centres = await all(sql, args);

  if (vehiculeSouhaite) {
    centres = centres.filter((c) => parseTypes(c.types_vehicules_acceptes).includes(vehiculeSouhaite));
  }

  if (centres.length === 0) {
    return NextResponse.json({ centres: [] });
  }

  const debut = todayISO();
  const fin45 = todayISO(45); // fenêtre large unique, couvre les stats 14j et le "prochain créneau"
  const fin14 = todayISO(14);
  const fin7 = todayISO(7);
  const fin2 = todayISO(2);

  const idsCentres = centres.map((c) => c.id);
  const placeholders = idsCentres.map(() => '?').join(',');

  // Une seule requête groupée pour tous les centres, au lieu d'une requête
  // par centre — évite le problème de performance dit "N+1".
  const tousLesCreneaux = await all(
    `SELECT centre_id, date, heure, types_vehicules FROM creneaux
     WHERE centre_id IN (${placeholders}) AND statut = 'disponible' AND type_visite = ? AND date BETWEEN ? AND ?
     ORDER BY centre_id, date, heure`,
    [...idsCentres, typeVisite, debut, fin45]
  );

  const creneauxParCentre = new Map();
  for (const cr of tousLesCreneaux) {
    if (!creneauxParCentre.has(cr.centre_id)) creneauxParCentre.set(cr.centre_id, []);
    creneauxParCentre.get(cr.centre_id).push(cr);
  }

  let creneauxDateSouhaiteeParCentre = new Map();
  if (dateSouhaitee) {
    const creneauxJour = await all(
      `SELECT centre_id, heure, types_vehicules FROM creneaux
       WHERE centre_id IN (${placeholders}) AND statut = 'disponible' AND type_visite = ? AND date = ?
       ORDER BY centre_id, heure`,
      [...idsCentres, typeVisite, dateSouhaitee]
    );
    for (const cr of creneauxJour) {
      if (!creneauxDateSouhaiteeParCentre.has(cr.centre_id)) creneauxDateSouhaiteeParCentre.set(cr.centre_id, []);
      creneauxDateSouhaiteeParCentre.get(cr.centre_id).push(cr);
    }
  }

  const result = centres.map((c) => {
    const creneauxCentre = creneauxParCentre.get(c.id) || [];

    const filtrer = (liste) => {
      let l = liste.filter((cr) => creneauSuffisammentEloigne(cr.date, cr.heure));
      if (vehiculeSouhaite) {
        l = l.filter((cr) => creneauCompatible(cr.types_vehicules, c.types_vehicules_acceptes, vehiculeSouhaite));
      }
      return l;
    };

    const creneauxCompatiblesFenetre = filtrer(creneauxCentre.filter((cr) => cr.date <= fin14));
    const n2 = creneauxCompatiblesFenetre.filter((cr) => cr.date <= fin2).length;
    const n7 = creneauxCompatiblesFenetre.filter((cr) => cr.date <= fin7).length;
    const n14 = creneauxCompatiblesFenetre.length;
    const prochain = filtrer(creneauxCentre)[0] || null;

    let creneauDateSouhaitee = null;
    if (dateSouhaitee) {
      const compatiblesJour = filtrer(creneauxDateSouhaiteeParCentre.get(c.id) || []);
      creneauDateSouhaitee = compatiblesJour[0] ? { date: dateSouhaitee, heure: compatiblesJour[0].heure } : null;
    }

    return {
      ...c,
      creneaux_2j: n2,
      creneaux_7j: n7,
      creneaux_14j: n14,
      creneaux_disponibles_7j: n7, // conservé pour compatibilité
      prochain_creneau: prochain ? { date: prochain.date, heure: prochain.heure } : null,
      creneau_date_souhaitee: creneauDateSouhaitee,
    };
  });

  // Les centres premium restent toujours en tête ; à statut égal, on
  // remonte ceux qui ont effectivement un créneau à la date demandée.
  result.sort((a, b) => {
    if (a.est_premium !== b.est_premium) return b.est_premium - a.est_premium;
    if (dateSouhaitee) return (b.creneau_date_souhaitee ? 1 : 0) - (a.creneau_date_souhaitee ? 1 : 0);
    return 0;
  });

  return NextResponse.json({ centres: result });
}
