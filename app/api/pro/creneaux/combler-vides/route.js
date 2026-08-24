import { NextResponse } from 'next/server';
import { db, ensureSchema, all } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resoudreCentreActif } from '@/lib/pro';
import { jsonError } from '@/lib/utils';
import { serializeTypes } from '@/lib/vehicules';
import { centreEstBloque } from '@/lib/facturation';

export async function POST(request) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const body = await request.json().catch(() => ({}));
  const { date_debut, date_fin, plages, intervalle_minutes, duree_minutes, type_visite, jours_semaine, prix, promo_pourcentage, types_vehicules, centre_id } = body;

  if (!date_debut || !date_fin) {
    return jsonError(400, 'date_debut et date_fin sont requis.');
  }
  if (!Array.isArray(plages) || plages.length === 0) {
    return jsonError(400, 'Au moins une plage horaire (heure de début / heure de fin) est requise.');
  }
  for (const p of plages) {
    if (!p.heure_debut || !p.heure_fin) {
      return jsonError(400, 'Chaque plage horaire doit avoir une heure de début et une heure de fin.');
    }
  }
  if (prix === '' || prix == null || Number(prix) < 0) {
    return jsonError(400, 'Le prix est requis (0 accepté pour une contre-visite gratuite).');
  }

  await ensureSchema();
  const centreId = await resoudreCentreActif(session.controleurId, centre_id);
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  if (await centreEstBloque(centreId)) {
    return jsonError(403, "Ouverture de créneaux bloquée : une commission Créneau CT est en retard de paiement pour ce centre. Régularisez la situation depuis l'onglet « Paiements » ou contactez-nous.");
  }

  const intervalle = Number(intervalle_minutes) || 30;
  const duree = Number(duree_minutes) || 30;
  const typeVisiteFinal = type_visite === 'contre_visite' ? 'contre_visite' : 'normale';
  const joursAutorises = Array.isArray(jours_semaine) && jours_semaine.length ? jours_semaine : [1, 2, 3, 4, 5, 6];

  const cursor = new Date(date_debut + 'T00:00:00Z');
  const finDate = new Date(date_fin + 'T00:00:00Z');

  // On construit toutes les requêtes d'abord, puis on les envoie en un seul
  // aller-retour réseau via db.batch() : la version précédente faisait un
  // db.transaction('write') + un await tx.execute() par créneau (un aller-
  // retour réseau chacun), ce qui gardait le verrou d'écriture SQLite ouvert
  // pendant toute la boucle — assez longtemps pour bloquer aussi les autres
  // écritures (ex : "Appliquer une promotion") pendant tout ce temps.
  const statements = [];
  const datesHeures = [];
  while (cursor <= finDate) {
    if (joursAutorises.includes(cursor.getUTCDay())) {
      const dateStr = cursor.toISOString().slice(0, 10);

      for (const plage of plages) {
        const [hDebutH, hDebutM] = plage.heure_debut.split(':').map(Number);
        const [hFinH, hFinM] = plage.heure_fin.split(':').map(Number);
        let minutesCursor = hDebutH * 60 + hDebutM;
        const minutesFin = hFinH * 60 + hFinM;

        while (minutesCursor < minutesFin) {
          const h = String(Math.floor(minutesCursor / 60)).padStart(2, '0');
          const m = String(minutesCursor % 60).padStart(2, '0');
          const heureStr = `${h}:${m}`;
          statements.push({
            sql: `INSERT OR IGNORE INTO creneaux (centre_id, controleur_id, date, heure, duree_minutes, type_visite, statut, prix, promo_pourcentage, types_vehicules) VALUES (?, ?, ?, ?, ?, ?, 'disponible', ?, ?, ?)`,
            args: [centreId, session.controleurId, dateStr, heureStr, duree, typeVisiteFinal, Number(prix), promo_pourcentage ? Number(promo_pourcentage) : null, serializeTypes(types_vehicules)],
          });
          datesHeures.push(`${dateStr} ${heureStr}`);
          minutesCursor += intervalle;
        }
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  if (statements.length === 0) {
    return NextResponse.json({ message: '0 créneau ouvert (aucune date ne correspond aux jours choisis sur cette période).', nombre_crees: 0 }, { status: 201 });
  }
  if (statements.length > 3000) {
    return jsonError(400, `Cette période représenterait ${statements.length} créneaux en une seule fois, c'est trop pour un seul envoi. Réduisez la période ou la plage horaire, puis relancez plusieurs fois si besoin.`);
  }

  let created = 0;
  try {
    const resultats = await db.batch(statements, 'write');
    created = resultats.filter((r) => r.rowsAffected > 0).length;
  } catch (e) {
    return jsonError(500, "Erreur lors de l'ouverture des créneaux.");
  }

  const nonCrees = statements.length - created;
  let message;
  if (created > 0) {
    message = `${created} créneau(x) ouvert(s).`;
  } else {
    // Un centre ne peut avoir qu'un seul créneau par horaire (visite normale
    // OU contre-visite, jamais les deux en même temps) — la contrainte porte
    // sur la date+l'heure, pas sur le type de visite. "0 créneau ouvert" peut
    // donc vouloir dire soit que ce lot existe déjà tel quel (aucun souci,
    // l'outil ne duplique jamais), soit que ces horaires sont déjà pris par
    // l'AUTRE type de visite — un cas confus si on ne le précise pas.
    const autreType = typeVisiteFinal === 'contre_visite' ? 'normale' : 'contre_visite';
    let occupesParAutreType = 0;
    try {
      const existants = await all(
        `SELECT date, heure, type_visite FROM creneaux WHERE centre_id = ? AND date >= ? AND date <= ? AND type_visite = ?`,
        [centreId, date_debut, date_fin, autreType]
      );
      const occupation = new Set(existants.map((c) => `${c.date} ${c.heure}`));
      occupesParAutreType = datesHeures.filter((dh) => occupation.has(dh)).length;
    } catch {
      // Pas grave si ce diagnostic échoue : le message générique ci-dessous reste correct.
    }

    if (occupesParAutreType > 0) {
      const libelleAutre = autreType === 'contre_visite' ? 'contre-visite' : 'visite normale';
      const libelleDemande = typeVisiteFinal === 'contre_visite' ? 'contre-visite' : 'visite normale';
      message = `Aucun créneau ouvert : ${occupesParAutreType} de ces horaires sont déjà pris par des créneaux "${libelleAutre}" existants (un centre ne peut avoir qu'un seul créneau par horaire, tous types confondus). Choisissez d'autres horaires pour la ${libelleDemande}, ou libérez d'abord ces créneaux "${libelleAutre}".`;
    } else {
      message = `Aucun nouveau créneau : les ${statements.length} créneau(x) de cette période étaient déjà ouverts (aucun doublon créé). Pour changer leur prix ou leur remise, utilisez « Modifier le prix sur une période » ou « Appliquer une promotion sur une période » — rouvrir la même période ici ne les modifie jamais.`;
    }
  }

  return NextResponse.json({ message, nombre_crees: created, nombre_deja_existants: nonCrees }, { status: 201 });
}
