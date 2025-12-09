# 🏛️ Mythoskolis — mythologie grecque, fiches et généalogie interactive

Mythoskolis est un site de médiation culturelle qui rend la mythologie grecque lisible : fiches synthétiques, récits structurés et un HoloGraph interactif pour visualiser les filiations.

---

🔗 Démo : https://mythoskolis.com

## 1. Fonctionnalités principales
- Fiches entités (dieux, titans, héros, créatures) en Markdown + frontmatter.
- Récits narratifs avec métadonnées (YAML) et filtre de recherche (titres + thématiques, insensible à la casse/accents).
- HoloGraph interactif : graphe généalogique généré depuis `data/genealogie.yaml` → JSON statique.
- Thème clair/sombre avec toggle persistant.
- Pages éditoriales (ressources, à propos).

## 2. Stack technique
- Astro (site statique)
- Tailwind CSS (design system `mk-*`)
- Markdown + frontmatter YAML (collections Astro)
- Scripts de génération JSON (généalogie)
- Déploiement Cloudflare Pages (build Astro)

## 3. Modélisation des données
- `data/genealogie.yaml` = source de vérité des relations ; export JSON auto via `scripts/generate-genealogie-json-new.mjs` (hooké sur `predev` / `prebuild`).
- Collections éditoriales dans `src/content/` (entités, récits, ressources) avec IDs stables ; l’ego-graph et les fiches partagent les mêmes IDs.
- Médias préfixés par culture/ID (`public/faces/grecque-*.webp`, `public/images/`, `public/videos/`) avec fallback vidéo > image > placeholder.
- Encarts/boutons HoloGraph affichés uniquement si l’ID existe dans le YAML ; HoloGraph isolé (CSS/JS d’origine, sans Tailwind).

## 4. Installation locale
```bash
npm install
npm run dev
# ou pour expliciter l’hôte/port :
# npm run dev -- --host --port XXXX dans le cas de tests -même distants- sur mobile via Tailscale
```

## 5. Organisation du projet
```
mythoskolis/
├── data/                 # YAML généalogie (source unique)
├── public/               # Médias statiques (faces/, images/, videos/)
├── src/
│   ├── components/       # Header, Footer, EgoGraph, etc.
│   ├── content/          # Fiches entités/récits/ressources (MD + FM)
│   ├── lib/              # Lecture/transformations généalogie
│   ├── pages/            # Pages Astro
│   └── styles/           # Styles globaux (Tailwind, mk-*)
├── scripts/              # Génération JSON généalogie
└── tools/                # Inspecteurs YAML/MD (maintenance locale)
```

## 6. Scripts utiles
```bash
npm run dev        # serveur de dev
npm run build      # build statique (dist/)
npm run preview    # prévisualiser le build
npm run format     # Prettier
npm run yaml:tool:new  # inspecteur YAML (relations, nouvelles structures)
npm run md:tool    # inspecteur Markdown (frontmatter + corps)
```

## 7. Roadmap (extrait)
- ✔️ Graphe généalogique interactif + encarts/boutons conditionnels sur les fiches.
- ✔️ Filtre récits sur titres + thématiques (case/accents insensibles).
- ✔️ HoloGraph isolé (CSS/JS d’origine, pas de Tailwind/design system).
- ✔️ Accessibilité/SEO (alts, aria, contrastes AA).
- ✔️ Filtres/badges nature/panthéon sur la liste des entités.
- ✔️ Enrichir `source_texts` / variantes ; médias préfixés (ancienne arbo à trancher).
- ✔️ QA/CI : lint/format auto, tests YAML, visuels ego-graph, CI build PR ; ☐ section portfolio à ajouter.
- ☐ V2 : navigation ego-graph avec variantes, multi-cultures, packaging du module.

## 8. Valeur pour recruteurs/lecteurs
- Stack moderne Astro + Tailwind v4, design system maison (`mk-*`).
- Modélisation et pipelines : YAML → JSON → Astro, fallback médias, IDs partagés entre front et graphe.
- UX mobile avec thème clair/sombre, filtres, cartes cohérentes.
- Maintenance sans CMS : inspecteurs YAML/MD, scripts de génération intégrés au build.

## 9. Licence
Unlicensed / All rights reserved