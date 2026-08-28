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
  return NextResponse.json({ total_rdv: n });
}
