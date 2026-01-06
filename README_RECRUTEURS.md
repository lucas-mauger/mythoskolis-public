# Mythoskolis — Présentation technique (version recruteurs)

Mythoskolis est un projet web **data-driven** de médiation culturelle consacré à la mythologie grecque.  
Son objectif principal est de rendre **compréhensibles, navigables et explorables** des généalogies mythologiques complexes, tout en conservant les variantes, contradictions et traditions concurrentes.

Ce dépôt est conçu comme une **vitrine technique** : il met l’accent sur la modélisation des données, la conception de pipelines et le raisonnement UX, bien au-delà de la simple production de contenu.

---

## Quel problème ce projet adresse-t-il ?

La mythologie grecque est :
- fragmentée entre des sources hétérogènes,
- intrinsèquement contradictoire,
- difficile à représenter visuellement sans simplification abusive.

**Problème central** :  
Comment représenter une généalogie non canonique, multi-versions, de manière :
- structurellement solide,
- explorable par des non-spécialistes,
- techniquement maintenable.

---

## Apports techniques clés

### 1. Modélisation de données d’un domaine complexe

- **Source de vérité unique** : données structurées en YAML.
- Modélisation explicite des relations :
  - parents, enfants, fratries, consorts.
- Chaque relation peut porter :
  - un indicateur de *consensus*,
  - une ou plusieurs sources textuelles (auteur, œuvre, passage).
- Les données contradictoires sont conservées et exposées, non écrasées.

👉 Démontre une capacité d’analyse, de modélisation et de structuration de données complexes.

---

### 2. Pipeline ETL sur mesure (YAML → JSON → Front)

- Scripts Node.js transformant le YAML brut en graphe JSON normalisé.
- Étapes du pipeline :
  - normalisation des identifiants,
  - déduplication des relations,
  - consolidation du consensus,
  - contrôles de cohérence et de couverture.
- Pipeline exécuté automatiquement avant le dev et le build.

👉 Démontre une logique de type *analytics / data engineering* appliquée à un produit front.

---

### 3. Outils internes plutôt que CMS générique

- Abandon volontaire de Decap / Netlify CMS.
- Conception d’outils internes dédiés :
  - inspecteur YAML,
  - inspecteur Markdown,
  - serveur local de validation.

Objectifs :
- itération rapide,
- forte cohérence des données,
- contrôle total du modèle.

👉 Démontre une capacité à faire des arbitrages pragmatiques et à concevoir des outils adaptés au besoin réel.

---

### 4. Systèmes UX construits sur des données structurées

#### HoloGraph (module propriétaire)

- Graphe généalogique interactif consommant le JSON produit par le pipeline.
- Gestion simultanée :
  - de filiations multiples,
  - de traditions contradictoires dans une même vue.
- Module existant en production mais **volontairement exclu du dépôt public**.
- Les contrats de données et points d’intégration sont visibles.

👉 Démontre la séparation claire entre données, logique et visualisation.

#### Lecture contextualisée (“anti-Wikipédia”)

- Affichage d’informations contextuelles directement dans le texte.
- Évite la navigation en cascade entre pages.
- Fort niveau de paramétrage utilisateur :
  - densité d’information,
  - filtres,
  - position mobile,
  - préférences persistantes.

👉 Démontre une approche UX pilotée par la structure des données.

---

## Stack technique

- **Framework** : Astro (génération statique)
- **Langages** : TypeScript, JavaScript, Markdown, YAML
- **Styles** : Tailwind CSS (design system maison)
- **Pipeline de données** : scripts Node.js
- **Déploiement** : Cloudflare Pages

---

## Structure du projet (simplifiée)

```
data/
  genealogie_new_structure.yaml
  glossaire.yaml

scripts/
  generate-genealogie-json-new.mjs
  sync-frontmatter.mjs
  check-genealogie-coverage.mjs

src/
  content/
  components/
  lib/
  pages/
  utils/

tools/
  yaml-server-new.mjs
  yaml-inspector-new.html
  md-inspector.html
```

---

## Ce que démontre ce projet

- Capacité à **formaliser un problème complexe et ambigu**.
- Solides compétences en **modélisation et transformation de données**.
- Raisonnement de bout en bout : données → pipeline → UX.
- Conception d’outils internes lorsque les solutions existantes ne sont pas adaptées.
- Livraison rapide d’une V1 cohérente et exploitable.

---

## Lancer le projet en local

```bash
npm install
npm run dev
```

---

## À noter

- Ce dépôt correspond à une **V1++ publique**.
- Certains modules (notamment **HoloGraph**) sont propriétaires et exclus par choix.
- L’objectif du dépôt est de mettre en avant l’**architecture, le flux de données et le raisonnement**, plus que le vernis visuel.

---

## Licence

Projet personnel.  
Certains composants sont volontairement exclus de la distribution publique.
