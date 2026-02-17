# Suite après avoir connecté le repo à Railway

Le schéma Prisma est passé en **PostgreSQL** et une migration dédiée a été ajoutée. Voici quoi faire sur Railway et dans le projet.

---

## 1. Ajouter une base PostgreSQL sur Railway

- Dans ton projet Railway : **New** → **Database** → **PostgreSQL**.
- Une fois créée, ouvre la base → onglet **Variables** (ou **Connect**) et récupère **`DATABASE_URL`** (elle commence par `postgresql://...`).

---

## 2. Variables d’environnement du service “Harmony”

- Clique sur ton **service** (l’app Next.js), puis **Variables**.
- Ajoute ou vérifie :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | Colle la valeur fournie par Railway pour la base PostgreSQL (souvent proposée automatiquement si la base est dans le même projet). |
| `NEXTAUTH_SECRET` | Une chaîne aléatoire (ex. [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)). |
| `NEXTAUTH_URL` | L’URL publique de ton app (ex. `https://harmony-production-xxxx.up.railway.app`). Tu peux la remplir après le 1er déploiement, quand Railway t’affiche l’URL. |
| `SEED_ADMIN_EMAIL` | Ton email pour te connecter en admin. |
| `SEED_ADMIN_PASSWORD` | Un mot de passe sûr pour ce compte admin. |

---

## 3. Lancer les migrations et le seed (une fois)

Railway ne lance pas Prisma tout seul. Il faut appliquer les migrations et créer l’admin **une fois** :

**Option A – Depuis ton PC (le plus simple)**  
- Dans Railway, ouvre la base PostgreSQL et copie **`DATABASE_URL`**.
- En local, dans un terminal à la racine du projet, définis cette variable puis lance :

```bash
$env:DATABASE_URL="postgresql://..."   # colle l’URL complète
npx prisma migrate deploy
npm run db:seed
```

( Sous PowerShell tu peux faire `$env:DATABASE_URL="..."` ; sous CMD : `set DATABASE_URL=...` )

**Option B – Depuis Railway (script de build)**  
Tu peux faire exécuter les migrations au déploiement en configurant une **commande de build** qui fait aussi `prisma generate` et une **commande de démarrage** qui fait `prisma migrate deploy && npm start`. Le seed reste à lancer une fois à la main (Option A) ou via un script.

---

## 4. Récupérer l’URL publique et mettre à jour NEXTAUTH_URL

- Sur ton service Harmony : **Settings** → **Networking** (ou **Generate Domain**).
- Copie l’URL (ex. `https://harmony-xxx.up.railway.app`).
- Dans **Variables**, mets à jour **`NEXTAUTH_URL`** avec cette URL exacte.
- Redéploie si besoin (ou laisse Railway redéployer).

---

## 5. Pousser les changements (PostgreSQL + migration) sur GitHub

En local, les changements pour PostgreSQL sont déjà faits. Il reste à les committer et à pousser pour que Railway redéploie avec la bonne config :

```bash
git add .
git commit -m "PostgreSQL pour Railway + migration init"
git push
```

---

## 6. Te connecter

- Ouvre l’URL de ton app (celle dans `NEXTAUTH_URL`).
- Tu devrais être redirigé vers `/login`.
- Connecte-toi avec `SEED_ADMIN_EMAIL` et `SEED_ADMIN_PASSWORD`.

Si quelque chose ne marche pas (erreur au build, à la migration ou à la connexion), décris l’erreur ou envoie un message et on corrige étape par étape.
