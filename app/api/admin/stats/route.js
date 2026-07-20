import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const { nombre_centres } = await get('SELECT COUNT(*) AS nombre_centres FROM centres');
  const { nombre_comptes } = await get('SELECT COUNT(*) AS nombre_comptes FROM controleurs');
  const { creneaux_disponibles } = await get(`SELECT COUNT(*) AS creneaux_disponibles FROM creneaux WHERE statut = 'disponible'`);
  const { creneaux_reserves } = await get(`SELECT COUNT(*) AS creneaux_reserves FROM creneaux WHERE statut = 'reserve'`);
  const { rdv_confirmes } = await get(`SELECT COUNT(*) AS rdv_confirmes FROM rdv WHERE statut = 'confirme'`);
  const { contacts_nouveaux } = await get(`SELECT COUNT(*) AS contacts_nouveaux FROM contacts WHERE statut = 'nouveau'`);

  return NextResponse.json({
    nombre_centres,
    nombre_comptes,
    creneaux_disponibles,
    creneaux_reserves,
    rdv_confirmes,
    contacts_nouveaux,
  });
}
