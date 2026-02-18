# Harmony — Admin Songbook (ChordPro)

## Objectif
MVP "Songbook Pro" **admin-only** pour gérer une base de chants et éditer/visualiser des paroles en **ChordPro** avec preview live (accords au-dessus des paroles).

**Cible** : une équipe ou un administrateur qui maintient un répertoire de chants (groupe, église, asso, groupe musical, etc.).

## Prérequis
- **Node.js** : 18.x
- **npm** : 10+

## Installation
```bash
npm install
```

## Variables d'environnement
Copie `.env.example` vers `.env` puis adapte :

```bash
cp .env.example .env
```

Variables clés :
- **`DATABASE_URL`** : URL PostgreSQL (ex. `postgresql://user:pass@host:5432/db`)
- **`NEXTAUTH_URL`** : `http://localhost:3000` en dev
- **`NEXTAUTH_SECRET`** : valeur aléatoire (obligatoire)
- **`SEED_ADMIN_EMAIL`** / **`SEED_ADMIN_PASSWORD`** : identifiants du compte admin (à définir explicitement)
- **`BLOB_READ_WRITE_TOKEN`** : token Vercel Blob pour l'upload audio (optionnel en dev)

## Base de données (Prisma + PostgreSQL)
Le projet utilise **PostgreSQL**. Créer la base puis appliquer les migrations :

```bash
npx prisma migrate dev
```

Créer ou mettre à jour le compte admin :

```bash
npm run db:seed
```

> **Sécurité** : En production, le seed refuse de créer un admin si le mot de passe est vide ou reste sur la valeur par défaut (`admin1234`). Définis `SEED_ADMIN_EMAIL` et `SEED_ADMIN_PASSWORD` dans tes variables d'environnement.

## Lancer en dev
```bash
npm run dev
```

Puis ouvre :
- `http://localhost:3000/login`
- `http://localhost:3000/admin`

## Commandes utiles
- **Dev** : `npm run dev`
- **Build** : `npm run build`
- **Tests** : `npm test`
- **Seed admin** : `npm run db:seed`
- **Prisma Studio** : `npm run prisma:studio`

## Fonctionnalités
- **Auth** : Credentials + RBAC ADMIN
- **Interface** : layout 3 colonnes (liste/recherche, éditeur, preview live)
- **CRUD** : chants via API
- **ChordPro** : parsing, rendu 2 lignes (accords/paroles), preview live
- **Édition** :
  - Accords rapides selon la tonalité (I, IV, V, ii, iii, vi)
  - Popup 7/9/11 au curseur pour étendre les accords
  - Sync tonalité ↔ directive `{key: X}`
- **Import/Export** : ChordPro (UI)
- **Audio** : upload par chant (Vercel Blob), formats mp3, wav, ogg, webm, mp4
- **Lien original** : URL YouTube ou autre par chant
- **Favoris** : stockés en base (synchronisés entre appareils), filtre Tout/Favoris
- **Session** : avatar avec menu (Paramètres, déconnexion)
- **Raccourci** : Ctrl/Cmd+S pour sauvegarder

## Mise en production

### Plateforme recommandée : Railway
- Créer un projet sur [Railway](https://railway.app)
- Connecter le repo GitHub
- Ajouter une base PostgreSQL (New → Database → PostgreSQL)
- Variables : `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `BLOB_READ_WRITE_TOKEN`
- Migrations : `npx prisma migrate deploy` (en local avec `DATABASE_URL` Railway, ou via script de build)
- Seed : exécuter une fois avec les variables de prod

### Autres options
- **Vercel** + base Postgres externe (Neon, Supabase, etc.)
- **Render / Fly.io** : serveur Node + Postgres intégré
- **VPS** : Node + Postgres + Nginx

### Checklist prod
- [ ] `NEXTAUTH_URL` = URL publique de l'app
- [ ] `NEXTAUTH_SECRET` long et aléatoire
- [ ] `SEED_ADMIN_EMAIL` et `SEED_ADMIN_PASSWORD` définis et sécurisés
- [ ] Migrations appliquées

## Problème certificats Prisma (Windows / proxy entreprise)
Si erreur `unable to get local issuer certificate` :
- **Propre** : `NODE_EXTRA_CA_CERTS` vers le certificat racine
- **Contournement (dev)** : `NODE_TLS_REJECT_UNAUTHORIZED=0` (déconseillé en prod)

## Tests
Les tests utilisent un token spécial en mode `NODE_ENV=test`. Définir `TEST_ADMIN_TOKEN` dans `.env` (optionnel, valeur par défaut : `test-admin-token`).

```bash
npm test
```

## Structure
- `app/` : routes Next.js (login, admin, api)
- `components/` : SidebarSongList, Toolbar, EditorPane, SongReadingView, FavoritesProvider, etc.
- `lib/` : prisma, auth, rbac, validators, useClickOutside, transposeChord, chordAtCursor
- `chordpro/` : parse + render
- `prisma/` : schema, migrations, seed
