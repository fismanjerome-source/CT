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
  enseigne      TEXT,
  latitude      REAL,
  longitude     REAL,
  types_vehicules_acceptes TEXT,
  ical_url TEXT,
  image_data TEXT,
  image_mime TEXT
);

CREATE TABLE IF NOT EXISTS controleurs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  centre_id      INTEGER NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
  nom            TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  telephone      TEXT,
  password_hash  TEXT NOT NULL
);

-- Un compte (gérant) peut gérer plusieurs centres : cette table de liaison
-- fait le lien, indépendamment du centre_id "principal" ci-dessus (conservé
-- pour compatibilité et comme centre par défaut à la connexion).
CREATE TABLE IF NOT EXISTS controleur_centres (
  controleur_id INTEGER NOT NULL REFERENCES controleurs(id) ON DELETE CASCADE,
  centre_id     INTEGER NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
  PRIMARY KEY (controleur_id, centre_id)
);

CREATE TABLE IF NOT EXISTS creneaux (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  centre_id       INTEGER NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
  controleur_id   INTEGER NOT NULL REFERENCES controleurs(id) ON DELETE CASCADE,
  date            TEXT NOT NULL,
  heure           TEXT NOT NULL,
  duree_minutes   INTEGER NOT NULL DEFAULT 30,
  statut          TEXT NOT NULL DEFAULT 'disponible',
  prix            REAL,
  types_vehicules TEXT,
  UNIQUE(controleur_id, date, heure)
);

CREATE TABLE IF NOT EXISTS rdv (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  creneau_id             INTEGER NOT NULL REFERENCES creneaux(id) ON DELETE CASCADE,
  client_prenom          TEXT,
  client_nom             TEXT NOT NULL,
  client_email           TEXT NOT NULL,
  client_telephone       TEXT NOT NULL,
  immatriculation        TEXT NOT NULL,
  type_vehicule          TEXT,
  reference              TEXT NOT NULL UNIQUE,
  statut                 TEXT NOT NULL DEFAULT 'confirme',
  prix                   REAL,
  commission_pourcentage INTEGER,
  commission_montant     REAL,
  rappel_envoye          INTEGER DEFAULT 0,
  created_at             TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contacts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  nom          TEXT NOT NULL,
  email        TEXT NOT NULL,
  telephone    TEXT,
  nom_centre   TEXT,
  message      TEXT,
  type         TEXT NOT NULL DEFAULT 'contact',
  statut       TEXT NOT NULL DEFAULT 'nouveau',
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS factures_statuts (
  centre_id  INTEGER NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
  mois       TEXT NOT NULL,
  statut     TEXT NOT NULL DEFAULT 'paye',
  paye_le    TEXT,
  PRIMARY KEY (centre_id, mois)
);

CREATE TABLE IF NOT EXISTS promotions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  centre_id      INTEGER REFERENCES centres(id) ON DELETE CASCADE,
  nom            TEXT NOT NULL,
  taux_semaine1  INTEGER NOT NULL,
  taux_semaine2  INTEGER NOT NULL,
  taux_semaine3  INTEGER NOT NULL,
  date_debut     TEXT NOT NULL,
  date_fin       TEXT NOT NULL,
  created_at     TEXT NOT NULL
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

const DEMO_PRIX = {
  'Auto Sécurité Bastille': 72,
  'Contrôle Plus Montreuil': 78,
  'Sécuritest Boulogne': 76,
  'Autovision Créteil': 81,
};

// Coordonnées approximatives (suffisantes pour la démo). Pour de vrais
// centres, il faudra géocoder leur adresse — voir lib/geocoding.js.
const DEMO_COORDS = {
  'Auto Sécurité Bastille': [48.8532, 2.3746],
  'Contrôle Plus Montreuil': [48.8638, 2.4432],
  'Sécuritest Boulogne': [48.8352, 2.2432],
  'Autovision Créteil': [48.7904, 2.4556],
};

// Volontairement variées pour illustrer la fonctionnalité : certains
// centres ne font pas les motos, d'autres ne font pas le GPL, etc.
const DEMO_TYPES_VEHICULES = {
  'Auto Sécurité Bastille': 'essence,diesel,hybride,electrique,moto',
  'Contrôle Plus Montreuil': 'essence,diesel,gpl,hybride,electrique,4x4',
  'Sécuritest Boulogne': 'essence,diesel,hybride,electrique',
  'Autovision Créteil': 'essence,diesel,gpl,hybride,electrique,4x4,moto',
};

async function runMigrations() {
  try {
    await db.execute(`ALTER TABLE centres ADD COLUMN enseigne TEXT`);
  } catch {
    // La colonne existe déjà — rien à faire.
  }

  try {
    await db.execute(`ALTER TABLE creneaux ADD COLUMN promo_pourcentage INTEGER`);
  } catch {
    // La colonne existe déjà — rien à faire.
  }

  try {
    await db.execute(`ALTER TABLE creneaux ADD COLUMN prix REAL`);
  } catch {}
  try {
    await db.execute(`ALTER TABLE centres ADD COLUMN latitude REAL`);
  } catch {}
  try {
    await db.execute(`ALTER TABLE centres ADD COLUMN longitude REAL`);
  } catch {}
  try {
    await db.execute(`ALTER TABLE centres ADD COLUMN types_vehicules_acceptes TEXT`);
  } catch {}
  try {
    await db.execute(`ALTER TABLE creneaux ADD COLUMN types_vehicules TEXT`);
  } catch {}
  try {
    await db.execute(`ALTER TABLE rdv ADD COLUMN prix REAL`);
  } catch {}
  try {
    await db.execute(`ALTER TABLE rdv ADD COLUMN commission_pourcentage INTEGER`);
  } catch {}
  try {
    await db.execute(`ALTER TABLE rdv ADD COLUMN commission_montant REAL`);
  } catch {}
  try {
    await db.execute(`ALTER TABLE controleurs ADD COLUMN telephone TEXT`);
  } catch {}
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS controleur_centres (
        controleur_id INTEGER NOT NULL REFERENCES controleurs(id) ON DELETE CASCADE,
        centre_id     INTEGER NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
        PRIMARY KEY (controleur_id, centre_id)
      )
    `);
  } catch {}
  try {
    await db.execute(`ALTER TABLE centres ADD COLUMN ical_url TEXT`);
  } catch {}
  try {
    await db.execute(`ALTER TABLE centres ADD COLUMN image_data TEXT`);
  } catch {}
  try {
    await db.execute(`ALTER TABLE centres ADD COLUMN image_mime TEXT`);
  } catch {}
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS factures_statuts (
        centre_id  INTEGER NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
        mois       TEXT NOT NULL,
        statut     TEXT NOT NULL DEFAULT 'paye',
        paye_le    TEXT,
        PRIMARY KEY (centre_id, mois)
      )
    `);
  } catch {}
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS promotions (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        centre_id      INTEGER REFERENCES centres(id) ON DELETE CASCADE,
        nom            TEXT NOT NULL,
        taux_semaine1  INTEGER NOT NULL,
        taux_semaine2  INTEGER NOT NULL,
        taux_semaine3  INTEGER NOT NULL,
        date_debut     TEXT NOT NULL,
        date_fin       TEXT NOT NULL,
        created_at     TEXT NOT NULL
      )
    `);
  } catch {}
  try {
    await db.execute(`ALTER TABLE contacts ADD COLUMN type TEXT DEFAULT 'contact'`);
  } catch {}
  try {
    await db.execute(`ALTER TABLE rdv ADD COLUMN rappel_envoye INTEGER DEFAULT 0`);
  } catch {}
  try {
    await db.execute(`ALTER TABLE rdv ADD COLUMN client_prenom TEXT`);
  } catch {}

  // Rattrapage : tout compte déjà existant doit être lié à son centre
  // principal dans la table de liaison multi-centres, sinon il perdrait
  // l'accès à son propre centre avec le nouveau système.
  try {
    await db.execute(`
      INSERT OR IGNORE INTO controleur_centres (controleur_id, centre_id)
      SELECT id, centre_id FROM controleurs
    `);
  } catch {}

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

  for (const [nom, prix] of Object.entries(DEMO_PRIX)) {
    try {
      await db.execute({
        sql: `UPDATE creneaux SET prix = ?
              WHERE prix IS NULL AND centre_id = (SELECT id FROM centres WHERE nom = ?)`,
        args: [prix, nom],
      });
    } catch {
      // Pas grave si ça échoue.
    }
  }

  for (const [nom, [lat, lng]] of Object.entries(DEMO_COORDS)) {
    try {
      await db.execute({
        sql: `UPDATE centres SET latitude = ?, longitude = ? WHERE nom = ? AND latitude IS NULL`,
        args: [lat, lng, nom],
      });
    } catch {
      // Pas grave si ça échoue.
    }
  }

  for (const [nom, types] of Object.entries(DEMO_TYPES_VEHICULES)) {
    try {
      await db.execute({
        sql: `UPDATE centres SET types_vehicules_acceptes = ? WHERE nom = ? AND types_vehicules_acceptes IS NULL`,
        args: [types, nom],
      });
    } catch {
      // Pas grave si ça échoue.
    }
  }

  // Correction : "essence_diesel" (ancienne valeur fusionnée) devient
  // "essence,diesel" (deux catégories distinctes) pour les centres déjà
  // configurés avant cette séparation.
  try {
    const centresAvecAncienneValeur = await db.execute(
      `SELECT id, types_vehicules_acceptes FROM centres WHERE types_vehicules_acceptes LIKE '%essence_diesel%'`
    );
    for (const row of centresAvecAncienneValeur.rows) {
      const corrige = String(row.types_vehicules_acceptes).replace('essence_diesel', 'essence,diesel');
      await db.execute({ sql: `UPDATE centres SET types_vehicules_acceptes = ? WHERE id = ?`, args: [corrige, row.id] });
    }
  } catch {
    // Pas grave si ça échoue.
  }
  try {
    await db.execute(`UPDATE creneaux SET types_vehicules = 'essence' WHERE types_vehicules = 'essence_diesel'`);
  } catch {
    // Pas grave si ça échoue.
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
