import { load } from "js-yaml";
import glossaireRaw from "../../data/glossaire.yaml?raw";

export type GlossaryEntry = {
  name: string;
  definition: string;
};

type GlossaryYaml = {
  word?: GlossaryEntry[];
};

const parsed = load(glossaireRaw) as GlossaryYaml;

const glossaryEntries: GlossaryEntry[] = Array.isArray(parsed?.word)
  ? parsed.word
      .map((entry) => ({
        name: (entry?.name ?? "").toString().trim(),
        definition: (entry?.definition ?? "").toString().trim(),
      }))
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
