# Mettre Harmony sur GitHub et utiliser Cursor

## 1. Vérifier si le projet est sur GitHub

- **Sans dépôt Git** : le projet n’est pas encore versionné. Il faut l’initialiser puis le pousser sur GitHub (voir plus bas).
- **Avec dépôt Git** : ouvre un terminal à la racine du projet et tape :
  ```bash
  git remote -v
  ```
  Si tu vois une ligne avec `origin` et une URL du type `https://github.com/TonCompte/Harmony.git`, le projet est bien relié à GitHub.

---

## 2. Cursor et GitHub

**Cursor ne se “synchronise” pas tout seul avec GitHub.** C’est Git qui fait le lien :

- Tu **commites** (tu enregistres des versions) dans ton dépôt local.
- Tu **pousses** (`push`) vers GitHub pour que le code soit en ligne.

Dans Cursor tu peux faire tout ça :

- **Source Control** (icône de branche à gauche, ou `Ctrl+Shift+G`) : voir les fichiers modifiés, les ajouter, faire un commit.
- **Terminal** (`` Ctrl+` ``) : taper les commandes `git add`, `git commit`, `git push`, etc.

Donc : Cursor = éditer + utiliser Git (commits, push). GitHub = héberger le dépôt. Ils travaillent ensemble via Git.

---

## 3. Mettre Harmony sur GitHub (étape par étape)

### A. Créer un dépôt sur GitHub

1. Va sur [github.com](https://github.com) et connecte-toi.
2. Clique sur **"New"** (ou **"+"** → **"New repository"**).
3. Donne un nom au dépôt, par exemple **`Harmony`**.
4. Choisis **Private** si tu ne veux pas que le code soit public.
5. **Ne coche pas** "Add a README" (ton projet en a déjà un).
6. Clique sur **"Create repository"**.
7. GitHub affiche une URL du type : `https://github.com/TonCompte/Harmony.git`. Garde-la sous la main.

### B. Initialiser Git dans ton projet et pousser vers GitHub

Ouvre le **terminal dans Cursor** (`` Ctrl+` ``) à la racine du projet Harmony, puis exécute les commandes **une par une** :

```bash
git init
git add .
git commit -m "Initial commit - Harmony Admin Songbook"
git branch -M main
git remote add origin https://github.com/TON-COMPTE/Harmony.git
git push -u origin main
```

**Important** : remplace `TON-COMPTE` par ton vrai nom d’utilisateur GitHub, et `Harmony` par le nom du dépôt si tu as choisi autre chose.

- Si GitHub te demande de te connecter : utilise ton identifiant GitHub et un **Personal Access Token** (mot de passe) au lieu de ton mot de passe compte. Tu peux en créer un dans : GitHub → Settings → Developer settings → Personal access tokens.

Après le `git push`, ton projet Harmony est sur GitHub.

### C. Ensuite, au quotidien

- Tu modifies le code dans Cursor.
- Tu vas dans **Source Control** (Ctrl+Shift+G), tu ajoutes les fichiers, tu écris un message de commit et tu cliques sur **Commit**.
- Dans le terminal : `git push` pour envoyer les changements sur GitHub.

Tu peux aussi tout faire en ligne de commande : `git add .`, `git commit -m "ton message"`, `git push`.

---

## 4. Résumé

| Question | Réponse |
|----------|---------|
| Comment vérifier si Harmony est sur GitHub ? | Terminal : `git remote -v`. Si tu vois une URL `github.com/...`, c’est relié. Sinon, pas encore. |
| Cursor peut-il être synchronisé avec GitHub directement ? | Non. Tu utilises Git (depuis Cursor : Source Control + terminal) pour **commit** et **push** vers GitHub. |
| Où est le code ? | En local sur ton PC dans le dossier Harmony ; sur GitHub après un `git push`. |

Si tu veux, on peut faire ensemble la partie “Initialiser Git et premier push” (en adaptant les commandes à ton compte GitHub).
