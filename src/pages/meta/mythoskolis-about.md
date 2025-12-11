title: "À propos de Mythoskolis"
description: "Présentation détaillée de Mythoskolis, de sa structure et de ses objectifs."
layout: ../../layouts/MetaLayout.astro
---

Mythoskolis est un site de médiation culturelle dédié à la mythologie grecque.  
Son objectif principal est de rendre **lisibles** les liens familiaux et les grandes lignes des récits, en combinant trois éléments qui fonctionnent ensemble :

1. Un **HoloGraph** généalogique interactif  
2. Des **fiches entités** synthétiques  
3. Des **récits structurés** et illustrés

L’ensemble forme un écosystème cohérent qui permet de comprendre rapidement qui est qui, qui est lié à qui, et dans quel contexte narratif une entité apparaît.

---

## Objectif du projet

Mythoskolis poursuit plusieurs objectifs complémentaires.

### Rendre la mythologie grecque lisible

La mythologie grecque est riche et foisonnante, mais souvent confuse pour le lecteur moderne.  
Mythoskolis cherche à :

- **démêler les filiations**  
- **clarifier les fratries réelles** et les familles nucléaires  
- **éviter les confusions** entre variantes de tradition différentes  
- **proposer une vision synthétique** plutôt qu’un empilement de détails

L’idée n’est pas de tout dire, mais de proposer un socle clair, structuré et navigable.

### Servir d’outil de navigation plutôt que d’encyclopédie brute

Mythoskolis ne vise pas l’exhaustivité.  
Le site est pensé comme un **outil de navigation** dans la mythologie grecque, et non comme une compilation illimitée de textes.

L’utilisateur peut :

- partir d’une entité (Zeus, Ariane, Prométhée)  
- visualiser ses liens familiaux dans l’HoloGraph  
- ouvrir une fiche synthétique  
- prolonger par un récit qui remet cette entité en contexte

Cette circulation entre graphe, fiche et récit est au cœur du projet.

### Montrer un exemple de mise en valeur de données culturelles

Mythoskolis sert aussi de vitrine technique.  
Il illustre comment des **données culturelles complexes** peuvent être :

- structurées en YAML,  
- transformées en JSON,  
- exploitées dans un graphe généalogique interactif,  
- rendues accessibles à travers une interface claire.

Le projet montre comment un même corpus de données peut alimenter plusieurs expériences de lecture.

---

## Public visé

Mythoskolis s’adresse à plusieurs types de publics.

- **Curieux de mythologie grecque** qui veulent y voir plus clair dans les liens familiaux et les grandes figures.  
- **Enseignants, médiateurs, passionnés** qui ont besoin d’un support visuel pour expliquer les filiations.  
- **Lecteurs pressés** qui préfèrent des textes courts, structurés, faciles à parcourir.  
- **Professionnels du numérique et de la data** qui s’intéressent à la modélisation de données culturelles.

Le site est pensé pour se **picorer**.  
Une page doit pouvoir être lue seule, en quelques minutes, sans exiger un engagement long.  
Libre ensuite au lecteur de prolonger la visite en ouvrant d’autres fiches ou d’autres récits.

---

## Un écosystème en boucle : graphe, fiches, récits

Mythoskolis repose sur une boucle simple.

### 1. HoloGraph : le graphe généalogique interactif

L’HoloGraph est un module central du site.  
Il présente une **vue ego centrée** de la généalogie : à partir d’une entité choisie, le graphe affiche ses parents, ses enfants, ses fratries réelles et certaines relations importantes.

Caractéristiques principales :

- graph orienté autour d’une entité focale  
- mise en évidence des **familles nucléaires**  
- visualisation des **fratries** lorsqu’elles ont du sens  
- navigation de proche en proche entre entités liées

L’HoloGraph ne raconte pas une histoire complète.  
Il met en forme les **relations de parenté**, de façon lisible et manipulable.

### 2. Fiches entités : portrait synthétique

Chaque entité (dieu, titan, héros, mortel important, créature) possède une fiche structurée en sections.

En général, une fiche contient :

- une présentation rapide de l’entité  
- son rôle et ses attributs essentiels  
- un résumé de sa place dans les récits  
- quelques éléments de contexte ou de variantes

Ces fiches sont volontairement synthétiques.  
Elles sont conçues pour être lues en quelques minutes, tout en restant suffisamment informatives pour situer l’entité dans le paysage mythologique.

### 3. Récits : épisodes structurés

Les récits de Mythoskolis ne cherchent pas l’exhaustivité littéraire.  
Ils visent plutôt :

- la **clarté** du déroulé
- la **cohérence** entre les sources principales
- la **lisibilité** des enjeux et des liens entre personnages

Chaque récit se concentre sur un épisode ou un ensemble d’épisodes, avec une narration accessible et structurée.  
L’interface permet de relier ces récits aux fiches d’entités concernées et au graphe généalogique.

---

## Structure technique du site

Sans entrer dans des détails de code, Mythoskolis repose sur quelques choix techniques importants.

- Site **statique** généré avec Astro  
- Styles gérés avec **Tailwind CSS**  
- Données généalogiques principales stockées dans des fichiers **YAML**  
- Transformation de ces données en **JSON** pour alimenter l’HoloGraph  
- Fiches entités et récits écrits en **Markdown** avec frontmatter YAML

Ce choix permet :

- une séparation nette entre **contenu** et **présentation**  
- une mécanique de génération reproductible  
- une meilleure lisibilité des données pour les humains comme pour les machines

---

## Positionnement par rapport aux autres ressources

Mythoskolis ne prétend pas remplacer :

- les éditions savantes,  
- les travaux universitaires,  
- les éditions intégrales des textes antiques,  
- ni les grands sites encyclopédiques généralistes.

Le site se positionne comme un **intermédiaire lisible** :

- plus structuré et navigable qu’un article isolé  
- plus synthétique et accessible qu’une étude universitaire  
- plus visuel et interactif qu’un simple arbre généalogique statique

Son apport principal réside dans la combinaison :

- d’une **généalogie interactive**,  
- de **fiches synthétiques**,  
- et de **récits structurés**,  
avec un effort constant de cohérence et de clarté.

---

## Sources et parti pris

Les données de Mythoskolis s’appuient en priorité sur :

- les grands textes fondateurs (par exemple Hésiode ou le Pseudo-Apollodore),  
- des synthèses modernes,  
- des ouvrages de référence sur la mythologie grecque.

Lorsque plusieurs traditions se contredisent, Mythoskolis :

- choisit un **fil conducteur principal** pour la lisibilité,  
- signale les variantes lorsque c’est pertinent,  
- évite d’introduire trop de branches concurrentes qui nuiraient à la compréhension.

Le parti pris est assumé :  
favoriser la **clarté de la généalogie** et la **cohérence générale**, plutôt que d’accumuler toutes les variantes possibles.

---

## À propos du créateur

Mythoskolis est développé et maintenu par une seule personne, à la fois :

- passionné de mythologie grecque,  
- sensible aux enjeux de médiation culturelle,  
- et intéressé par la structuration et la mise en valeur de données complexes.

Le projet évolue progressivement, avec :

- l’enrichissement des entités,  
- l’ajout de récits,  
- l’amélioration continue de l’HoloGraph,  
- et la consolidation du modèle de données sous-jacent.

L’ambition n’est pas de tout couvrir, mais de proposer une **base solide, claire et navigable**, que l’on peut explorer à son rythme.

---

## Comment utiliser Mythoskolis

Quelques manières de profiter du site :

- ouvrir l’HoloGraph pour comprendre les liens entre quelques grandes figures  
- consulter une fiche entité pour se rafraîchir la mémoire sur un dieu, un héros ou un mortel  
- lire un récit pour replacer un épisode dans son contexte  
- circuler de graphe en fiche, puis de fiche en récit, selon sa curiosité du moment

Mythoskolis est conçu pour être exploré par petites touches, sans obligation de suivre un parcours imposé.  
Chaque visite peut se limiter à une fiche ou à un seul récit, ou se prolonger en une exploration plus large de la généalogie.
