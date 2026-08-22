import { get, all, run } from '@/lib/db';

const CARACTERES = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans caractères ambigus (0/O, 1/I)
const DUREE_RECOMPENSE_JOURS = 60; // « 2 mois » — approximé en jours pour un calcul simple et fiable

// Génère un code de parrainage court, unique, lisible (6 caractères).
export async function genererCodeParrainage() {
  for (let tentative = 0; tentative < 10; tentative++) {
    let code = '';
    for (let i = 0; i < 6; i++) code += CARACTERES[Math.floor(Math.random() * CARACTERES.length)];
    const existant = await get('SELECT id FROM centres WHERE code_parrainage = ?', [code]);
    if (!existant) return code;
  }
  // Dans l'improbable cas de 10 collisions d'affilée, on ajoute un suffixe temporel.
  return 'P' + Date.now().toString(36).toUpperCase().slice(-5);
}

// Octroie la récompense de parrainage (2 mois de Premium offert) au centre
// parrain, une seule fois par filleul. Renvoie true si la récompense vient
// d'être accordée à l'instant, false si elle l'était déjà ou si le centre
// parrain n'existe pas.
export async function accorderRecompenseParrainage(centreFilleulId) {
  const filleul = await get('SELECT id, parraine_par_code, parrainage_recompense_le FROM centres WHERE id = ?', [centreFilleulId]);
  if (!filleul || !filleul.parraine_par_code || filleul.parrainage_recompense_le) return false;

  const parrain = await get('SELECT id, est_premium FROM centres WHERE code_parrainage = ?', [filleul.parraine_par_code]);
  if (!parrain) return false;

  const maintenant = new Date();
  const jusqua = new Date(maintenant.getTime() + DUREE_RECOMPENSE_JOURS * 24 * 60 * 60 * 1000);

  await run(
    `UPDATE centres SET est_premium = 1, premium_offert = 1, premium_offert_jusqua = ?,
     premium_depuis = COALESCE(premium_depuis, ?) WHERE id = ?`,
    [jusqua.toISOString(), maintenant.toISOString(), parrain.id]
  );
  await run('UPDATE centres SET parrainage_recompense_le = ? WHERE id = ?', [maintenant.toISOString(), centreFilleulId]);

  return true;
}

// Recherche les filleuls ayant honoré leur tout premier rendez-vous mais pas
// encore déclenché la récompense de leur parrain — à appeler périodiquement
// (tâche planifiée).
export async function traiterRecompensesEnAttente() {
  const filleulsEligibles = await all(
    `SELECT DISTINCT c.id AS centre_id
     FROM centres c
     JOIN creneaux cr ON cr.centre_id = c.id
     JOIN rdv r ON r.creneau_id = cr.id
     WHERE c.parraine_par_code IS NOT NULL
       AND c.parrainage_recompense_le IS NULL
       AND r.statut = 'confirme'
       AND cr.date < date('now')`
  );

  let accordees = 0;
  for (const f of filleulsEligibles) {
    const accordee = await accorderRecompenseParrainage(f.centre_id);
    if (accordee) accordees += 1;
  }
  return accordees;
}

// Désactive le Premium offert dont la période de 2 mois est expirée — les
// centres qui ont ensuite pris un abonnement Premium payant normalement ne
// sont pas concernés (premium_offert_jusqua reste alors non pertinent).
export async function expirerPremiumOfferts() {
  const expires = await all(
    `SELECT id FROM centres WHERE premium_offert = 1 AND premium_offert_jusqua IS NOT NULL AND premium_offert_jusqua < ?`,
    [new Date().toISOString()]
  );
  for (const c of expires) {
    await run(
      `UPDATE centres SET est_premium = 0, premium_offert = 0, premium_desactive_le = ? WHERE id = ?`,
      [new Date().toISOString(), c.id]
    );
  }
  return expires.length;
}
