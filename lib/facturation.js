import { all, get } from './db';
import { todayISO, calculerTauxCommission } from './utils';

// Renvoie l'indice de palier (1, 2 ou 3) selon le délai entre aujourd'hui et
// la date du créneau, sans appliquer le taux par défaut.
function palierCommission(dateCreneauStr) {
  const aujourdHui = new Date(todayISO() + 'T00:00:00');
  const dateCreneau = new Date(dateCreneauStr + 'T00:00:00');
  const joursDiff = Math.round((dateCreneau - aujourdHui) / (1000 * 60 * 60 * 24));
  if (joursDiff <= 7) return 1;
  if (joursDiff <= 14) return 2;
  return 3;
}

// Cherche une promotion active aujourd'hui pour ce centre (priorité) ou
// globale (centre_id NULL), et renvoie le taux à appliquer pour le palier
// concerné. Sans promotion active, renvoie le taux par défaut (25/20/15).
// Priorité absolue : un taux fixe défini manuellement par l'admin pour ce
// centre (ex: 0% pour un partenariat particulier), qui ignore alors
// promotions et paliers habituels.
export async function calculerTauxCommissionEffectif(centreId, dateCreneauStr) {
  const centre = await get('SELECT commission_taux_fixe FROM centres WHERE id = ?', [centreId]);
  if (centre?.commission_taux_fixe != null) return centre.commission_taux_fixe;

  const palier = palierCommission(dateCreneauStr);
  const aujourdHui = todayISO();

  const promoCentre = await get(
    `SELECT * FROM promotions WHERE centre_id = ? AND date_debut <= ? AND date_fin >= ? ORDER BY id DESC LIMIT 1`,
    [centreId, aujourdHui, aujourdHui]
  );
  const promo = promoCentre || await get(
    `SELECT * FROM promotions WHERE centre_id IS NULL AND date_debut <= ? AND date_fin >= ? ORDER BY id DESC LIMIT 1`,
    [aujourdHui, aujourdHui]
  );

  if (promo) {
    return palier === 1 ? promo.taux_semaine1 : palier === 2 ? promo.taux_semaine2 : promo.taux_semaine3;
  }
  return calculerTauxCommission(dateCreneauStr);
}

// Même résultat que calculerTauxCommissionEffectif, mais pensé pour calculer
// le taux d'un LOT de créneaux (ex : tout le planning d'un centre sur 3
// mois) sans refaire les 3 requêtes (taux fixe, promo du centre, promo
// globale) pour chaque créneau — elles ne dépendent que du centre et de la
// date du jour, jamais de la date du créneau, donc identiques pour tout le
// lot. Un appel GET /api/pro/creneaux sur une large période faisait
// jusque-là 3 × N requêtes séquentielles (N = nombre de créneaux), ce qui
// rendait le tableau de bord très lent après l'ouverture de plusieurs mois
// de créneaux. Renvoie une fonction synchrone à appliquer à chaque créneau.
export async function preparerCalculTauxLot(centreId) {
  const centre = await get('SELECT commission_taux_fixe FROM centres WHERE id = ?', [centreId]);
  if (centre?.commission_taux_fixe != null) {
    const taux = centre.commission_taux_fixe;
    return () => taux;
  }

  const aujourdHui = todayISO();
  const promoCentre = await get(
    `SELECT * FROM promotions WHERE centre_id = ? AND date_debut <= ? AND date_fin >= ? ORDER BY id DESC LIMIT 1`,
    [centreId, aujourdHui, aujourdHui]
  );
  const promo = promoCentre || await get(
    `SELECT * FROM promotions WHERE centre_id IS NULL AND date_debut <= ? AND date_fin >= ? ORDER BY id DESC LIMIT 1`,
    [aujourdHui, aujourdHui]
  );

  return (dateCreneauStr) => {
    if (promo) {
      const palier = palierCommission(dateCreneauStr);
      return palier === 1 ? promo.taux_semaine1 : palier === 2 ? promo.taux_semaine2 : promo.taux_semaine3;
    }
    return calculerTauxCommission(dateCreneauStr);
  };
}

// Promotion actuellement active pour ce centre (spécifique ou globale),
// utile pour l'affichage côté espace pro.
export async function promotionActive(centreId) {
  const aujourdHui = todayISO();
  const promoCentre = await get(
    `SELECT * FROM promotions WHERE centre_id = ? AND date_debut <= ? AND date_fin >= ? ORDER BY id DESC LIMIT 1`,
    [centreId, aujourdHui, aujourdHui]
  );
  if (promoCentre) return promoCentre;
  return await get(
    `SELECT * FROM promotions WHERE centre_id IS NULL AND date_debut <= ? AND date_fin >= ? ORDER BY id DESC LIMIT 1`,
    [aujourdHui, aujourdHui]
  );
}

// Date limite de paiement pour un mois donné (YYYY-MM) : le 10 du mois suivant.
export function dateLimitePaiement(mois) {
  const [annee, m] = mois.split('-').map(Number);
  const moisSuivant = m === 12 ? 1 : m + 1;
  const anneeSuivante = m === 12 ? annee + 1 : annee;
  return `${anneeSuivante}-${String(moisSuivant).padStart(2, '0')}-10`;
}

// Montant mensuel plein tarif de l'abonnement Premium.
export const MONTANT_PREMIUM_MENSUEL = 30;

function joursDansLeMois(annee, mois) {
  return new Date(annee, mois, 0).getDate();
}

// Montant Premium dû pour un mois (YYYY-MM) donné, au prorata du nombre de
// jours si l'activation ou la désactivation est survenue en cours de mois.
function montantPremiumPourMois(centre, moisStr) {
  if (centre.premium_offert) return 0;
  if (!centre.premium_depuis) return 0;
  const moisActivation = centre.premium_depuis.slice(0, 7);
  const moisDesactivation = centre.premium_desactive_le ? centre.premium_desactive_le.slice(0, 7) : null;

  if (moisStr < moisActivation) return 0;
  if (moisDesactivation && moisStr > moisDesactivation) return 0;

  const [annee, mois] = moisStr.split('-').map(Number);
  const totalJours = joursDansLeMois(annee, mois);
  let jourDebut = 1;
  let jourFin = totalJours;

  if (moisStr === moisActivation) jourDebut = Number(centre.premium_depuis.slice(8, 10));
  if (moisDesactivation && moisStr === moisDesactivation) jourFin = Number(centre.premium_desactive_le.slice(8, 10));

  const joursFactures = jourFin - jourDebut + 1;
  if (joursFactures <= 0) return 0;
  if (joursFactures >= totalJours) return MONTANT_PREMIUM_MENSUEL;
  return Math.round((MONTANT_PREMIUM_MENSUEL * joursFactures / totalJours) * 100) / 100;
}

// Liste des mois (YYYY-MM) passés (avant le mois en cours) pour lesquels ce
// centre doit un montant Premium (au prorata le cas échéant), qu'il soit
// toujours abonné ou qu'il ait arrêté depuis.
function moisPremiumPasses(centre) {
  if (!centre.premium_depuis) return [];
  const moisActuel = todayISO().slice(0, 7);
  const moisFin = centre.premium_desactive_le && centre.premium_desactive_le.slice(0, 7) < moisActuel
    ? centre.premium_desactive_le.slice(0, 7)
    : moisPrecedent(moisActuel);

  const mois = [];
  let [annee, m] = centre.premium_depuis.slice(0, 7).split('-').map(Number);
  let cle = `${annee}-${String(m).padStart(2, '0')}`;
  while (cle <= moisFin) {
    mois.push(cle);
    m += 1;
    if (m > 12) { m = 1; annee += 1; }
    cle = `${annee}-${String(m).padStart(2, '0')}`;
  }
  return mois;
}

function moisPrecedent(moisStr) {
  const [annee, m] = moisStr.split('-').map(Number);
  return m === 1 ? `${annee - 1}-12` : `${annee}-${String(m - 1).padStart(2, '0')}`;
}

// Renvoie la liste des mois pour lesquels ce centre doit de la commission,
// dont la date limite de paiement (le 10 du mois suivant) est dépassée, et
// qui n'ont pas été marqués comme payés par l'admin.
export async function facturesEnRetard(centreId) {
  const factures = await all(
    `SELECT strftime('%Y-%m', r.created_at) AS mois, COALESCE(SUM(r.commission_montant), 0) AS montant
     FROM rdv r JOIN creneaux c ON c.id = r.creneau_id
     WHERE c.centre_id = ? AND r.statut = 'confirme'
     GROUP BY mois`,
    [centreId]
  );

  const centre = await get('SELECT est_premium, premium_depuis, premium_desactive_le, premium_offert FROM centres WHERE id = ?', [centreId]);
  const montantsParMois = new Map(factures.map((f) => [f.mois, f.montant || 0]));
  for (const mois of moisPremiumPasses(centre)) {
    const montantPremium = montantPremiumPourMois(centre, mois);
    if (montantPremium > 0) montantsParMois.set(mois, (montantsParMois.get(mois) || 0) + montantPremium);
  }

  const aujourdHui = todayISO();
  const enRetard = [];

  for (const [mois, montant] of montantsParMois) {
    if (!montant || montant <= 0) continue;
    const limite = dateLimitePaiement(mois);
    if (aujourdHui <= limite) continue; // délai pas encore dépassé

    const paiement = await get(
      `SELECT statut FROM factures_statuts WHERE centre_id = ? AND mois = ?`,
      [centreId, mois]
    );
    if (paiement?.statut === 'paye') continue;

    enRetard.push({ mois, montant, date_limite: limite });
  }

  return enRetard.sort((a, b) => a.mois.localeCompare(b.mois));
}

export async function centreEstBloque(centreId) {
  const retard = await facturesEnRetard(centreId);
  return retard.length > 0;
}

// Commission (et forfait Premium le cas échéant, au prorata) générés sur le
// mois calendaire en cours (pas encore exigible).
export async function commissionMoisEnCours(centreId) {
  const moisActuel = todayISO().slice(0, 7); // 'YYYY-MM'
  const { montant } = await get(
    `SELECT COALESCE(SUM(r.commission_montant), 0) AS montant
     FROM rdv r JOIN creneaux c ON c.id = r.creneau_id
     WHERE c.centre_id = ? AND r.statut = 'confirme' AND strftime('%Y-%m', r.created_at) = ?`,
    [centreId, moisActuel]
  );
  const centre = await get('SELECT premium_depuis, premium_desactive_le, premium_offert FROM centres WHERE id = ?', [centreId]);
  const montantPremium = centre ? montantPremiumPourMois(centre, moisActuel) : 0;
  return { mois: moisActuel, montant: montant + montantPremium, montant_premium: montantPremium };
}
