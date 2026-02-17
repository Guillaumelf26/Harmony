# Déployer Harmony en ligne (guide simple)

Ce guide te propose **une seule plateforme** pour l’app et la base de données, avec le moins d’étapes possible.

---

## Option recommandée : Railway

[Railway](https://railway.app) permet de déployer ton app Next.js **et** une base PostgreSQL dans le même projet, avec un tableau de bord clair.

### 1. Créer un compte
- Va sur [railway.app](https://railway.app) et crée un compte (gratuit avec une carte, ou essai sans carte selon l’offre).

### 2. Nouveau projet depuis GitHub
- Sur Railway : **New Project**.
- Choisis **Deploy from GitHub repo**.
- Connecte ton compte GitHub et sélectionne le dépôt **Harmony** (il faut que ton code soit poussé sur GitHub).
- Railway crée un “service” pour ton app.

### 3. Ajouter la base PostgreSQL
- Dans le même projet Railway : **New** → **Database** → **PostgreSQL**.
- Railway crée une base et te donne une variable `DATABASE_URL`.
- Elle est souvent déjà liée au projet ; sinon, copie `DATABASE_URL` depuis l’onglet **Variables** de la base.

### 4. Variables d’environnement de l’app
- Clique sur ton **service** (l’app Next.js), puis **Variables**.
- Ajoute (ou vérifie) :

| Nom | Valeur |
|-----|--------|
| `DATABASE_URL` | Colle la valeur fournie par Railway pour PostgreSQL (elle commence par `postgresql://...`) |
| `NEXTAUTH_URL` | L’URL de ton app (ex. `https://ton-projet.up.railway.app`). Tu peux la laisser vide au premier déploiement, puis la remplir dès que Railway t’affiche l’URL du site. |
| `NEXTAUTH_SECRET` | Une chaîne aléatoire (voir ci‑dessous) |
| `SEED_ADMIN_EMAIL` | Ton email admin (ex. ton adresse) |
| `SEED_ADMIN_PASSWORD` | Un mot de passe sûr pour te connecter |

**Générer `NEXTAUTH_SECRET`** : sur [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32), génère une clé et colle-la dans `NEXTAUTH_SECRET`.

### 5. Adapter le projet pour PostgreSQL
- En local, ouvre `prisma/schema.prisma`.
- Remplace **une seule ligne** (celle du `provider`) :
  - **Avant** : `provider = "sqlite"`
  - **Après** : `provider = "postgresql"`
- Enregistre le fichier, puis dans un terminal à la racine du projet :
  ```bash
  npx prisma migrate dev --name postgres
  ```
- Pousse le code sur GitHub (Railway redéploiera automatiquement).

### 6. Lancer les migrations et le seed en production
- Sur Railway, ouvre ton service app → onglet **Settings** ou **Deploy**.
- Tu peux ajouter une “commande de démarrage” qui fait migrate + start, ou lancer à la main une fois.

**Option manuelle (une fois)** :  
- Dans le projet Railway, ouvre le **PostgreSQL** → onglet **Connect** ou **Variables** pour récupérer `DATABASE_URL`.
- En local, dans un terminal, définis `DATABASE_URL` avec cette valeur (copier-coller), puis lance :
  - `npx prisma migrate deploy`
  - `npm run db:seed`
- Comme ça la base en ligne a les tables et un compte admin.

### 7. Récupérer l’URL publique
- Dans Railway, sur ton service app : **Settings** → **Networking** → **Generate Domain** (ou équivalent).
- Tu obtiens une URL du type `https://harmony-production-xxxx.up.railway.app`.
- Mets à jour la variable **`NEXTAUTH_URL`** avec cette URL exacte, puis redéploie si besoin.

### 8. Te connecter
- Ouvre `NEXTAUTH_URL` dans le navigateur.
- Tu es redirigé vers `/login`. Connecte-toi avec `SEED_ADMIN_EMAIL` et `SEED_ADMIN_PASSWORD`.

---

## En résumé
1. Compte Railway + projet depuis GitHub.
2. Ajouter une base PostgreSQL dans le même projet.
3. Renseigner les variables (surtout `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, et optionnellement `SEED_ADMIN_*`).
4. Passer Prisma en `postgresql`, créer la migration, pousser le code.
5. Lancer `prisma migrate deploy` et `db:seed` une fois en prod.
6. Mettre `NEXTAUTH_URL` sur l’URL Railway et te connecter.

Si tu veux, on peut détailler une étape précise (par ex. “étape 5” ou “étape 6”) avec des captures ou les lignes exactes à modifier dans ton repo.
