// lib/geoloc.js — résout une IP en ville/région/pays approximatifs, via un
// service gratuit tiers (ip-api.com, pas de clé requise). L'IP n'est
// utilisée que le temps de cet appel et n'est jamais stockée en base —
// seul le résultat (ville, région, pays) est conservé.

export async function localiserIp(ip) {
  if (!ip || ip === 'inconnu' || ip.startsWith('127.') || ip.startsWith('::1') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { ville: null, region: null, pays: null };
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { ville: null, region: null, pays: null };
    const data = await res.json();
    if (data.status !== 'success') return { ville: null, region: null, pays: null };
    return { ville: data.city || null, region: data.regionName || null, pays: data.country || null };
  } catch {
    return { ville: null, region: null, pays: null };
  }
}
