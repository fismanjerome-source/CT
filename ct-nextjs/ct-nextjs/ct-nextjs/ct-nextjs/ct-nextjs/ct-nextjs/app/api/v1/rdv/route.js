import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { verifierCleApi } from '@/lib/apiAuth';
import { jsonError } from '@/lib/utils';
import { verifierLimite, enregistrerEchec, obtenirIp } from '@/lib/rateLimit';

// GET /api/v1/rdv
// En-tête requis : Authorization: Bearer <clé API>
// Paramètres optionnels : date_debut, date_fin (YYYY-MM-DD), statut
// (confirme | annule | absent), limite (1-500, défaut 100).
// Par souci de confidentialité, seules les informations nécessaires à
// l'organisation du rendez-vous sont renvoyées (pas l'email du client).
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

  let sql = `
    SELECT r.reference, c.date, c.heure, r.client_prenom, r.client_nom, r.client_telephone,
           r.immatriculation, r.type_vehicule, r.statut, r.prix
    FROM rdv r JOIN creneaux c ON c.id = r.creneau_id
    WHERE c.centre_id = ?`;
  const args = [centreId];
  if (dateDebut) { sql += ' AND c.date >= ?'; args.push(dateDebut); }
  if (dateFin) { sql += ' AND c.date <= ?'; args.push(dateFin); }
  if (statut) { sql += ' AND r.statut = ?'; args.push(statut); }
  sql += ' ORDER BY c.date, c.heure LIMIT ?';
  args.push(limiteResultats);

  const rdv = await all(sql, args);
  return NextResponse.json({ rdv, total: rdv.length });
}
