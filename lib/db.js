// lib/db.js — connexion à la base (SQLite local en dev, Turso en production
// via les mêmes variables d'environnement) + création du schéma.

import { createClient } from '@libsql/client';
import { hashPassword } from './auth';

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
  verification_envoyee   INTEGER DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS fiches_juridiques (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  titre       TEXT NOT NULL,
  resume      TEXT,
  contenu     TEXT NOT NULL,
  lien_externe TEXT,
  lien_libelle TEXT,
  ordre       INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents_legaux (
  cle         TEXT PRIMARY KEY,
  contenu     TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admins (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nom            TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  totp_secret    TEXT,
  totp_actif     INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS visites (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  chemin     TEXT NOT NULL,
  categorie  TEXT NOT NULL,
  ville      TEXT,
  region     TEXT,
  pays       TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_visites_categorie_date ON visites(categorie, created_at);

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
    await db.execute(`ALTER TABLE creneaux ADD COLUMN type_visite TEXT NOT NULL DEFAULT 'normale'`);
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
    await db.execute(`ALTER TABLE rdv ADD COLUMN verification_envoyee INTEGER DEFAULT 0`);
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

  // Amorçage des comptes admin nommés, une seule fois : si la table est
  // vide et qu'ADMIN_PASSWORD est configurée, on crée deux comptes
  // ("Manon" et "Jérôme") avec ce mot de passe de départ commun — à changer
  // individuellement ensuite depuis « Paramètres » dans l'espace admin.
  try {
    const resultatCompte = await db.execute('SELECT COUNT(*) AS total FROM admins');
    const total = Number(resultatCompte.rows[0]?.total || 0);
    if (total === 0 && process.env.ADMIN_PASSWORD) {
      const motDePasseInitial = hashPassword(process.env.ADMIN_PASSWORD);
      const maintenant = new Date().toISOString();
      for (const [nom, email] of [
        ['Manon', 'manon@creneauct.fr'],
        ['Jérôme', 'jerome@creneauct.fr'],
      ]) {
        await db.execute({
          sql: `INSERT OR IGNORE INTO admins (nom, email, password_hash, created_at) VALUES (?, ?, ?, ?)`,
          args: [nom, email, motDePasseInitial, maintenant],
        });
      }
    }
  } catch {
    // Pas grave si ça échoue — les comptes pourront être créés plus tard.
  }

  // Amorçage d'une première fiche juridique (convention collective), une
  // seule fois, si la table est vide.
  try {
    const resultatFiches = await db.execute('SELECT COUNT(*) AS total FROM fiches_juridiques');
    const totalFiches = Number(resultatFiches.rows[0]?.total || 0);
    if (totalFiches === 0) {
      const maintenant = new Date().toISOString();
      await db.execute({
        sql: `INSERT INTO fiches_juridiques (titre, resume, contenu, lien_externe, lien_libelle, ordre, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'Convention collective applicable aux centres de contrôle technique',
          "La convention collective nationale des services de l'automobile (IDCC 1090) régit notamment les contrôleurs techniques.",
          `Les centres de contrôle technique relèvent, sauf exception, de la convention collective nationale des services de l'automobile — commerce et réparation de l'automobile, du cycle et du motocycle et des activités connexes, ainsi que du contrôle technique automobile (IDCC 1090, brochure n°3034).

Signée le 15 janvier 1981 et étendue par arrêté du 30 octobre 1981, cette convention couvre notamment les mécaniciens, carrossiers, vendeurs, conseillers commerciaux, et bien sûr les contrôleurs techniques.

Elle fixe en particulier les règles applicables en matière de période d'essai, de classification des emplois, de rémunération minimale, de congés et de conditions de travail au sein des centres de contrôle technique.

Le texte intégral, à jour, est consultable gratuitement sur Légifrance, la référence officielle du droit français.`,
          'https://www.legifrance.gouv.fr/conv_coll/id/KALICONT000005635191',
          'Consulter le texte intégral sur Légifrance',
          1,
          maintenant, maintenant,
        ],
      });
    }
  } catch {
    // Pas grave si ça échoue — la fiche pourra être créée manuellement depuis l'espace admin.
  }

  // Amorçage du contenu des CGU dans le système éditable, une seule fois.
  try {
    const resultatCgu = await db.execute("SELECT COUNT(*) AS total FROM documents_legaux WHERE cle = 'cgu'");
    const totalCgu = Number(resultatCgu.rows[0]?.total || 0);
    if (totalCgu === 0) {
      const contenuCgu = `## Article 1 — Objet
Les présentes Conditions Générales d'Utilisation (ci-après les « CGU ») ont pour objet de définir les modalités et conditions dans lesquelles Créneau CT (ci-après « la Plateforme », « nous ») met à disposition des utilisateurs un service de mise en relation entre des particuliers souhaitant faire réaliser un contrôle technique automobile ou moto (ci-après « l'Utilisateur », « le Client ») et des centres de contrôle technique agréés (ci-après « le Centre », « le Professionnel »).

L'utilisation de la Plateforme, quelle qu'en soit la forme, implique l'acceptation pleine et entière des présentes CGU par l'Utilisateur et par le Centre.

## Article 2 — Description du service
Créneau CT est un service de réservation en ligne permettant :
- aux Utilisateurs de consulter les disponibilités des Centres partenaires et de réserver un créneau de contrôle technique ;
- aux Centres de publier et gérer leurs créneaux disponibles, notamment ceux libérés à court terme dans leur planning.

Créneau CT n'est pas un centre de contrôle technique et ne réalise elle-même aucun contrôle technique. La Plateforme agit exclusivement en qualité d'intermédiaire technique de mise en relation entre l'Utilisateur et le Centre. La réalisation du contrôle technique relève de la seule responsabilité du Centre, dans le respect de la réglementation applicable au contrôle technique des véhicules.

## Article 3 — Réservation d'un rendez-vous
La réservation d'un créneau via la Plateforme constitue un engagement de l'Utilisateur à se présenter au Centre choisi, à la date et l'heure sélectionnées, muni du véhicule concerné et des documents requis pour le contrôle technique.

Chaque réservation confirmée donne lieu à l'envoi d'une référence unique, permettant à l'Utilisateur de consulter ou d'annuler son rendez-vous depuis la page dédiée du site.

## Article 4 — Prix et paiement
Le prix du contrôle technique affiché sur la Plateforme est fixé librement par chaque Centre et lui est intégralement dû. Le règlement du contrôle technique s'effectue directement auprès du Centre, selon les moyens de paiement qu'il accepte — la Plateforme n'intervient pas dans cette transaction et ne perçoit, à ce jour, aucun paiement de la part de l'Utilisateur.

Le prix affiché tient compte, le cas échéant, d'une remise accordée librement par le Centre, à sa seule discrétion, ou d'une promotion ponctuelle proposée par la Plateforme elle-même — auquel cas la commission normalement due par le Centre à la Plateforme est réduite en conséquence, sans aucune répercussion sur le prix payé par l'Utilisateur ni sur la rémunération du Centre. Le prix final affiché avant confirmation de la réservation est celui effectivement dû par l'Utilisateur au Centre.

## Article 5 — Modification, annulation et absence
L'Utilisateur peut, gratuitement et sans justificatif, annuler ou modifier son rendez-vous à tout moment avant sa date, depuis la page « Suivre un RDV », à l'aide de sa référence de réservation et de l'adresse email utilisée lors de la réservation. Le créneau annulé ou libéré par une modification est immédiatement remis à disposition des autres Utilisateurs.

Par mesure d'organisation, aucun créneau ne peut être réservé ou modifié s'il reste moins d'1h30 avant son horaire.

En cas d'absence de l'Utilisateur au rendez-vous sans annulation préalable, le Centre peut le signaler depuis son espace professionnel ; la commission normalement due à la Plateforme sur ce rendez-vous n'est alors pas exigible. L'Utilisateur en est informé par email. Un email de suivi est par ailleurs envoyé à chaque Utilisateur après son rendez-vous afin de vérifier son bon déroulement. En cas d'absences répétées et avérées, la Plateforme se réserve le droit de refuser toute réservation ultérieure de la part de l'Utilisateur concerné.

## Article 6 — Obligations des Centres partenaires
Chaque Centre s'engage à ne publier sur la Plateforme que des créneaux réellement disponibles, à honorer les rendez-vous confirmés, et à fournir des informations exactes (prix, coordonnées, agrément). Le Centre demeure seul responsable de la conformité de ses prestations à la réglementation applicable au contrôle technique.

## Article 7 — Responsabilité
La Plateforme met tout en œuvre pour assurer l'exactitude des informations affichées (disponibilités, prix), sans pouvoir garantir l'absence totale d'erreur, notamment en cas de modification de dernière minute par un Centre. La Plateforme ne saurait être tenue responsable de la qualité, de la conformité ou des conditions de réalisation du contrôle technique lui-même, qui relèvent exclusivement du Centre.

Conformément à l'article L.441-10 du Code de commerce, tout retard de paiement d'une commission par un Centre donne lieu, de plein droit et sans mise en demeure préalable, à des pénalités calculées au taux d'intérêt de la Banque Centrale Européenne majoré de 10 points, ainsi qu'à une indemnité forfaitaire pour frais de recouvrement de 40 €. Ce montant peut être révisé par la Plateforme sur présentation des frais réellement engagés.

## Article 8 — Données personnelles
Les données transmises lors d'une réservation (nom, email, téléphone, immatriculation) sont utilisées exclusivement pour la gestion du rendez-vous et sa communication au Centre concerné. Conformément au Règlement Général sur la Protection des Données (RGPD), toute personne dispose d'un droit d'accès, de rectification et de suppression de ses données, qu'elle peut exercer en écrivant à contact@creneauct.fr. Les Centres partenaires disposent en outre d'un accès direct à la suppression de leurs données personnelles depuis leur espace professionnel (rubrique Paramètres). Par obligation légale de conservation des documents comptables, l'historique des rendez-vous déjà honorés est conservé de façon anonyme après suppression d'un compte, sans qu'aucune donnée ne permette plus d'identifier la personne concernée.

Par ailleurs, la Plateforme mesure sa fréquentation à des fins statistiques internes (pages consultées, ville et région estimées à partir de l'adresse IP de connexion). Cette mesure ne repose sur aucun cookie ni traceur, et l'adresse IP elle-même n'est jamais conservée : seule une localisation approximative (ville, région) en est déduite au moment de la visite, sans lien possible avec l'identité de la personne.

## Article 9 — Propriété intellectuelle
L'ensemble des éléments composant la Plateforme (structure, textes, logo, charte graphique) est protégé au titre du droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.

## Article 10 — Droit applicable
Les présentes CGU sont soumises au droit français. Tout litige relatif à leur interprétation ou leur exécution relève, à défaut de résolution amiable, des juridictions françaises compétentes.

## Article 11 — Modification des CGU
La Plateforme se réserve le droit de modifier les présentes CGU à tout moment. Les Utilisateurs sont invités à les consulter régulièrement.`;
      await db.execute({
        sql: `INSERT INTO documents_legaux (cle, contenu, updated_at) VALUES ('cgu', ?, ?)`,
        args: [contenuCgu, new Date().toISOString()],
      });
    }
  } catch {
    // Pas grave si ça échoue — le contenu pourra être ajouté manuellement.
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
