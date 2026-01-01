import { load } from "js-yaml";
import glossaireRaw from "../../data/glossaire.yaml?raw";

export type GlossaryEntry = {
  name: string;
  definition: string;
  matchTerms?: string[];
};

type GlossaryYamlEntry = {
  name?: unknown;
  definition?: unknown;
  match_terms?: unknown;
  matchTerms?: unknown;
};

type GlossaryYaml = {
  word?: GlossaryYamlEntry[];
};

const parsed = load(glossaireRaw) as GlossaryYaml;

function normalizeMatchTerms(value: unknown, name: string): string[] | undefined {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const nameKey = name.toLocaleLowerCase("fr");
  const seen = new Set<string>();
  const normalized = raw
    .map((item) => (item ?? "").toString().trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLocaleLowerCase("fr");
      if (!key || key === nameKey) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return normalized.length > 0 ? normalized : undefined;
}

const glossaryEntries: GlossaryEntry[] = Array.isArray(parsed?.word)
  ? parsed.word
      .map((entry) => {
        const name = (entry?.name ?? "").toString().trim();
        const definition = (entry?.definition ?? "").toString().trim();
        const matchTerms = normalizeMatchTerms(entry?.match_terms ?? entry?.matchTerms, name);
        return {
          name,
          definition,
          ...(matchTerms ? { matchTerms } : {}),
        };
      })
      .filter((entry) => entry.name && entry.definition)
  : [];

function getInitial(name: string): string {
  const initial = name.trim().charAt(0).toUpperCase();
  return initial || "#";
}

export function getGlossaryEntries(): GlossaryEntry[] {
  return glossaryEntries;
}

export function getGlossaryByInitial(entries = glossaryEntries): { letter: string; entries: GlossaryEntry[] }[] {
  const groups = new Map<string, GlossaryEntry[]>();

  entries
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "fr"))
    .forEach((entry) => {
      const letter = getInitial(entry.name);
      if (!groups.has(letter)) groups.set(letter, []);
      groups.get(letter)!.push(entry);
    });

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b, "fr"))
    .map(([letter, groupedEntries]) => ({ letter, entries: groupedEntries }));
}
