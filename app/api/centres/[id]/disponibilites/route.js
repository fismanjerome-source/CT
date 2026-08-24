import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { todayISO } from '@/lib/utils';

export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const debut = searchParams.get('debut') || todayISO();
  const jours = Number(searchParams.get('jours')) || 14;
  const finDate = new Date(debut + 'T00:00:00Z');
  finDate.setUTCDate(finDate.getUTCDate() + jours);
  const fin = finDate.toISOString().slice(0, 10);

  const rows = await all(
    `SELECT date, COUNT(*) AS n FROM creneaux
     WHERE centre_id = ? AND statut = 'disponible' AND date BETWEEN ? AND ?
     GROUP BY date ORDER BY date`,
    [id, debut, fin]
  );

  return NextResponse.json({ disponibilites: rows });
}
