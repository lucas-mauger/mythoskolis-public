# 🏛️ Mythoskolis — Site de médiation autour des mythologies

Mythoskolis est un site web moderne dédié à la découverte des mythologies à travers des fiches synthétiques, des illustrations originales et (à terme) un système dynamique de filiations entre divinités.

Le projet a pour objectifs :
- de proposer un accès **simple, clair et gratuit** à des contenus culturels de qualité ;
- de rendre les mythes **visuels, vivants et accessibles** ;
- d’offrir aux enseignants, élèves et curieux un outil propre et sans distraction ;
- d’expérimenter une **modélisation de données** (généalogies, relations, sources) intégrée à une interface Web moderne.

Le site est construit avec **Astro**, **TailwindCSS**, une structuration des contenus en **Markdown + frontmatter**, et des outils maison pour piloter les données (inspecteurs YAML/MD).

---

## 🚀 1. Prérequis

Avant de lancer le projet, assurez-vous d’avoir :

- **Node.js ≥ 20**  
  (Recommandé : installation via NVM)

```bash
node -v
npm -v
```

- **npm** installé (fourni avec Node).

---

## 📦 2. Installation

Clonez le dépôt :

```bash
git clone <URL_DU_REPO>
cd mythoskolis
```

Installez les dépendances :

```bash
npm install
```

---

## 🧪 3. Lancement du projet (développement)

Pour démarrer le serveur local :

```bash
npm run dev
```

Le site sera accessible à l’adresse indiquée dans le terminal (généralement `http://localhost:4321`).

---

## 🛠️ 4. Scripts disponibles

```bash
npm run dev       # Lance le serveur de développement
npm run build     # Génère le site statique dans /dist
npm run preview   # Prévisualise le build
npm run format    # Formate le code avec Prettier
npm run lint      # Analyse le code avec ESLint
```

---

## 🧰 5bis. Inspecteurs locaux (maintenance sans Decap)

- `npm run yaml:tool:new` ouvre l’inspecteur YAML (nouvelle structure) pour créer/éditer entités et relations, avec gestion bilatérale des liens et validation consensus.
- `npm run md:tool` ouvre l’inspecteur Markdown pour lister/filtrer/éditer les fiches (`frontmatter` + contenu brut).

> V1 se maintient directement dans les fichiers YAML/MD ; l’ancien Decap n’est plus utilisé.

---

## 🧱 5. Structure du projet

```
mythoskolis/
│
├── public/                 # Fichiers statiques (images, vidéos, assets)
│
├── data/
│   └── genealogie.yaml     # Source unique des relations familiales (nouveau format)
│
├── src/
│   ├── components/         # Composants Astro réutilisables (EgoGraph, Header, …)
│   ├── content/            # Fiches (dieux, ressources...) en Markdown (frontmatter + corps)
│   ├── lib/                # Utilitaires (lecture du YAML généalogique)
│   ├── pages/              # Pages Astro => routes du site
│   └── styles/             # Styles globaux (Tailwind)
│
├── tools/
│   ├── yaml-inspector-new.html  # Inspecteur/générateur relations YAML (nouveau format)
│   └── md-inspector.html        # Inspecteur/éditeur de frontmatters + corps Markdown
│
├── .astro/                 # Types générés automatiquement par Astro
├── astro.config.mjs        # Configuration Astro
├── tailwind.config.mjs     # Configuration Tailwind CSS
├── package.json            # Dépendances et scripts
└── README.md               # Ce fichier
```

---

## 🖼️ 6. Médias & données

- **Vidéos** : placées dans `public/videos/` et référencées via `video: "/videos/xxx.mp4"` dans les frontmatter des fiches.
- **Images** : `public/images/` pour les visuels génériques, `public/faces/slug.webp` pour les portraits utilisés dans l’ego-graph.
- **Généalogie** : éditer uniquement `data/genealogie.yaml`. Le JSON consommé par le composant interactif est régénéré automatiquement via `node scripts/generate-genealogie-json.mjs` (hooké sur `predev` / `prebuild`).

---

## 🪢 7. Branching model

Le projet suit une organisation simple :

- `main` = branche stable et protégée  
  (pas de commit direct → PR obligatoire)
- `feature/*` = une branche par brique / fonctionnalité
- Merge via Pull Request uniquement

---

## 📌 8. État actuel du projet

- Base Astro + Tailwind opérationnelle (pages d’accueil, dieux, ressources, à propos).
- Données généalogiques centralisées dans `data/genealogie.yaml` (nouveau format), lues via `src/lib/genealogie.ts` puis exportées en JSON statique pour l’ego-graph.
- Inspecteurs custom (YAML + MD) pour maintenir relations et fiches sans CMS externe.
- Ego-graph interactif `/genealogie/[slug]` : colonnes Parents / Fratrie / Consorts / Enfants (desktop + mobile), portraits tirés de `public/faces/`.
- Workflow Git : travail sur branches `feature/*` + PR vers `main`.

## 🧭 Parcours du site

- **Accueil** : introduction, mise en avant aléatoire de fiches et accès rapide à la généalogie interactive.
- **Entités** (`/entites/`) : liste filtrable (nom/slug/nature) + fiches détaillées (`/entites/<id>/`) avec portrait, résumé, domaines/symboles, vidéo/image et encart “Généalogie détaillée”.
- **Généalogie** (`/genealogie/<id>/`) : graphe interactif parents/fratrie/consorts/enfants, avec navigation entre entités et liens vers les fiches.
- **Ressources** (`/ressources/`) : contenu éditorial/notes annexes (à compléter).
- **À propos** : contexte du projet.

---

## ✨ 9. Licence

Projet personnel — licence à définir selon les besoins futurs.
