// lib/totp.js — implémentation HOTP/TOTP (RFC 4226 / RFC 6238), compatible
// avec Google Authenticator, Microsoft Authenticator, etc. Aucune
// dépendance npm : uniquement le module "crypto" intégré à Node.js.

import crypto from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function genererSecretBase32(longueurOctets = 20) {
  const octets = crypto.randomBytes(longueurOctets);
  let bits = '';
  for (const octet of octets) bits += octet.toString(2).padStart(8, '0');

  let base32 = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    base32 += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  return base32;
}

function base32ToBuffer(base32) {
  const nettoye = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const c of nettoye) {
    const val = BASE32_ALPHABET.indexOf(c);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const octets = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    octets.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(octets);
}

// HOTP — RFC 4226. counter doit être un entier positif.
function hotp(secretBase32, counter, digits = 6) {
  const cle = base32ToBuffer(secretBase32);
  const compteur = Buffer.alloc(8);
  // BigInt pour éviter tout souci de précision sur les grands compteurs.
  compteur.writeBigUInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', cle).update(compteur).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const tronque =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const code = (tronque % 10 ** digits).toString().padStart(digits, '0');
  return code;
}

// TOTP — RFC 6238. Code à 6 chiffres, renouvelé toutes les 30 secondes
// (paramètres standards, identiques à ceux utilisés par Google Authenticator).
export function genererTOTP(secretBase32, maintenant = Date.now(), pasSecondes = 30, digits = 6) {
  const compteur = Math.floor(maintenant / 1000 / pasSecondes);
  return hotp(secretBase32, compteur, digits);
}

// Vérifie un code fourni par l'utilisateur, en tolérant un décalage d'un
// pas de temps avant/après (dérive d'horloge courante entre serveur et
// téléphone) — comportement standard pour ce type de vérification.
export function verifierTOTP(secretBase32, codeFourni, maintenant = Date.now(), pasSecondes = 30, fenetre = 1) {
  if (!codeFourni || !/^\d{6}$/.test(codeFourni.trim())) return false;
  const code = codeFourni.trim();
  for (let decalage = -fenetre; decalage <= fenetre; decalage++) {
    const instant = maintenant + decalage * pasSecondes * 1000;
    if (genererTOTP(secretBase32, instant, pasSecondes, 6) === code) return true;
  }
  return false;
}

export function construireUriOtpauth(secretBase32, compte, emetteur = 'Créneau CT') {
  const label = encodeURIComponent(`${emetteur}:${compte}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer: emetteur,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
