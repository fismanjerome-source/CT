import { get } from '@/lib/db';

// Sert la photo du centre à part, plutôt qu'encodée en base64 dans chaque
// page/réponse JSON qui liste ou affiche ce centre : avant ce changement,
// SELECT * ramenait la photo (jusqu'à ~800 Ko en base64) sur CHAQUE
// chargement de /centre/[id] et CHAQUE recherche incluant ce centre, sans
// aucune mise en cache — la page d'un centre avec photo prenait plusieurs
// fois plus de temps à charger que celle d'un centre sans photo. Ici,
// Cache-Control permet au navigateur (et à Cloudflare) de ne la
// télécharger qu'une fois.
export async function GET(request, { params }) {
  const { id } = await params;
  const centre = await get('SELECT image_data, image_mime FROM centres WHERE id = ?', [id]);
  if (!centre?.image_data) {
    return new Response(null, { status: 404 });
  }

  const buffer = Buffer.from(centre.image_data, 'base64');
  return new Response(buffer, {
    headers: {
      'Content-Type': centre.image_mime || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
