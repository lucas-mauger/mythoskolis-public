# Mythoskolis — Présentation technique (public Data)

Mythoskolis est un projet web de médiation culturelle centré sur la mythologie grecque, conçu comme un **cas pratique de modélisation et de traitement de données complexes**.

Derrière l’objet culturel, le projet sert surtout de **terrain d’expérimentation data** : structuration d’un domaine ambigu, mise en place d’un pipeline de transformation, et exploitation des données dans une interface utilisateur avancée.

---

## Problématique data

La mythologie grecque pose plusieurs défis typiques d’un problème data réel :

- absence de source canonique unique,
- données fragmentées et hétérogènes,
- relations multiples et parfois contradictoires,
- nécessité de conserver le contexte et la provenance des informations.

**Objectif** : transformer un corpus narratif flou en un **modèle de données exploitable**, sans perdre la complexité du réel.

---

## Modélisation des données

### Source de vérité

- Données généalogiques centralisées dans un fichier **YAML** unique.
- Chaque entité est définie par :
  - un identifiant stable,
  - une culture,
  - un ensemble de relations typées.

### Relations

Relations explicitement modélisées :
- parents
- enfants
- fratries
- consorts

Chaque relation peut contenir :
- un indicateur de *consensus*,
- une ou plusieurs sources (auteur, œuvre, passage).

👉 Les contradictions sont **modélisées**, pas éliminées.

---

## Pipeline de transformation (ETL)

Le projet met en place un pipeline clair :

### Extract
- Lecture du YAML généalogique (source brute).

### Transform
- normalisation des identifiants,
- déduplication des relations,
- consolidation des variantes,
- contrôles de cohérence et de couverture.

Scripts Node.js dédiés assurant la transformation.

### Load
- Export d’un graphe JSON normalisé.
- Consommation par le front (Astro).

Le pipeline est exécuté automatiquement avant le développement et le build.

---

## Qualité et cohérence des données

Plusieurs outils internes ont été conçus pour garantir la qualité :

- scripts de synchronisation entre données et contenus éditoriaux,
- contrôles de couverture des relations,
- inspecteurs YAML / Markdown avec validation locale.

Ces outils remplacent volontairement un CMS générique afin de garder un **contrôle total sur le modèle de données**.

---

## Exploitation des données

### Graphe généalogique (HoloGraph)

- Consommation directe du JSON généré par le pipeline.
- Gestion simultanée de versions multiples d’une même relation.
- Visualisation pensée comme une lecture de données, pas comme un simple graphe décoratif.

Le module est propriétaire, mais les contrats de données sont visibles dans le dépôt.

---

### Lecture contextualisée

- Les données du glossaire et des entités sont injectées dynamiquement dans les textes.
- Objectif : fournir l’information pertinente **au moment de la lecture**, sans navigation excessive.
- Paramétrage utilisateur et persistance des préférences.

---

## Stack technique

- **Langages** : TypeScript, JavaScript, YAML, Markdown
- **Pipeline** : Node.js (scripts ETL)
- **Front** : Astro (site statique)
- **Styles** : Tailwind CSS
- **Déploiement** : Cloudflare Pages

---

## Pourquoi ce projet est pertinent pour un profil data

Mythoskolis démontre :
- la capacité à **formaliser un problème ambigu**,
- la conception d’un **modèle de données robuste**,
- la mise en place d’un **pipeline de transformation clair**,
- l’attention portée à la **qualité et à la cohérence des données**,
- la capacité à exploiter ces données dans un produit concret.

---

## Lancer le projet en local

```bash
npm install
npm run dev
```

---

## Statut

Le dépôt correspond à une V1++ publique et fonctionnelle.
Le projet est itératif et sert de base à des extensions futures (multi-cultures, enrichissement des sources, nouveaux modules).

---

## Licence

Projet personnel.  
Certains modules sont volontairement exclus du dépôt public.
