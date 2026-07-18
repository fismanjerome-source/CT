import { NextResponse } from 'next/server';
import { all, get } from '@/lib/db';
import { todayISO } from '@/lib/utils';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ville = (searchParams.get('ville') || '').trim();
  const cp = (searchParams.get('cp') || '').trim();
  const dateSouhaitee = (searchParams.get('date') || '').trim();

  let sql = 'SELECT id, nom, adresse, code_postal, ville, telephone, enseigne, types_vehicules_acceptes FROM centres WHERE 1=1';
  const args = [];
  if (ville) { sql += ' AND ville LIKE ?'; args.push(`%${ville}%`); }
  if (cp) { sql += ' AND code_postal LIKE ?'; args.push(`${cp}%`); }
  sql += ' ORDER BY ville, nom';

  const centres = await all(sql, args);

  const debut = todayISO();
  const fin = todayISO(7);

  const result = await Promise.all(
    centres.map(async (c) => {
      const { n } = await get(
        `SELECT COUNT(*) AS n FROM creneaux WHERE centre_id = ? AND statut = 'disponible' AND date BETWEEN ? AND ?`,
        [c.id, debut, fin]
      );
      const prochain = await get(
        `SELECT date, heure FROM creneaux WHERE centre_id = ? AND statut = 'disponible' AND date >= ? ORDER BY date, heure LIMIT 1`,
        [c.id, debut]
      );

      let creneauDateSouhaitee = null;
      if (dateSouhaitee) {
        creneauDateSouhaitee = await get(
          `SELECT date, heure FROM creneaux WHERE centre_id = ? AND statut = 'disponible' AND date = ? ORDER BY heure LIMIT 1`,
          [c.id, dateSouhaitee]
        );
      }

      return {
        ...c,
        creneaux_disponibles_7j: n,
        prochain_creneau: prochain || null,
        creneau_date_souhaitee: creneauDateSouhaitee || null,
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
