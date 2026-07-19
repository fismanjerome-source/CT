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
// concerné. Sans promotion active, renvoie le taux par défaut (30/25/20).
export async function calculerTauxCommissionEffectif(centreId, dateCreneauStr) {
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

  const aujourdHui = todayISO();
  const enRetard = [];

  for (const f of factures) {
    if (!f.montant || f.montant <= 0) continue;
    const limite = dateLimitePaiement(f.mois);
    if (aujourdHui <= limite) continue; // délai pas encore dépassé

    const paiement = await get(
      `SELECT statut FROM factures_statuts WHERE centre_id = ? AND mois = ?`,
      [centreId, f.mois]
    );
    if (paiement?.statut === 'paye') continue;

    enRetard.push({ mois: f.mois, montant: f.montant, date_limite: limite });
  }

  return enRetard;
}

export async function centreEstBloque(centreId) {
  const retard = await facturesEnRetard(centreId);
  return retard.length > 0;
}

// Commission générée sur le mois calendaire en cours (pas encore exigible).
export async function commissionMoisEnCours(centreId) {
  const moisActuel = todayISO().slice(0, 7); // 'YYYY-MM'
  const { montant } = await get(
    `SELECT COALESCE(SUM(r.commission_montant), 0) AS montant
     FROM rdv r JOIN creneaux c ON c.id = r.creneau_id
     WHERE c.centre_id = ? AND r.statut = 'confirme' AND strftime('%Y-%m', r.created_at) = ?`,
    [centreId, moisActuel]
  );
  return { mois: moisActuel, montant };
}
