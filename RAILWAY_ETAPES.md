# Railway : étapes depuis la création de la base de données

Guide pas à pas à partir du moment où tu crées la base PostgreSQL dans Railway.

---

## Étape 1 : Créer la base PostgreSQL dans Railway

1. Ouvre ton **projet** Railway (celui qui contient déjà ton app Harmony reliée à GitHub).
2. Clique sur **"+ New"** (ou **"Add a service"**).
3. Choisis **"Database"**.
4. Sélectionne **"PostgreSQL"**.
5. Railway crée la base. Tu vois apparaître un nouveau **service** (une carte) avec un nom du type "PostgreSQL" ou "postgres".

---

## Étape 2 : Récupérer l’URL de la base (DATABASE_URL)

1. Clique sur ce **service PostgreSQL** (la carte de la base).
2. Ouvre l’onglet **"Variables"** (ou **"Connect"** / **"Connection"**).
3. Tu dois voir une variable **`DATABASE_URL`** (ou **`DATABASE_PRIVATE_URL`** selon les versions).
4. **Copie** sa valeur (elle ressemble à :  
   `postgresql://postgres:MotDePasse@containers-us-west-xxx.railway.app:5432/railway`).  
   Garde-la sous la main pour l’étape suivante.

---

## Étape 3 : Donner DATABASE_URL à ton app Harmony

1. Retourne dans le **projet** (vue d’ensemble avec tous les services).
2. Clique sur le **service de ton application** (Harmony / Next.js), pas sur PostgreSQL.
3. Ouvre l’onglet **"Variables"**.
4. Clique sur **"+ New Variable"** (ou **"Add variable"**).
5. **Nom** : `DATABASE_URL`  
   **Valeur** : colle l’URL que tu as copiée à l’étape 2.
6. Sauvegarde si nécessaire.  
   (Sur certaines interfaces, tu peux aussi **référencer** la variable de la base : "Add reference" → choisir le service PostgreSQL → variable `DATABASE_URL`.)

Ton app aura ainsi accès à la base au prochain déploiement.

---

## Étape 4 : Ajouter les autres variables pour Harmony

Toujours dans **Variables** du **service app** (pas de la base), ajoute **une par une** :

| Nom | Valeur | À faire |
|-----|--------|--------|
| `NEXTAUTH_SECRET` | Une chaîne aléatoire longue | Va sur [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32), génère, copie-colle. |
| `NEXTAUTH_URL` | (vide pour l’instant) | On la remplira à l’étape 7. Tu peux laisser vide ou mettre `http://localhost:3000` en temporaire. |
| `SEED_ADMIN_EMAIL` | Ton email | Ex. ton adresse Gmail ou pro. C’est avec ça que tu te connecteras en admin. |
| `SEED_ADMIN_PASSWORD` | Un mot de passe | Choisis un mot de passe sûr (tu t’en serviras pour te connecter à l’app en ligne). |

Enregistre / sauvegarde après chaque variable.

---

## Étape 5 : Pousser le code (PostgreSQL + migration) sur GitHub

Sur ton PC, à la racine du projet Harmony :

1. Ouvre un **terminal** (dans Cursor : Ctrl+`).
2. Vérifie que les changements Prisma/PostgreSQL sont bien là :
   ```bash
   git status
   ```
3. Si tu as des fichiers modifiés (prisma, RAILWAY_*.md, etc.) :
   ```bash
   git add .
   git commit -m "PostgreSQL pour Railway"
   git push
   ```
4. Railway va **redéployer** tout seul après le `git push`. Attends que le déploiement soit terminé (statut "Success" / vert).

---

## Étape 6 : Appliquer les migrations et créer l’admin (une fois)

Railway ne lance pas les commandes Prisma. Tu dois les lancer **une fois** avec l’URL de la base Railway.

1. Sur Railway, rouvre le service **PostgreSQL** → onglet **Variables** et **recopie** `DATABASE_URL`.
2. Sur ton PC, ouvre un **terminal** à la racine du projet Harmony.
3. **Sous PowerShell** (Windows) :
   ```powershell
   $env:DATABASE_URL="postgresql://..."
   ```
   Colle à la place de `postgresql://...` **toute** l’URL copiée (entre guillemets).
4. Lance les migrations :
   ```bash
   npx prisma migrate deploy
   ```
   Tu dois voir quelque chose comme : `Applied 1 migration(s).`
5. Crée le compte admin (seed) :
   ```bash
   npm run db:seed
   ```
   Avec les variables que tu as mises sur Railway, le seed utilise `SEED_ADMIN_EMAIL` et `SEED_ADMIN_PASSWORD` **en local** seulement si tu les définis. Sinon il utilise les valeurs par défaut. Pour être sûr d’utiliser les bons identifiants, tu peux faire :
   ```powershell
   $env:SEED_ADMIN_EMAIL="ton@email.com"
   $env:SEED_ADMIN_PASSWORD="TonMotDePasse"
   npm run db:seed
   ```
   (Remplace par les mêmes valeurs que dans Railway.)

À partir de là, la base en ligne a les tables et un utilisateur admin.

---

## Étape 7 : Récupérer l’URL publique de l’app et mettre NEXTAUTH_URL

1. Dans Railway, clique sur le **service de ton app** (Harmony).
2. Ouvre **"Settings"** (ou l’onglet qui parle de domaine / URL).
3. Cherche **"Networking"** ou **"Public Networking"** ou **"Generate Domain"**.
4. Clique sur **"Generate Domain"** (ou équivalent). Railway te donne une URL du type :  
   `https://harmony-production-xxxx.up.railway.app`
5. **Copie** cette URL.
6. Retourne dans **Variables** du même service.
7. Modifie **`NEXTAUTH_URL`** : mets **exactement** cette URL (avec `https://`).
8. Sauvegarde. Railway peut redéployer automatiquement après changement de variable.

---

## Étape 8 : Te connecter à l’app en ligne

1. Ouvre dans ton navigateur l’**URL publique** de l’app (celle que tu as mise dans `NEXTAUTH_URL`).
2. Tu devrais être redirigé vers **/login**.
3. Connecte-toi avec :
   - **Email** : la valeur de `SEED_ADMIN_EMAIL`
   - **Mot de passe** : la valeur de `SEED_ADMIN_PASSWORD`
4. Après connexion, tu arrives sur **/admin** et tu peux utiliser Harmony comme en local.

---

## Récapitulatif

| Étape | Où | Action |
|-------|----|--------|
| 1 | Railway | New → Database → PostgreSQL |
| 2 | Service PostgreSQL | Variables → copier `DATABASE_URL` |
| 3 | Service app | Variables → ajouter `DATABASE_URL` (coller l’URL) |
| 4 | Service app | Variables → ajouter `NEXTAUTH_SECRET`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, et `NEXTAUTH_URL` (vide ou temporaire) |
| 5 | PC / terminal | `git add .` → `git commit` → `git push` |
| 6 | PC / terminal | `$env:DATABASE_URL="..."` puis `npx prisma migrate deploy` puis `npm run db:seed` |
| 7 | Railway (service app) | Generate Domain → copier l’URL → mettre à jour `NEXTAUTH_URL` |
| 8 | Navigateur | Ouvrir l’URL → /login → se connecter avec ton email et mot de passe admin |

Si une étape ne marche pas (erreur de build, de migration ou à la connexion), note le **numéro de l’étape** et le **message d’erreur** et on pourra corriger précisément.
