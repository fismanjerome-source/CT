import { all, get } from './db';
import { joursFeriesFrance } from './joursFeries';

// Vérifie que ce contrôleur a bien le droit de gérer ce centre (lui
// appartient via la table de liaison controleur_centres), et renvoie son
// id si oui, sinon null.
export async function verifierAccesCentre(controleurId, centreId) {
  if (!centreId) return null;
  const lien = await get(
    'SELECT 1 AS ok FROM controleur_centres WHERE controleur_id = ? AND centre_id = ?',
    [controleurId, centreId]
  );
  return lien ? Number(centreId) : null;
}

// Détermine le centre à utiliser pour une requête : celui explicitement
// demandé (si autorisé), sinon le centre principal du compte.
export async function resoudreCentreActif(controleurId, centreIdDemande) {
  if (centreIdDemande) {
    const autorise = await verifierAccesCentre(controleurId, centreIdDemande);
    if (autorise) return autorise;
  }
  const controleur = await get('SELECT centre_id FROM controleurs WHERE id = ?', [controleurId]);
  return controleur?.centre_id || null;
}

// Vrai si cette date est un jour férié français ET que ce centre ne l'a pas
// explicitement débloquée (table jours_feries_ignores) — sert à décider si
// un créneau doit être créé bloqué par défaut.
export async function estJourFerieNonDebloque(centreId, dateISO) {
  const annee = Number(dateISO.slice(0, 4));
  if (!joursFeriesFrance(annee).some((j) => j.date === dateISO)) return false;
  const ignore = await get(
    'SELECT 1 FROM jours_feries_ignores WHERE centre_id = ? AND date = ?',
    [centreId, dateISO]
  );
  return !ignore;
}

export async function listerMesCentres(controleurId) {
  return all(
    `SELECT ce.* FROM centres ce
     JOIN controleur_centres cc ON cc.centre_id = ce.id
     WHERE cc.controleur_id = ?
     ORDER BY ce.nom`,
    [controleurId]
  );
}
