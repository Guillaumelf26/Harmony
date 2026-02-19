# Pistes d'amélioration UX/UI mobile (tablette, téléphone)

## Problèmes identifiés

### 1. Sidebar (volet gauche)
- **Actuel** : Toujours dans le flux, pas de fermeture au clic extérieur
- **Sur mobile** : Prend ~288px (w-72), réduit fortement l’espace pour le contenu principal

### 2. Mode édition : éditeur vs preview
- **Actuel** : Layout horizontal `[éditeur flex-1] | [preview 470px]`
- **Sur mobile** : La preview a une largeur fixe (470px) > écran. L’éditeur est compressé ou invisible, la preview occupe tout l’espace

### 3. Autres points
- Pas de breakpoints dédiés mobile
- Header avec beaucoup de boutons, peut être serré
- Formulaire édition (Titre, Artiste, Détails) déjà en `flex-col` sur mobile (md:flex-row)
- Player audio en bas : zone de touch potentiellement petite

---

## Pistes d’amélioration

### Priorité 1 : Sidebar mobile

**Objectif** : Maximiser l’espace sur téléphone, fermeture au clic extérieur.

| Action | Détail |
|--------|--------|
| Sidebar en overlay sur mobile | Sur `max-md`, sidebar en `fixed` / `absolute`, z-index élevé, slide-in depuis la gauche |
| Fermeture au clic extérieur | Backdrop semi-transparent ; clic dessus → ferme la sidebar (uniquement sur mobile) |
| État initial | Sur mobile, sidebar fermée par défaut (`sidebarOpen: false` si `window.innerWidth < 768`) |
| Détection mobile | Hook `useMediaQuery` ou `window.matchMedia('(max-width: 767px)')` |

### Priorité 2 : Mode édition sur mobile

**Objectif** : Toujours voir l’éditeur, avec accès à la preview.

| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| **A. Onglets Éditeur / Preview** | Simple, choix explicite | Un seul panneau visible à la fois |
| **B. Stack vertical** | Éditeur en haut, preview en bas, scroll | Beaucoup de scroll sur petit écran |
| **C. Preview masquée par défaut** | Éditeur prioritaire, preview sur demande | Moins de preview en direct |

**Recommandation** : **Option A (onglets)** sur `max-md` :
- Onglets "Éditeur" | "Preview" au-dessus du contenu
- Par défaut : onglet "Éditeur"
- Sur desktop : garder le layout actuel (éditeur + preview côte à côte)

### Priorité 3 : Autres ajustements

| Zone | Amélioration |
|------|--------------|
| Header | Sur mobile : réduire espacement, boutons plus compacts ou regroupés dans un menu |
| Formulaire édition | Détails du chant repliés par défaut sur mobile |
| Player audio | Zone tactile plus grande (min 44px de hauteur) |
| Modals | Déjà `max-w-sm mx-4`, vérifier padding et lisibilité sur petits écrans |
| Sélecteur de bibliothèque | Menu déroulant déjà OK, vérifier largeur sur mobile |

### Priorité 4 : Affinements

| Élément | Piste |
|---------|------|
| Touch targets | Boutons min 44×44px (recommandation Apple/Google) |
| Scroll | Éviter les scrolls imbriqués sur mobile |
| Barre de redimensionnement | Masquer sur mobile (pas de resize) |
| Preview | Sur mobile avec onglets, preview en pleine largeur |

---

## Plan d’implémentation suggéré

1. **Phase 1** : Sidebar overlay + fermeture au clic (mobile uniquement)
2. **Phase 2** : Onglets Éditeur / Preview en mode édition sur mobile
3. **Phase 3** : Ajustements header, touch targets, détails repliés par défaut

---

## Breakpoints Tailwind (rappel)

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

Pour "mobile" : `max-md` (< 768px) ou `max-sm` (< 640px) selon la cible.
