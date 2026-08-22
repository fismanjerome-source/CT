import crypto from 'node:crypto';
import { get, run } from '@/lib/db';

// Génère une nouvelle clé API au format ckt_live_<64 caractères hexadécimaux>
// — préfixe reconnaissable, facilite le support et la détection accidentelle
// dans un dépôt de code public.
export function genererCleApi() {
  return `ckt_live_${crypto.randomBytes(32).toString('hex')}`;
}

// Vérifie l'en-tête Authorization: Bearer <clé> d'une requête et renvoie le
// centre_id associé si la clé est valide et active, sinon null.
export async function verifierCleApi(request) {
  const enTete = request.headers.get('authorization') || '';
  const [type, cle] = enTete.split(' ');
  if (type !== 'Bearer' || !cle) return null;

  const ligne = await get('SELECT id, centre_id, actif FROM api_cles WHERE cle = ?', [cle]);
  if (!ligne || !ligne.actif) return null;

  run('UPDATE api_cles SET derniere_utilisation = ? WHERE id = ?', [new Date().toISOString(), ligne.id]).catch(() => {});

  return ligne.centre_id;
}
