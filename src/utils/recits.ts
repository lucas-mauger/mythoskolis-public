import { getCollection } from "astro:content";
import { isPublishedEntry } from "./content-filters";

export async function getRecitsForEntity(entityId: string) {
  const recits = await getCollection("recits", isPublishedEntry);
  return recits.filter((recit) => {
    const { main_entities, opponents } = recit.data as Record<string, any>;
    const inMain = Array.isArray(main_entities) && main_entities.includes(entityId);
    const inOpponents = Array.isArray(opponents) && opponents.includes(entityId);
    return inMain || inOpponents;
  });
}
