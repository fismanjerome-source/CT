import { NextResponse } from 'next/server';
import { all, get } from '@/lib/db';
import { todayISO } from '@/lib/utils';
import { creneauCompatible } from '@/lib/vehicules';

// Compte les créneaux disponibles par jour, filtré par type de véhicule et
// de visite quand ils sont fournis — sans ce filtre, le nombre affiché sur
// chaque jour du calendrier pouvait annoncer des créneaux (ex: 14) qui
// disparaissaient tous une fois le type de véhicule sélectionné, car ce
// nombre ne tenait alors compte d'aucune restriction : contradiction visible
// pour le client ("14 créneaux" puis "aucun créneau disponible").
export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const debut = searchParams.get('debut') || todayISO();
  const jours = Number(searchParams.get('jours')) || 14;
  const typeVehicule = searchParams.get('type_vehicule');
  const typeVisite = searchParams.get('type_visite') === 'contre_visite' ? 'contre_visite' : 'normale';
  const finDate = new Date(debut + 'T00:00:00Z');
  finDate.setUTCDate(finDate.getUTCDate() + jours);
  const fin = finDate.toISOString().slice(0, 10);

  const centre = await get('SELECT types_vehicules_acceptes FROM centres WHERE id = ?', [id]);

  const rows = await all(
    `SELECT date, types_vehicules FROM creneaux
     WHERE centre_id = ? AND statut = 'disponible' AND type_visite = ? AND date BETWEEN ? AND ?`,
    [id, typeVisite, debut, fin]
  );

  const compte = {};
  for (const row of rows) {
    if (typeVehicule && !creneauCompatible(row.types_vehicules, centre?.types_vehicules_acceptes, typeVehicule)) continue;
    compte[row.date] = (compte[row.date] || 0) + 1;
  }
  const disponibilites = Object.entries(compte)
    .map(([date, n]) => ({ date, n }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({ disponibilites });
}
