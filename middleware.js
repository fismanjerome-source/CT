import { NextResponse } from 'next/server';

// Catégorise la page visitée pour distinguer, dans les statistiques,
// les visites côté client de celles côté centre (espace pro) et admin.
function categoriser(pathname) {
  if (pathname.startsWith('/pro')) return 'pro';
  if (pathname.startsWith('/admin')) return 'admin';
  return 'client';
}

export function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || null;

  // Repère les arrivées depuis Avant Mon CT (liens déjà taggués
  // ?utm_source=avant-mon-ct côté avantmonct.fr), pour voir dans les
  // statistiques combien de visites Créneau CT en proviennent.
  const origine = searchParams.get('utm_source') || null;

  // Envoi "fire-and-forget" : on ne bloque jamais l'affichage de la page en
  // attendant que la visite soit enregistrée et localisée.
  fetch(`${request.nextUrl.origin}/api/interne/tracer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chemin: pathname, categorie: categoriser(pathname), ip, origine, cle: process.env.TRACER_SECRET }),
  }).catch(() => {});

  return NextResponse.next();
}

export const config = {
  // Ne s'applique qu'aux vraies pages, jamais aux fichiers statiques, à
  // l'API elle-même, ou aux images/favicon.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|opengraph-image|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)',
  ],
};
