import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { todayISO } from '@/lib/utils';
import { parseTypes, creneauCompatible } from '@/lib/vehicules';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ville = (searchParams.get('ville') || '').trim();
  const cp = (searchParams.get('cp') || '').trim();
  const dateSouhaitee = (searchParams.get('date') || '').trim();
  const vehiculeSouhaite = (searchParams.get('vehicule') || '').trim();

  let sql = 'SELECT id, nom, adresse, code_postal, ville, telephone, enseigne, types_vehicules_acceptes, image_data, image_mime FROM centres WHERE 1=1';
  const args = [];
  if (ville) { sql += ' AND ville LIKE ?'; args.push(`%${ville}%`); }
  if (cp) { sql += ' AND code_postal LIKE ?'; args.push(`${cp}%`); }
  sql += ' ORDER BY ville, nom';

  let centres = await all(sql, args);

  if (vehiculeSouhaite) {
    centres = centres.filter((c) => parseTypes(c.types_vehicules_acceptes).includes(vehiculeSouhaite));
  }

  const debut = todayISO();
  const fin = todayISO(7);

  const result = await Promise.all(
    centres.map(async (c) => {
      const creneauxFenetre = await all(
        `SELECT date, heure, types_vehicules FROM creneaux WHERE centre_id = ? AND statut = 'disponible' AND date BETWEEN ? AND ? ORDER BY date, heure`,
        [c.id, debut, fin]
      );
      const creneauxApresAujourdhui = await all(
        `SELECT date, heure, types_vehicules FROM creneaux WHERE centre_id = ? AND statut = 'disponible' AND date >= ? ORDER BY date, heure LIMIT 30`,
        [c.id, debut]
      );

      const filtrer = (liste) => vehiculeSouhaite
        ? liste.filter((cr) => creneauCompatible(cr.types_vehicules, c.types_vehicules_acceptes, vehiculeSouhaite))
        : liste;

      const n = filtrer(creneauxFenetre).length;
      const prochain = filtrer(creneauxApresAujourdhui)[0] || null;

      let creneauDateSouhaitee = null;
      if (dateSouhaitee) {
        const creneauxJour = await all(
          `SELECT heure, types_vehicules FROM creneaux WHERE centre_id = ? AND statut = 'disponible' AND date = ? ORDER BY heure`,
          [c.id, dateSouhaitee]
        );
        const compatiblesJour = filtrer(creneauxJour);
        creneauDateSouhaitee = compatiblesJour[0] ? { date: dateSouhaitee, heure: compatiblesJour[0].heure } : null;
      }

      return {
        ...c,
        creneaux_disponibles_7j: n,
        prochain_creneau: prochain ? { date: prochain.date, heure: prochain.heure } : null,
        creneau_date_souhaitee: creneauDateSouhaitee,
      };
    })
  );

  // Si une date est demandée, on remonte en premier les centres qui ont
  // effectivement un créneau ce jour-là.
  if (dateSouhaitee) {
    result.sort((a, b) => (b.creneau_date_souhaitee ? 1 : 0) - (a.creneau_date_souhaitee ? 1 : 0));
  }

  return NextResponse.json({ centres: result });
}
