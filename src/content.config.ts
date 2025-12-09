import { defineCollection, z } from "astro:content";

const entites = defineCollection({
  type: "content",
  schema: z
    .object({
      title: z.string(),
      culture: z.string().optional(),
      id: z.string().optional(),
      nature: z.array(z.string()).optional(),
      gender: z.string().optional(),
      role: z.string().optional(),
      description: z.string().optional(),
      domains: z.array(z.string()).optional(),
      symbols: z.array(z.string()).optional(),
      parents: z.array(z.string()).optional(),
      children: z.array(z.string()).optional(),
      relations: z.array(z.string()).optional(),
      image: z.string().optional(),
      video: z.string().optional(),
      og_image: z.string().optional(),
      sources: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
    })
    .passthrough(),
});

const ressources = defineCollection({
  type: "content",
  schema: z
    .object({
      title: z.string(),
      id: z.string(),
      type: z.literal("ressource"),
      description: z.string(),
    })
    .passthrough(),
});

const pages = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

const recits = defineCollection({
  type: "content",
  schema: z
    .object({
      title: z.string(),
      id: z.string(),
      type: z.literal("recit"),
      picture: z.boolean().optional(),

      main_entities: z.array(z.string()).optional(),
      opponents: z.array(z.string()).optional(),
      places: z.array(z.string()).optional(),
      artifacts: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),

      era: z.string().optional(),
      importance: z.string().optional(),
      summary: z.string().optional(),

      sources: z
        .array(
          z.object({
            author: z.string(),
            work: z.string(),
            note: z.string().optional(),
          }),
        )
        .optional(),
    })
    .passthrough(),
});

const data = defineCollection({
  type: "data",
  schema: z.object({}).passthrough(),
});

export const collections = {
  entites,
  ressources,
  pages,
  recits,
  data,
};
