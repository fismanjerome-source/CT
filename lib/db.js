// lib/db.js — connexion à la base (SQLite local en dev, Turso en production
// via les mêmes variables d'environnement) + création du schéma.

import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient(
  authToken ? { url, authToken } : { url }
);

const SCHEMA = `
CREATE TABLE IF NOT EXISTS centres (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nom           TEXT NOT NULL,
  adresse       TEXT NOT NULL,
  code_postal   TEXT NOT NULL,
  ville         TEXT NOT NULL,
  telephone     TEXT,
  enseigne      TEXT
);

CREATE TABLE IF NOT EXISTS controleurs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  centre_id      INTEGER NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
  nom            TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS creneaux (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  centre_id       INTEGER NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
  controleur_id   INTEGER NOT NULL REFERENCES controleurs(id) ON DELETE CASCADE,
  date            TEXT NOT NULL,
  heure           TEXT NOT NULL,
  duree_minutes   INTEGER NOT NULL DEFAULT 30,
  statut          TEXT NOT NULL DEFAULT 'disponible',
  UNIQUE(controleur_id, date, heure)
);

CREATE TABLE IF NOT EXISTS rdv (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  creneau_id        INTEGER NOT NULL REFERENCES creneaux(id) ON DELETE CASCADE,
  client_nom        TEXT NOT NULL,
  client_email      TEXT NOT NULL,
  client_telephone  TEXT NOT NULL,
  immatriculation   TEXT NOT NULL,
  type_vehicule     TEXT,
  reference         TEXT NOT NULL UNIQUE,
  statut            TEXT NOT NULL DEFAULT 'confirme',
  created_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_creneaux_centre_date ON creneaux(centre_id, date);
CREATE INDEX IF NOT EXISTS idx_creneaux_controleur_date ON creneaux(controleur_id, date);
`;

// La création du schéma est mise en cache au niveau du module : sur un
// serveur Node long-lived (npm run dev / npm run start), elle ne s'exécute
// qu'une fois. Sur Vercel (fonctions serverless), elle s'exécute au réveil
// de chaque instance, ce qui reste sans danger grâce à IF NOT EXISTS.
let schemaReady = null;
export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = db.executeMultiple(SCHEMA).then(() => runMigrations());
  }
  return schemaReady;
}

// Migrations légères pour les bases déjà déployées avant l'ajout d'une
// colonne : chaque étape est sans danger si elle est rejouée plusieurs fois.
const DEMO_ENSEIGNES = {
  'Contrôle Plus Montreuil': 'Dekra',
  'Sécuritest Boulogne': 'Sécuritest',
  'Autovision Créteil': 'Autovision',
};

async function runMigrations() {
  try {
    await db.execute(`ALTER TABLE centres ADD COLUMN enseigne TEXT`);
  } catch {
    // La colonne existe déjà — rien à faire.
  }

  for (const [nom, enseigne] of Object.entries(DEMO_ENSEIGNES)) {
    try {
      await db.execute({
        sql: `UPDATE centres SET enseigne = ? WHERE nom = ? AND enseigne IS NULL`,
        args: [enseigne, nom],
      });
    } catch {
      // Pas grave si ça échoue (ex: table pas encore prête au tout premier lancement).
    }
  }
}

// ---- Helpers ----
export async function all(sql, args = []) {
  await ensureSchema();
  const result = await db.execute({ sql, args });
  return result.rows;
}

export async function get(sql, args = []) {
  const rows = await all(sql, args);
  return rows[0] || null;
}

export async function run(sql, args = []) {
  await ensureSchema();
  return db.execute({ sql, args });
}
