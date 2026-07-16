# RDV Contrôle Technique — version Next.js

Version du projet reconstruite avec **Next.js (App Router)** + **libSQL**
(compatible SQLite), pensée pour un déploiement gratuit sur **Vercel**.

> ⚠️ Ce code a été écrit avec soin en suivant les conventions officielles de
> Next.js 16 et de `@libsql/client`, mais **n'a pas pu être exécuté avant
> livraison** (environnement de génération sans accès réseau pour installer
> les paquets npm). Suivez les étapes ci-dessous pour le tester, et signalez-moi
> toute erreur rencontrée — je corrigerai.

## Installation

```bash
npm install
npm run seed   # crée local.db avec les données de démonstration
npm run dev
```

Ouvrez http://localhost:3000

## Comptes de démonstration

| Email | Mot de passe |
|---|---|
| karim@autosecurite-bastille.fr | demo1234 |
| sophie@controleplus-montreuil.fr | demo1234 |
| marc@securitest-boulogne.fr | demo1234 |
| fatima@autovision-creteil.fr | demo1234 |

Pour repartir de zéro : supprimez `local.db` et relancez `npm run seed`.

## Déploiement gratuit sur Vercel + Turso

1. **Créer une base gratuite sur [turso.tech](https://turso.tech)** (compte
   gratuit, pas de carte bancaire). Récupérez l'URL de la base
   (`libsql://...`) et un token d'authentification.
2. **Pousser le projet sur GitHub.**
3. Sur [vercel.com](https://vercel.com), **New Project** → importez le dépôt.
4. Dans les variables d'environnement du projet Vercel, ajoutez :
   - `TURSO_DATABASE_URL` = l'URL fournie par Turso
   - `TURSO_AUTH_TOKEN` = le token fourni par Turso
   - `SESSION_SECRET` = une chaîne aléatoire longue (générez-la avec
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
5. Déployez. Pour initialiser les données de démo sur la base Turso, lancez
   une fois en local, avec les mêmes variables d'environnement :
   ```bash
   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run seed
   ```

Avantage par rapport à Render : pas de mise en veille après inactivité, et la
base de données Turso est persistante (contrairement à un simple fichier
SQLite sur un service serverless).

## Différences avec la version précédente (Node.js pur)

| | Version Node.js pure | Version Next.js |
|---|---|---|
| Frontend | HTML/JS vanilla | Composants React |
| Backend | `http` natif, routes manuelles | API Routes (`app/api/**/route.js`) |
| Base de données | `node:sqlite` (fichier local uniquement) | `@libsql/client` (fichier local **ou** Turso en production) |
| Sessions pro | En mémoire (Map côté serveur) | Cookie signé sans état (fonctionne en serverless) |
| Hébergement recommandé | VPS ou Render | Vercel (gratuit, sans mise en veille) |

La logique métier (recherche de centres, calendrier, réservation,
« combler des horaires vides », espace pro) est identique aux deux versions.

## Architecture

```
ct-nextjs/
├── app/
│   ├── layout.js, globals.css       # mise en page + design system
│   ├── page.js                      # accueil (recherche de centres)
│   ├── centre/[id]/page.js          # calendrier + réservation
│   ├── suivi/page.js                # suivi / annulation de RDV
│   ├── pro/login/page.js
│   ├── pro/dashboard/page.js
│   └── api/                         # toutes les routes API (voir ci-dessous)
├── lib/
│   ├── db.js                        # connexion libSQL + schéma
│   ├── auth.js                      # mots de passe + sessions
│   └── utils.js
├── scripts/seed.mjs                 # données de démonstration
└── package.json
```

### Routes API
- `GET /api/centres` — recherche
- `GET /api/centres/:id`, `/disponibilites`, `/creneaux`
- `POST /api/rdv`, `GET/DELETE /api/rdv/:reference`
- `POST /api/pro/login`, `/logout`, `GET /api/pro/me`
- `GET/POST /api/pro/creneaux`, `DELETE /api/pro/creneaux/:id`
- `POST /api/pro/creneaux/combler-vides` — fonctionnalité clé
- `GET /api/pro/rdv`

## Prochaines étapes suggérées
- Emails de confirmation/annulation (ex. avec Resend, qui a un plan gratuit).
- Interface d'administration pour ajouter des centres/contrôleurs sans passer par le script de seed.
- Recherche géographique réelle (distance) plutôt qu'un filtre texte.
