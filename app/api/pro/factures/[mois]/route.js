import { NextResponse } from 'next/server';
import { all, get } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { resoudreCentreActif } from '@/lib/pro';
import { jsonError } from '@/lib/utils';

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return jsonError(401, 'Non authentifié. Veuillez vous connecter.');

  const { mois } = await params;
  const { searchParams } = new URL(request.url);
  const centreId = await resoudreCentreActif(session.controleurId, searchParams.get('centre'));
  if (!centreId) return jsonError(403, 'Centre introuvable ou non autorisé.');

  const centre = await get('SELECT * FROM centres WHERE id = ?', [centreId]);

  const lignes = await all(
    `SELECT r.reference, r.created_at, c.date AS date_creneau, c.heure,
            r.prix, r.commission_pourcentage, r.commission_montant
     FROM rdv r JOIN creneaux c ON c.id = r.creneau_id
     WHERE c.centre_id = ? AND strftime('%Y-%m', r.created_at) = ? AND r.statut = 'confirme'
     ORDER BY r.created_at`,
    [centreId, mois]
  );

  if (lignes.length === 0) {
    return jsonError(404, 'Aucune facture pour cette période.');
  }

  const total = lignes.reduce((acc, l) => acc + (l.commission_montant || 0), 0);

  return NextResponse.json({ centre, mois, lignes, total: Math.round(total * 100) / 100 });
}
