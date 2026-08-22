import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';
import { facturesEnRetard, commissionMoisEnCours } from '@/lib/facturation';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const centres = await all('SELECT id, nom, enseigne, ville FROM centres ORDER BY nom');

  const resultat = [];
  let totalEnRetard = 0;
  let totalMoisEnCours = 0;

  for (const centre of centres) {
    const retards = await facturesEnRetard(centre.id);
    const moisEnCours = await commissionMoisEnCours(centre.id);

    const montantRetard = retards.reduce((acc, r) => acc + r.montant, 0);
    totalEnRetard += montantRetard;
    totalMoisEnCours += moisEnCours.montant || 0;

    if (retards.length > 0 || moisEnCours.montant > 0) {
      resultat.push({
        centre_id: centre.id,
        centre_nom: centre.nom,
        enseigne: centre.enseigne,
        ville: centre.ville,
        retards,
        montant_retard: Math.round(montantRetard * 100) / 100,
        mois_en_cours: moisEnCours,
        bloque: retards.length > 0,
      });
    }
  }

  return NextResponse.json({
    centres: resultat,
    total_en_retard: Math.round(totalEnRetard * 100) / 100,
    total_mois_en_cours: Math.round(totalMoisEnCours * 100) / 100,
    nombre_centres_bloques: resultat.filter((c) => c.bloque).length,
  });
}
