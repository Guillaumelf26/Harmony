Harmony — Admin Songbook (ChordPro)

## Objectif
MVP “Songbook Pro” **admin-only** pour gérer une base de chants et éditer/visualiser des paroles en **ChordPro** avec preview live (accords au-dessus des paroles).

## Prérequis
- **Node.js**: 18.x (le repo est verrouillé sur Next 14 pour compatibilité Node 18)
- **npm**: 10+

## Installation
```bash
npm install
```

## Variables d’environnement
Copie `.env.example` vers `.env` puis adapte au besoin:

```bash
cp .env.example .env
```

Variables clés:
- **`DATABASE_URL`**: SQLite (`file:./dev.db`)
- **`NEXTAUTH_URL`**: `http://localhost:3000`
- **`NEXTAUTH_SECRET`**: une valeur aléatoire (obligatoire)
- **`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`**: identifiants de seed

## Base de données (Prisma + SQLite)
Créer la DB et appliquer les migrations:

```bash
# IMPORTANT: si Prisma échoue avec "unable to get local issuer certificate",
# voir la section "Problème certificats Prisma" plus bas.
npx prisma migrate dev
```

Créer (ou mettre à jour) l’admin:

```bash
npm run db:seed
```

Seed par défaut (si pas de variables):
- email: `admin@example.com`
- mot de passe: `admin1234`

## Lancer en dev
```bash
npm run dev
```

Puis ouvre:
- `http://localhost:3000/login`
- `http://localhost:3000/admin`

## Commandes utiles
- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Tests**: `npm test`
- **Seed admin**: `npm run db:seed`
- **Prisma Studio**: `npm run prisma:studio`

## Fonctionnalités MVP (actuel)
- Auth **Credentials** + RBAC **ADMIN**
- `/admin` layout 3 colonnes:
  - gauche: liste + recherche
  - centre: éditeur CodeMirror ChordPro + métadonnées (titre/artiste/tonalité/tags)
  - droite: preview live (parse+render ChordPro)
- CRUD songs via API (`/api/songs`, `/api/songs/:id`)
- Import/Export ChordPro (UI)
- Dirty state + confirmation avant changement/suppression
- Raccourci **Ctrl/Cmd+S**
- **Session** : en haut à droite dans l’admin, affichage de l’email connecté + bouton **Se déconnecter** ; lien **Se connecter** si non connecté.

## Mise en production (déploiement en ligne)

### À prévoir
- **URL publique** : définir `NEXTAUTH_URL` avec l’URL réelle (ex. `https://ton-app.vercel.app`).
- **Secret** : en prod, utiliser un `NEXTAUTH_SECRET` long et aléatoire (générateur en ligne ou `openssl rand -base64 32`).
- **Base de données** : SQLite avec `file:./dev.db` ne convient pas aux plateformes serverless (Vercel, etc.) car le disque n’est pas persistant. Il faut une base **externe** (PostgreSQL recommandé).

### Options de déploiement

1. **Vercel + base PostgreSQL**
   - Créer un projet sur [Vercel](https://vercel.com), connecter le repo, déployer.
   - Ajouter une base Postgres (Vercel Postgres, [Neon](https://neon.tech), [Supabase](https://supabase.com), etc.) et récupérer l’URL de connexion.
   - Dans le schéma Prisma, passer le provider à `postgresql` et l’`url` à `env("DATABASE_URL")`.
   - Créer une migration : `npx prisma migrate deploy` (en CI ou à la main après déploiement).
   - Variables d’environnement sur Vercel : `DATABASE_URL`, `NEXTAUTH_URL` (ex. `https://ton-projet.vercel.app`), `NEXTAUTH_SECRET`. Optionnel : `SEED_ADMIN_*` pour recréer un admin si besoin.
   - Créer l’admin en prod : exécuter le seed une fois (script ou commande locale avec `DATABASE_URL` de prod).

2. **Railway / Render / Fly.io**
   - Ces plateformes permettent un serveur Node persistant et souvent une base Postgres intégrée.
   - Déployer l’app (build: `npm run build`, start: `npm start`), configurer `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, puis lancer les migrations et le seed.

3. **VPS (Ubuntu, etc.)**
   - Installer Node, Postgres, lancer l’app avec `npm start` (ou PM2), mettre un reverse proxy (Nginx) avec HTTPS. Même principe pour les variables d’env et les migrations.

### Migration SQLite → PostgreSQL (Prisma)
- Dans `prisma/schema.prisma`, remplacer `provider = "sqlite"` par `provider = "postgresql"`.
- Adapter si besoin les types (ex. `tags Json` reste valide).
- Créer une nouvelle migration : `npx prisma migrate dev --name switch-to-postgres`.
- En prod : `npx prisma migrate deploy`.

Après déploiement, l’accès se fait via l’URL configurée ; la page d’accueil redirige vers `/admin`, le middleware envoie vers `/login` si non connecté, et la gestion de session (connexion / déconnexion) fonctionne comme en local.

## Problème certificats Prisma (Windows / proxy entreprise)
Si tu vois une erreur du type `unable to get local issuer certificate` lors d’une commande Prisma, c’est généralement dû à un proxy/inspection SSL.

Solutions (dans l’ordre):
- **Solution propre (recommandée)**: configurer Node pour utiliser le certificat racine de l’entreprise via `NODE_EXTRA_CA_CERTS` (fichier `.pem`/`.crt`).
- **Contournement temporaire (dev uniquement)**: exécuter la commande Prisma avec `NODE_TLS_REJECT_UNAUTHORIZED=0` (moins sûr).

Exemple contournement temporaire (Windows `cmd`):
```bat
set NODE_TLS_REJECT_UNAUTHORIZED=0&& npx prisma migrate dev
```

## Structure
- `app/` routes Next.js (login, admin, api)
- `components/` UI (Sidebar, Toolbar, Editor)
- `lib/` prisma/auth/rbac/validators
- `chordpro/` parse + render preview
- `prisma/` schema + migrations + seed
