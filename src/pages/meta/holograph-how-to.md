---
title: "Comment utiliser l’HoloGraph Mythoskolis"
description: "Guide complet pour comprendre la logique de navigation et d’interaction de l’HoloGraph généalogique."
layout: ../../layouts/MetaLayout.astro
---

L’HoloGraph est un graphe généalogique interactif conçu pour représenter clairement les relations familiales de la mythologie grecque.  
Il repose sur une approche **ego centrée** : à chaque instant, une entité est placée au centre, et ses liens directs sont représentés autour d’elle.

L’objectif n’est pas d’afficher une généalogie complète d’un seul bloc, mais de **rendre lisible une portion locale** de l’arbre à un instant donné, avec la possibilité de naviguer de proche en proche.

---

## Objectifs de conception

### Lisibilité avant exhaustivité
La généalogie grecque est trop dense pour être affichée intégralement de manière lisible.  
L’HoloGraph privilégie donc :

- les liens directs d’une entité (parents, enfants, fratries réelles)  
- les relations qui apportent une information structurante  
- la clarté visuelle plutôt que la densité d’informations  

L’exhaustivité existe dans le fichier de données, mais **n’est jamais affichée d’un seul coup**.

### Navigation progressive
Plutôt que de montrer l’ensemble de la généalogie, l’HoloGraph encourage une **exploration progressive** :  
on passe d’une entité à une autre en cliquant sur les nœuds visibles.

Chaque vue est donc un **instantané local** de la généalogie globale.

---

## Structure générale du graphe

L’HoloGraph repose sur une représentation en quatre cadrans autour de l’entité focale.  
Cette organisation favorise une lecture immédiate des rôles relationnels.

### 1. Centre : l’entité sélectionnée
C’est le point d’entrée de la vue.  
Elle sert de référence pour tracer tous les liens visibles.

### 2. Quatre cadrans : les liens directs
Chaque cadran accueille un type de relation :

- **les parents**,  
- **les enfants**,  
- **les membres d’une fratrie réelle**,  
- **les consorts**, c’est-à-dire les partenaires avec lesquels l’entité partage une descendance ou une union narrative significative.

L’HoloGraph privilégie des **liens familiaux structurants**, pas des associations symboliques ou anecdotiques.

---

## Types de relations représentées

### Parents et enfants
Les liens ascendants et descendants sont systématiquement représentés lorsqu’ils sont connus et consensuels.

### Fratries réelles
Seules les fratries établies par des **parents communs identifiés** sont affichées.  
Les groupes entitaires (par exemple les Oneiroi, les Ouréa ou les Érinyes) ne sont pas représentés comme des individus isolés dans le graphe, mais comme des ensembles non focalisables.

### Familles nucléaires
Quand c’est pertinent pour la compréhension, l’HoloGraph met en évidence des **cellules familiales cohérentes** (par exemple : Zeus / Héra et leurs enfants, ou Cronos / Rhéa et leur première génération).

### Variantes de tradition
L’HoloGraph privilégie une **version principale** dans les cas où les traditions divergent, afin d’éviter la surcharge visuelle.  
Les variantes apparaissent dans les fiches entités, mais ne sont généralement pas représentées dans le graphe.

---

## Modèle de données utilisé

L’HoloGraph s’appuie sur un fichier généalogique en **YAML** structuré par entité.  
Ce fichier est ensuite transformé en **JSON statique**, exploité par le module interactif.

Chaque entité contient notamment :

- un identifiant unique  
- une catégorie (dieu, titan, héros, mortel, créature)  
- une liste de parents  
- une liste d’enfants  
- des relations importantes éventuelles  
- des informations annexes (sources, variantes, commentaires)

Ce modèle permet :

- une mise à jour simple,  
- une lisibilité parfaite pour les humains,  
- une exploitation directe par l’interface interactive.

---

## Représentation visuelle

### Positionnement des nœuds
Chaque type de relation occupe un cadran dédié.  
Ce positionnement permet une lecture immédiate :

- qui est parent de qui,  
- quelles relations sont horizontales (fratries),  
- quelles branches descendent de quelle union.

### Halos et interactions
Des halos ou survols interactifs permettent de :

- surligner une famille nucléaire,  
- montrer les relations directes d’une entité,  
- faciliter la navigation d’un nœud à l’autre.

### Navigation
Un clic sur un consort ou un enfant met en évidence la famille nucléaire constituée avec l’entité centrale.  
Deux clics sur un nœud replacent cette entité au centre du graphe et réorganisent la vue autour d’elle.

Le passage de la mise en évidence à la refocalisation constitue un principe essentiel :  
**la focale est toujours mouvante et recalculée selon l’interaction.**

---

## Limites assumées

L’HoloGraph ne cherche pas à :

- représenter toutes les traditions de manière exhaustive,  
- afficher la généalogie complète en un seul diagramme,  
- montrer toutes les relations mineures,  
- fusionner automatiquement des variantes contradictoires.

Ces limites sont intentionnelles et garantissent une **lisibilité maximale**.

Les divergences complexes sont traitées dans les fiches ou les récits, mais pas dans la visualisation centrale.

---

## Rôle de l’HoloGraph dans Mythoskolis

L’HoloGraph est un **point d’entrée visuel** qui permet de :

- comprendre rapidement comment une entité s’inscrit dans une famille,  
- visualiser les liens essentiels sans surcharge,  
- naviguer intuitivement entre les personnages,  
- situer les récits dans un paysage généalogique cohérent.

Il ne remplace pas les fiches ni les récits :  
il sert de **cartographie**, là où les fiches servent de **synthèse**, et les récits de **contexte narratif**.

L’ensemble forme une **boucle de navigation** cohérente pour explorer la mythologie grecque.
