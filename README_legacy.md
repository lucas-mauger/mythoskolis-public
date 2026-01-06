# 🏛️ Mythoskolis — mythologie grecque, fiches et généalogie interactive

Mythoskolis est un site de médiation culturelle qui rend la mythologie grecque lisible : fiches synthétiques, récits structurés et un HoloGraph interactif (module propriétaire, non inclus dans ce dépôt public).

---

🔗 Démo : https://mythoskolis.com

## 1. Fonctionnalités principales
- Fiches entités (dieux, titans, héros, créatures) en Markdown + frontmatter.
- Récits narratifs avec métadonnées (YAML) et filtre de recherche (titres + thématiques, insensible à la casse/accents).
- Données généalogiques structurées dans `data/genealogie_new_structure.yaml`, exportées en JSON pour le front.
- HoloGraph interactif (module propriétaire, non livré dans ce dépôt) disponible sur le site en production.
- Thème clair/sombre avec toggle persistant.
- Pages éditoriales (ressources, à propos).

## 2. Stack technique
- Astro (site statique)
- Tailwind CSS (design system `mk-*`)
- Markdown + frontmatter YAML (collections Astro)
- Scripts de génération JSON (généalogie)
- Déploiement Cloudflare Pages (build Astro)

## 3. Modélisation des données
- `data/genealogie_new_structure.yaml` = source de vérité des relations ; export JSON auto via `scripts/generate-genealogie-json-new.mjs` (hooké sur `predev` / `prebuild`).
- Collections éditoriales dans `src/content/` (entités, récits, ressources) avec IDs stables ; les fiches et la généalogie partagent les mêmes IDs.
- Médias préfixés par culture/ID (`public/faces/grecque-*.webp`, `public/images/`, `public/videos/`) avec fallback vidéo > image > placeholder.
- Inspecteurs YAML/MD pour compléter les données sans CMS.

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
│   ├── components/       # Header, Footer, UI
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
npm run yaml:tool  # inspecteur YAML + MD
```

## 7. Roadmap (extrait)
- ✔️ Graphe généalogique interactif (module propriétaire) + encarts conditionnels sur les fiches.
- ✔️ Filtre récits sur titres + thématiques (case/accents insensibles).
- ✔️ Accessibilité/SEO (alts, aria, contrastes AA).
- ✔️ Filtres/badges nature/panthéon sur la liste des entités.
- ✔️ Enrichir `source_texts` / variantes ; médias préfixés (ancienne arbo à trancher).
- ✔️ QA/CI : lint/format auto, tests YAML, visuels généalogie, CI build PR ; ☐ section portfolio à ajouter.
- ☐ V2 : variantes, multi-cultures, packaging du module HoloGraph.

## 8. Valeur pour recruteurs/lecteurs
- Stack moderne Astro + Tailwind v4, design system maison (`mk-*`).
- Modélisation et pipelines : YAML → JSON → Astro, fallback médias, IDs partagés entre front et généalogie.
- UX mobile avec thème clair/sombre, filtres, cartes cohérentes.
- Maintenance sans CMS : inspecteurs YAML/MD, scripts de génération intégrés au build.

## 9. Licence
Unlicensed / All rights reserved
