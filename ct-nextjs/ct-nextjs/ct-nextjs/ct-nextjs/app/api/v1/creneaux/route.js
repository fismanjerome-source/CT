import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { verifierCleApi } from '@/lib/apiAuth';
import { jsonError } from '@/lib/utils';
import { verifierLimite, enregistrerEchec, obtenirIp } from '@/lib/rateLimit';

// GET /api/v1/creneaux
// En-tête requis : Authorization: Bearer <clé API>
// Paramètres optionnels : date_debut, date_fin (YYYY-MM-DD), statut
// (disponible | reserve | bloque), limite (1-500, défaut 100).
export async function GET(request) {
  const ip = obtenirIp(request);
  const limite = verifierLimite(`api-v1:${ip}`);
  if (!limite.autorise) {
    return jsonError(429, `Trop de requêtes. Réessayez dans ${limite.minutesRestantes} minute(s).`);
  }

  const centreId = await verifierCleApi(request);
  if (!centreId) {
    enregistrerEchec(`api-v1:${ip}`);
    return jsonError(401, 'Clé API manquante ou invalide. Utilisez un en-tête "Authorization: Bearer <votre_clé>".');
  }

  const { searchParams } = new URL(request.url);
  const dateDebut = searchParams.get('date_debut');
  const dateFin = searchParams.get('date_fin');
  const statut = searchParams.get('statut');
  const limiteResultats = Math.min(Math.max(Number(searchParams.get('limite')) || 100, 1), 500);

  let sql = `SELECT id, date, heure, duree_minutes, type_visite, statut, prix, types_vehicules FROM creneaux WHERE centre_id = ?`;
  const args = [centreId];
  if (dateDebut) { sql += ' AND date >= ?'; args.push(dateDebut); }
  if (dateFin) { sql += ' AND date <= ?'; args.push(dateFin); }
  if (statut) { sql += ' AND statut = ?'; args.push(statut); }
  sql += ' ORDER BY date, heure LIMIT ?';
  args.push(limiteResultats);

  const creneaux = await all(sql, args);
  return NextResponse.json({ creneaux, total: creneaux.length });
}
