import { NextResponse } from 'next/server';
import { get } from '@/lib/db';

export async function GET() {
  // Exclut les RDV pris sur un centre marqué "démo" (test/exemple) : ce
  // compteur est affiché publiquement comme preuve sociale, il ne doit
  // jamais inclure de réservations fictives.
  const { n } = await get(
    `SELECT COUNT(*) AS n FROM rdv r
     JOIN creneaux c ON c.id = r.creneau_id
     JOIN centres ce ON ce.id = c.centre_id
     WHERE r.statut = 'confirme' AND ce.est_demo = 0`
  );

  // Somme reversée aux centres (prix payé par le client moins la commission
  // Créneau CT) — même filtre que ci-dessus (confirmés, hors centres démo).
  // Un RDV "absent" n'est jamais compté : le client n'ayant pas honoré son
  // rendez-vous, aucune somme n'a été réglée au centre pour cette visite.
  const { total } = await get(
    `SELECT COALESCE(SUM(r.prix - COALESCE(r.commission_montant, 0)), 0) AS total FROM rdv r
     JOIN creneaux c ON c.id = r.creneau_id
     JOIN centres ce ON ce.id = c.centre_id
     WHERE r.statut = 'confirme' AND ce.est_demo = 0 AND r.prix IS NOT NULL`
  );

  return NextResponse.json({ total_rdv: n, total_net_centres: Math.round(total) });
}
