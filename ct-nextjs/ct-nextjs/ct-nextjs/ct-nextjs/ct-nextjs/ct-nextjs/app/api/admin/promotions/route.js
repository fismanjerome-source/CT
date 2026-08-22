import { NextResponse } from 'next/server';
import { all, run } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError, todayISO } from '@/lib/utils';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const promotions = await all(`
    SELECT p.*, c.nom AS centre_nom
    FROM promotions p
    LEFT JOIN centres c ON c.id = p.centre_id
    ORDER BY p.date_fin DESC, p.id DESC
  `);

  const aujourdHui = todayISO();
  const promotionsAvecStatut = promotions.map((p) => ({
    ...p,
    statut: p.date_fin < aujourdHui ? 'terminee' : p.date_debut > aujourdHui ? 'a_venir' : 'active',
  }));

  return NextResponse.json({ promotions: promotionsAvecStatut });
}

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const body = await request.json().catch(() => ({}));
  const { centre_id, nom, taux_semaine1, taux_semaine2, taux_semaine3, date_debut, date_fin } = body;

  if (!nom || taux_semaine1 == null || taux_semaine2 == null || taux_semaine3 == null || !date_debut || !date_fin) {
    return jsonError(400, 'Nom, les 3 taux et les dates de début/fin sont requis.');
  }
  if (date_fin < date_debut) {
    return jsonError(400, 'La date de fin doit être après la date de début.');
  }
  for (const t of [taux_semaine1, taux_semaine2, taux_semaine3]) {
    if (Number(t) < 0 || Number(t) > 100) return jsonError(400, 'Les taux doivent être compris entre 0 et 100.');
  }

  const result = await run(
    `INSERT INTO promotions (centre_id, nom, taux_semaine1, taux_semaine2, taux_semaine3, date_debut, date_fin, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [centre_id || null, nom, Number(taux_semaine1), Number(taux_semaine2), Number(taux_semaine3), date_debut, date_fin, new Date().toISOString()]
  );

  return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
}
