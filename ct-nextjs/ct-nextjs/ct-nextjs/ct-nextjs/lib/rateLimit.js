// lib/rateLimit.js — limiteur de tentatives simple, en mémoire.
// Suffisant pour une instance unique (notre cas sur Render) : bloque une
// adresse IP après plusieurs échecs de connexion successifs, avec un délai
// avant de pouvoir réessayer. Se réinitialise à chaque redémarrage du
// serveur — acceptable à ce stade ; une solution partagée (Redis) serait
// nécessaire si la plateforme tournait un jour sur plusieurs instances.

const tentatives = new Map(); // clé -> { compte, premiereTentative }

const FENETRE_MS = 15 * 60 * 1000; // 15 minutes
const MAX_TENTATIVES = 8;

// Nettoyage périodique pour éviter une fuite mémoire sur le long terme.
setInterval(() => {
  const maintenant = Date.now();
  for (const [cle, val] of tentatives.entries()) {
    if (maintenant - val.premiereTentative > FENETRE_MS) tentatives.delete(cle);
  }
}, 5 * 60 * 1000);

export function verifierLimite(cle) {
  const entree = tentatives.get(cle);
  const maintenant = Date.now();
  if (!entree || maintenant - entree.premiereTentative > FENETRE_MS) {
    return { autorise: true };
  }
  if (entree.compte >= MAX_TENTATIVES) {
    const minutesRestantes = Math.ceil((FENETRE_MS - (maintenant - entree.premiereTentative)) / 60000);
    return { autorise: false, minutesRestantes };
  }
  return { autorise: true };
}

export function enregistrerEchec(cle) {
  const entree = tentatives.get(cle);
  const maintenant = Date.now();
  if (!entree || maintenant - entree.premiereTentative > FENETRE_MS) {
    tentatives.set(cle, { compte: 1, premiereTentative: maintenant });
  } else {
    entree.compte += 1;
  }
}

export function reinitialiser(cle) {
  tentatives.delete(cle);
}

export function obtenirIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'inconnu';
}
