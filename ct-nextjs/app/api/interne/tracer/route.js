import { NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { localiserIp } from '@/lib/geoloc';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { chemin, categorie, ip } = body;
  if (!chemin || !categorie) {
    return NextResponse.json({ ok: false }, { status: 200 }); // silencieux, ne doit jamais bloquer la navigation
  }

  const { ville, region, pays } = await localiserIp(ip);

  try {
    await run(
      'INSERT INTO visites (chemin, categorie, ville, region, pays, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [chemin, categorie, ville, region, pays, new Date().toISOString()]
    );
  } catch {
    // Une visite non enregistrée n'est jamais grave, on ne fait rien remonter au client.
  }

  return NextResponse.json({ ok: true });
}
