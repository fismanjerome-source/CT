import { NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { localiserIp } from '@/lib/geoloc';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { chemin, categorie, ip, origine, cle } = body;
  // Appelée par le middleware de Créneau CT lui-même, mais aussi (depuis
  // avant-mon-ct.fr) par celui d'Avant Mon CT pour reporter ses propres
  // pages vues dans le même tableau de bord — la clé partagée évite que
  // n'importe qui puisse polluer les statistiques depuis l'extérieur.
  if (!chemin || !categorie || !process.env.TRACER_SECRET || cle !== process.env.TRACER_SECRET) {
    return NextResponse.json({ ok: false }, { status: 200 }); // silencieux, ne doit jamais bloquer la navigation
  }

  const { ville, region, pays } = await localiserIp(ip);

  try {
    await run(
      'INSERT INTO visites (chemin, categorie, ville, region, pays, origine, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [chemin, categorie, ville, region, pays, origine || null, new Date().toISOString()]
    );
  } catch {
    // Une visite non enregistrée n'est jamais grave, on ne fait rien remonter au client.
  }

  return NextResponse.json({ ok: true });
}
