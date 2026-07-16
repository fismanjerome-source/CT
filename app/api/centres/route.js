import { NextResponse } from 'next/server';
import { all, get } from '@/lib/db';
import { todayISO } from '@/lib/utils';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ville = (searchParams.get('ville') || '').trim();
  const cp = (searchParams.get('cp') || '').trim();

  let sql = 'SELECT id, nom, adresse, code_postal, ville, telephone FROM centres WHERE 1=1';
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
      return { ...c, creneaux_disponibles_7j: n, prochain_creneau: prochain || null };
    })
  );

  return NextResponse.json({ centres: result });
}
