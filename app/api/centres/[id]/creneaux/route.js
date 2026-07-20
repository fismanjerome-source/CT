import { NextResponse } from 'next/server';
import { all, get } from '@/lib/db';
import { jsonError, creneauSuffisammentEloigne } from '@/lib/utils';
import { creneauCompatible } from '@/lib/vehicules';

export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const typeVehicule = searchParams.get('type_vehicule');
  if (!date) return jsonError(400, 'Paramètre "date" requis (YYYY-MM-DD).');

  const centre = await get('SELECT types_vehicules_acceptes FROM centres WHERE id = ?', [id]);

  const creneaux = await all(
    `SELECT c.id, c.heure, c.duree_minutes, c.prix, c.promo_pourcentage, c.types_vehicules, ctrl.nom AS controleur_nom
     FROM creneaux c JOIN controleurs ctrl ON ctrl.id = c.controleur_id
     WHERE c.centre_id = ? AND c.date = ? AND c.statut = 'disponible'
     ORDER BY c.heure`,
    [id, date]
  );

  // Un créneau trop proche dans le temps (moins d'1h30) n'est jamais
  // proposé — le temps pour le client de s'y rendre et pour le centre de
  // s'organiser.
  const creneauxAssezLoin = creneaux.filter((c) => creneauSuffisammentEloigne(date, c.heure));

  const creneauxFiltres = typeVehicule
    ? creneauxAssezLoin.filter((c) => creneauCompatible(c.types_vehicules, centre?.types_vehicules_acceptes, typeVehicule))
    : creneauxAssezLoin;

  // La commission Créneau CT n'est jamais renvoyée ici : cette route est
  // publique et lue par le client, la promo affichée est uniquement celle
  // choisie par le centre lui-même.
  const creneauxAvecPrix = creneauxFiltres.map((c) => {
    const prixFinal = c.prix != null && c.promo_pourcentage
      ? Math.round(c.prix * (1 - c.promo_pourcentage / 100) * 100) / 100
      : c.prix;
    return { ...c, prix_final: prixFinal };
  });

  return NextResponse.json({ creneaux: creneauxAvecPrix });
}
