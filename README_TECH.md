# Mythoskolis

Mythoskolis est un site de médiation culturelle consacré à la mythologie grecque.  
Son objectif est de rendre **compréhensible, navigable et explorable** un corpus mythologique complexe, en particulier sa dimension généalogique, tout en conservant la pluralité des sources et des traditions.

Le projet repose sur une idée centrale :  
> transformer un matériau narratif contradictoire et fragmentaire en **données structurées**, puis en **outils de lecture et d’exploration accessibles**.

---

## Objectifs du projet

- Rendre la généalogie mythologique lisible pour un public non spécialiste.
- Assumer et exposer les variantes, contradictions et traditions concurrentes.
- Proposer une navigation fluide entre données généalogiques et contenus éditoriaux.
- Construire une architecture robuste, maintenable et extensible.

Le dépôt public a également une vocation démonstrative : il expose les choix de modélisation, de pipeline de données et d’architecture front, même si certains modules clés sont volontairement absents.

---

## Vue d’ensemble technique

- **Type de projet** : site statique à contenu riche
- **Framework** : Astro
- **Langages** : TypeScript, JavaScript, Markdown, YAML
- **Styles** : Tailwind CSS v4 (design system maison basé sur classes `mk-*`)
- **Déploiement** : Cloudflare Pages (build Astro)
- **Source de vérité des données** : YAML

---

## Architecture générale

Le projet est structuré autour d’une séparation claire entre :

- **Données** (YAML)
- **Contenus éditoriaux** (Markdown)
- **Pipeline de transformation** (scripts Node.js)
- **Rendu front** (Astro)

Structure (simplifiée) :

```
data/
  genealogie_new_structure.yaml
  glossaire.yaml

src/
  content/
    entites/
    recits/
    ressources/
    pages/
    data/
  components/
  lib/
  pages/
  styles/
  utils/

scripts/
  generate-genealogie-json-new.mjs
  sync-frontmatter.mjs
  check-genealogie-coverage.mjs

tools/
  yaml-server-new.mjs
  yaml-inspector-new.html
  md-inspector.html

public/
  data/
  images/
  videos/
  faces/
```

---

## Stack et conventions

### Astro

- Pages dans `src/pages`
- Routes dynamiques via `getStaticPaths`
- Composants Astro dans `src/components`

### Tailwind CSS

- Tailwind CSS v4
- Styles globaux dans `src/styles`
- Design system maison via classes utilitaires `mk-*`

### Content collections (contenu Markdown)

- Déclaration des collections dans `src/content.config.ts`
- Contenu en Markdown + frontmatter YAML dans `src/content/*`

---

## Modélisation des données généalogiques

La généalogie repose sur un fichier YAML unique servant de **source de vérité** :

```
data/genealogie_new_structure.yaml
```

Chaque entité possède :
- un `id` stable,
- un `slug`,
- une `culture`,
- des relations structurées :
  - `parents`
  - `children`
  - `siblings`
  - `consorts`

Chaque relation peut être enrichie par :
- un indicateur de **consensus**,
- une ou plusieurs **sources** (auteur, œuvre, passage).

Ce modèle permet :
- d’exprimer des filiations concurrentes,
- de conserver les contradictions sans les écraser,
- de rendre ces variantes exploitables côté front.

La normalisation et la déduplication des relations sont gérées dans :
- `src/lib/genealogie.ts`
- `src/lib/genealogie-shared.ts`

---

## Pipeline de données (ETL)

Le projet met en place un pipeline explicite : **YAML → JSON → front**.

### Script principal

```
scripts/generate-genealogie-json-new.mjs
```

Fonctions principales :
- chargement du YAML,
- normalisation des identifiants,
- déduplication des relations,
- consolidation du champ `consensus`,
- export vers JSON.

### Sortie

Le JSON généré est écrit dans :

```
public/data/genealogie.json
```

### Exécution automatique

Le script est exécuté automatiquement via `package.json` :
- avant le serveur de dev (`predev`)
- avant le build (`prebuild`)

### Scripts complémentaires

- `scripts/sync-frontmatter.mjs` : synchronise `id`/`culture` depuis le YAML vers les fiches Markdown.
- `scripts/check-genealogie-coverage.mjs` : script optionnel de QA (vérifie la couverture/cohérence des relations).

---

## HoloGraph (module propriétaire)

Le cœur du projet est un graphe généalogique interactif appelé **HoloGraph**.  
Le module existe en production, mais son code est **volontairement absent du dépôt public**.

Le dépôt contient des points d’intégration / placeholders :

- `src/components/HoloGraphPlaceholder.astro`
- `src/pages/holograph.astro`
- `src/pages/genealogie/[slug].astro`
- Sections “Généalogie détaillée” dans les pages d’entités

Le graphe repose exclusivement sur les données issues du pipeline généalogique YAML.

---

## Contenus éditoriaux

Les contenus sont organisés en **content collections Astro** :

- **Entités** : `src/content/entites`
- **Récits** : `src/content/recits`
- **Ressources** : `src/content/ressources`
- **Pages** : `src/content/pages`
- **Data éditoriale** : `src/content/data`

### Gestion des brouillons

Un filtre `published` est géré dans :

- `src/utils/content-filters.ts`

Une variable permet d’inclure les contenus non publiés :

- `MK_INCLUDE_UNPUBLISHED`

---

## Outils internes d’édition et maintenance

L’utilisation d’un CMS générique a été abandonnée au profit d’outils sur mesure (édition + validation).

### Inspecteur YAML / Markdown

- Serveur local : `tools/yaml-server-new.mjs`
- UI : `tools/yaml-inspector-new.html` et `tools/md-inspector.html`
- Commande npm : `npm run yaml:tool`

Objectifs :
- édition rapide,
- validation de cohérence,
- réduction des erreurs structurelles,
- travail direct sur la source de vérité (YAML/Markdown).

---

## UX et modules complémentaires

### Lecture contextualisée (anti-wikipédia)

Système de lecture contextuelle permettant d’afficher des définitions et informations clés **sans quitter la page**.

- Script : `src/components/ContextualLayerScript.astro`
- Données : `data/glossaire.yaml` + fiches entités (Markdown)

Fonctionnalités :
- surlignage et tooltips,
- filtres entités / glossaire,
- densité configurable (première occurrence vs toutes),
- position mobile configurable,
- mémorisation via `localStorage`.

### Recherche client-side

- Entités : `src/pages/entites/index.astro` (filtre accent-insensible)
- Récits : `src/pages/recits/index.astro` (filtre par thématiques)

### Thème clair / sombre

- Gestion persistante via `localStorage`
- Implémentation côté header : `src/components/Header.astro`

---

## Media pipeline

- Assets : `public/faces`, `public/images`, `public/videos`
- Logique de fallback sur les pages entités :
  - vidéo > image > placeholder (fallback selon genre)
- Normalisation culture/id pour retrouver les assets de façon stable.

---

## Lancer le projet en local

```bash
npm install
npm run dev
```

---

## Build

```bash
npm run build
npm run preview
```

---

## Déploiement

Déploiement cible : **Cloudflare Pages** (build Astro).

---

## Statut du projet

Le projet est vivant et itératif.  
Le dépôt public correspond à une **V1 fonctionnelle**, suffisante pour exposer :

- la modélisation des données,
- le pipeline ETL,
- l’architecture Astro/Tailwind,
- les outils internes (inspecteurs),
- et les modules UX (lecture contextualisée, navigation, recherche).

---

## Licence

Projet personnel.  
Certains modules (notamment **HoloGraph**) sont propriétaires et volontairement exclus du dépôt.
