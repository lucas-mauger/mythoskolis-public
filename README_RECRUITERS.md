# Mythoskolis — Technical Overview (Recruiter Edition)

Mythoskolis is a data-driven cultural web project focused on Greek mythology.
Its primary goal is to make complex mythological genealogies understandable, navigable, and explorable, while preserving contradictory sources and variant traditions.

This repository is intentionally designed as a technical showcase, demonstrating data modeling, pipeline design, and UX reasoning rather than content production alone.

---

## What problem does this project solve?

Greek mythology is:
- fragmented across heterogeneous sources,
- internally contradictory,
- hard to represent visually without oversimplification.

Core challenge:
How to represent a non-canonical, multi-variant genealogy in a way that is:
- structurally sound,
- explorable by non-experts,
- technically maintainable.

---

## Key technical contributions

### 1. Data modeling of a complex domain

- Single source of truth: structured YAML.
- Explicit modeling of relationships:
  - parents, children, siblings, consorts.
- Each relation can carry:
  - a consensus flag,
  - one or more textual sources (author, work, passage).
- Contradictory data is preserved, not flattened.

Demonstrates analytical thinking and domain modeling.

---

### 2. Custom ETL pipeline (YAML → JSON → Front)

- Node.js scripts transform raw YAML into a normalized JSON graph.
- Pipeline steps:
  - ID normalization,
  - relation deduplication,
  - consensus consolidation,
  - validation and coverage checks.
- Pipeline runs automatically before dev and build.

Demonstrates data-engineering style reasoning applied to front-end delivery.

---

### 3. Internal tooling instead of generic CMS

- Decap / Netlify CMS was intentionally abandoned.
- Custom tools were built instead:
  - YAML inspector,
  - Markdown inspector,
  - local validation server.

Goals:
- faster iteration,
- stricter data coherence,
- direct control over the data model.

Demonstrates pragmatic trade-off decisions and tooling design.

---

### 4. UX systems built on top of structured data

#### HoloGraph (proprietary module)

- Interactive genealogical graph consuming the JSON output.
- Supports:
  - multiple parentage variants,
  - conflicting traditions in the same view.
- Module exists in production but is intentionally excluded from this repo.
- Integration points and data contracts are visible.

Demonstrates separation between data, logic, and visualization.

#### Contextual Reading Layer ("anti-Wikipedia")

- Inline contextual tooltips instead of navigational overload.
- User-configurable behavior:
  - density,
  - filtering,
  - mobile positioning,
  - persistent preferences.

Demonstrates UX design driven by data structure, not decoration.

---

## Technical stack

- Framework: Astro (static site generation)
- Languages: TypeScript, JavaScript, Markdown, YAML
- Styling: Tailwind CSS (custom design system)
- Data pipeline: Node.js scripts
- Deployment: Cloudflare Pages

---

## Project structure (simplified)

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

## What this project demonstrates

- Ability to formalize a complex, ambiguous problem.
- Strong data modeling and transformation skills.
- End-to-end reasoning: data → pipeline → UX.
- Capacity to design internal tools when off-the-shelf solutions do not fit.
- Fast iteration and delivery of a coherent V1.

---

## Running the project locally

```bash
npm install
npm run dev
```

---

## Notes

- This repository represents a public V1.
- Some modules (notably the HoloGraph visualization) are proprietary and excluded by design.
- The focus of this repo is architecture, data flow, and reasoning.

---

## License

Personal project.
Some components are intentionally excluded from public distribution.
