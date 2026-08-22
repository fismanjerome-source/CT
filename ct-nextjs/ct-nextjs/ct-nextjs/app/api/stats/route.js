import { NextResponse } from 'next/server';
import { get } from '@/lib/db';

export async function GET() {
  const { n } = await get(`SELECT COUNT(*) AS n FROM rdv WHERE statut = 'confirme'`);
  return NextResponse.json({ total_rdv: n });
}
