# Mythoskolis — Présentation Data (avec schémas)

Mythoskolis est un projet web de médiation culturelle centré sur la mythologie grecque, conçu comme un **cas pratique de modélisation et de traitement de données complexes**.

Derrière l’objet culturel, le projet sert surtout de **terrain d’expérimentation data** : structuration d’un domaine ambigu, mise en place d’un pipeline de transformation, et exploitation des données dans une interface utilisateur.

---

## Problématique data

La mythologie grecque pose plusieurs défis typiques d’un problème data réel :

- absence de source canonique unique,
- données fragmentées et hétérogènes,
- relations multiples et parfois contradictoires,
- nécessité de conserver le contexte et la provenance des informations.

Objectif : transformer un corpus narratif flou en un **modèle de données exploitable**, sans perdre la complexité du réel.

---

## Modèle de données (vue conceptuelle)

### Entité : `Entity`

Chaque entité (dieu, titan, nymphe, concept, créature, etc.) est identifiée de manière stable.

Champs clés (conceptuellement) :
- `id` (stable)
- `slug` (pour routing / URLs)
- `culture` (prépare le multi-panthéons)
- (optionnel) attributs éditoriaux : nature, genre, domaines, etc. (côté Markdown)

### Relation : `Relation`

Les liens entre entités sont typés et portent leur propre contexte.

- types principaux : `parents`, `children`, `siblings`, `consorts`
- enrichissements possibles :
  - `consensus` (dominant vs variante)
  - `sources[]` (author, work, passage)

> Point important : la contradiction est un **cas normal**, géré via `consensus` + `sources`, pas un “bug de données”.

---

## Schéma ERD (conceptuel)

Ce schéma illustre la structure logique (indépendamment du format YAML).

```
+------------------+                 +---------------------------+
|      Entity      |                 |          Relation         |
+------------------+                 +---------------------------+
| id (PK)          | 1           *   | from_entity_id (FK)       |
| slug             |---------------->| to_entity_id (FK)         |
| culture          |                 | type (parent/child/...)   |
| ...              |                 | consensus (bool/enum)     |
+------------------+                 | sources (array)           |
                                     +---------------------------+

Notes :
- Une relation relie deux entités (from -> to) et est typée.
- La “direction” dépend du type : parent -> child, etc.
- Le champ sources est un tableau d’objets de référence.
```

---

## Source de vérité (YAML) et “couches”

Les données sont organisées en couches :

```
Layer 1 — Source de vérité (YAML)
  data/genealogie_new_structure.yaml
  data/glossaire.yaml

Layer 2 — Transformations (ETL scripts Node.js)
  scripts/generate-genealogie-json-new.mjs
  scripts/sync-frontmatter.mjs
  scripts/check-genealogie-coverage.mjs

Layer 3 — Artefacts générés
  public/data/genealogie.json

Layer 4 — Consommation (Front Astro)
  src/pages/... + src/lib/... + components UX
```

---

## Pipeline ETL (YAML → JSON → Front)

### Schéma du pipeline

```
           ┌────────────────────────────────────┐
           │ data/genealogie_new_structure.yaml │
           └────────────────────────────────────┘
                          │
                          │ Extract
                          ▼
           ┌────────────────────────────────────┐
           │ generate-genealogie-json-new.mjs    │
           │ - normalize ids                     │
           │ - dedupe relations                  │
           │ - consolidate consensus             │
           │ - shape graph store                 │
           └────────────────────────────────────┘
                          │
                          │ Load
                          ▼
           ┌────────────────────────────────────┐
           │ public/data/genealogie.json         │
           └────────────────────────────────────┘
                          │
                          │ Consume
                          ▼
           ┌────────────────────────────────────┐
           │ Front Astro (pages/components)      │
           │ + libs (genealogie.ts, shared)      │
           └────────────────────────────────────┘
```

### Exécution automatique

Le pipeline s’exécute avant :
- `npm run dev` (via `predev`)
- `npm run build` (via `prebuild`)

---

## Exemple de structures (pseudo-données)

### YAML (idée générale)

```yaml
entities:
  - id: grecque-zeus
    slug: zeus
    culture: grecque
    relations:
      parents:
        - id: grecque-cronos
          consensus: true
          sources:
            - author: Hésiode
              work: Théogonie
              passage: "v.xxx–yyy"
      consorts:
        - id: grecque-hera
          consensus: true
```

### JSON généré (idée générale)

```json
{
  "entities": {
    "grecque-zeus": {
      "id": "grecque-zeus",
      "slug": "zeus",
      "culture": "grecque",
      "relations": {
        "parents": [
          {
            "id": "grecque-cronos",
            "consensus": true,
            "sources": [{ "author": "Hésiode", "work": "Théogonie", "passage": "v.xxx–yyy" }]
          }
        ]
      }
    }
  }
}
```

---

## Qualité des données (QA) : principes et contrôles

### Quels risques “data” ce projet gère ?

- divergence entre IDs (YAML vs frontmatter Markdown),
- relations orphelines (référence à une entité inexistante),
- doublons (relations répétées),
- incohérences directionnelles (ex : parentage non réciproque si exigé),
- couverture éditoriale incomplète (entités sans fiche, etc.).

### Comment c’est contrôlé ?

- `sync-frontmatter.mjs` : aligne `id` / `culture` dans les fiches Markdown depuis le YAML.
- `check-genealogie-coverage.mjs` : script de contrôle (coverage/cohérence).
- Inspecteurs YAML/MD : validation locale, itération rapide, réduction des erreurs.

---

## Exploitation des données : produit et UX

### Graphe généalogique (HoloGraph)

Le graphe consomme le JSON produit par le pipeline.

- Les variantes (consensus vs non-consensus) sont gérées comme des **données de premier ordre**.
- La visualisation n’écrase pas la complexité : elle l’expose de façon guidée.

> Le module HoloGraph est propriétaire et exclu du dépôt public ; les contrats de données et points d’intégration restent visibles.

### Lecture contextualisée (“anti-Wikipédia”)

- Les textes (Markdown) sont enrichis à la volée par un “layer” qui s’appuie sur :
  - un glossaire YAML,
  - les fiches d’entités.
- Le but : donner le contexte sans renvoyer le lecteur dans une navigation sans fin.

---

## Transposition “monde entreprise” (lecture data)

Même si Mythoskolis n’est pas un projet BI classique, la logique est transposable :

- **Source-of-truth** (YAML) ≈ référentiel / MDM
- **ETL scripts** ≈ jobs de transformation (dbt / Airflow-like, version light)
- **Artefact JSON** ≈ datamart / serving layer
- **Front UX** ≈ consommation applicative (API/read model)

---

## Stack technique

- Langages : TypeScript, JavaScript, YAML, Markdown
- Pipeline : Node.js (scripts ETL)
- Front : Astro (site statique)
- Styles : Tailwind CSS
- Déploiement : Cloudflare Pages

---

## Lancer le projet en local

```bash
npm install
npm run dev
```

---

## Licence

Projet personnel.  
Certains modules sont volontairement exclus du dépôt public.
