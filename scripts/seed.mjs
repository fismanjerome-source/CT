// scripts/seed.mjs — Initialise la base avec des centres, contrôleurs et
// créneaux de démonstration (avec des trous volontaires dans les plannings).
//
// Usage : npm run seed

import { createClient } from '@libsql/client';
import crypto from 'node:crypto';

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;
const db = createClient(authToken ? { url, authToken } : { url });

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS centres (
  id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL, adresse TEXT NOT NULL,
  code_postal TEXT NOT NULL, ville TEXT NOT NULL, telephone TEXT, enseigne TEXT
);
CREATE TABLE IF NOT EXISTS controleurs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, centre_id INTEGER NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
  nom TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS creneaux (
  id INTEGER PRIMARY KEY AUTOINCREMENT, centre_id INTEGER NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
  controleur_id INTEGER NOT NULL REFERENCES controleurs(id) ON DELETE CASCADE,
  date TEXT NOT NULL, heure TEXT NOT NULL, duree_minutes INTEGER NOT NULL DEFAULT 30,
  statut TEXT NOT NULL DEFAULT 'disponible', promo_pourcentage INTEGER, UNIQUE(controleur_id, date, heure)
);
CREATE TABLE IF NOT EXISTS rdv (
  id INTEGER PRIMARY KEY AUTOINCREMENT, creneau_id INTEGER NOT NULL REFERENCES creneaux(id) ON DELETE CASCADE,
  client_nom TEXT NOT NULL, client_email TEXT NOT NULL, client_telephone TEXT NOT NULL,
  immatriculation TEXT NOT NULL, type_vehicule TEXT, reference TEXT NOT NULL UNIQUE,
  statut TEXT NOT NULL DEFAULT 'confirme', created_at TEXT NOT NULL
);
`;

async function main() {
  await db.executeMultiple(SCHEMA);

  const { rows } = await db.execute('SELECT COUNT(*) AS n FROM centres');
  if (rows[0].n > 0) {
    console.log('La base contient déjà des données — seed ignoré. Supprimez local.db pour repartir de zéro.');
    return;
  }

  console.log('Insertion des données de démonstration...');

  const centres = [
    ['Auto Sécurité Bastille', '12 rue de Charonne', '75011', 'Paris', '01 43 55 12 34', null],
    ['Contrôle Plus Montreuil', '5 avenue de la République', '93100', 'Montreuil', '01 48 57 22 10', 'Dekra'],
    ['Sécuritest Boulogne', '48 rue Gallieni', '92100', 'Boulogne-Billancourt', '01 46 21 09 88', 'Sécuritest'],
    ['Autovision Créteil', '3 rue Juliette Savar', '94000', 'Créteil', '01 43 99 44 55', 'Autovision'],
  ];
  const centreIds = [];
  for (const c of centres) {
    const res = await db.execute({
      sql: 'INSERT INTO centres (nom, adresse, code_postal, ville, telephone, enseigne) VALUES (?, ?, ?, ?, ?, ?)',
      args: c,
    });
    centreIds.push(Number(res.lastInsertRowid));
  }

  const controleurs = [
    [centreIds[0], 'Karim Belhadj', 'karim@autosecurite-bastille.fr'],
    [centreIds[1], 'Sophie Nguyen', 'sophie@controleplus-montreuil.fr'],
    [centreIds[2], 'Marc Dutronc', 'marc@securitest-boulogne.fr'],
    [centreIds[3], 'Fatima Rahmani', 'fatima@autovision-creteil.fr'],
  ];
  const controleurIds = [];
  for (const [centreId, nom, email] of controleurs) {
    const res = await db.execute({
      sql: 'INSERT INTO controleurs (centre_id, nom, email, password_hash) VALUES (?, ?, ?, ?)',
      args: [centreId, nom, email, hashPassword('demo1234')],
    });
    controleurIds.push(Number(res.lastInsertRowid));
  }

  const today = new Date();
  for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    if (d.getDay() === 0) continue; // fermé le dimanche
    const dateStr = d.toISOString().slice(0, 10);

    for (let idx = 0; idx < controleurIds.length; idx++) {
      const controleurId = controleurIds[idx];
      const centreId = centreIds[idx];
      const prixDemo = [72, 78, 76, 81][idx] || 78; // prix indicatif variable par centre
      let hour = 8, minute = 30;
      while (hour < 18) {
        const heureStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const isPause = hour === 12 || hour === 13;
        const skip = Math.random() < 0.22;
        if (!isPause && !skip) {
          await db.execute({
            sql: 'INSERT INTO creneaux (centre_id, controleur_id, date, heure, duree_minutes, statut, prix) VALUES (?, ?, ?, ?, 30, ?, ?)',
            args: [centreId, controleurId, dateStr, heureStr, 'disponible', prixDemo],
          });
        }
        minute += 30;
        if (minute >= 60) { minute = 0; hour += 1; }
      }
    }
  }

  console.log('✅ Données de démonstration créées avec succès.');
}

main().catch((e) => { console.error(e); process.exit(1); });
