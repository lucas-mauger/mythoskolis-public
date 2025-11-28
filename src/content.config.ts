import { defineCollection, z } from "astro:content";

const dieux = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    role: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),  // /images/artemis.webp
    video: z.string().optional(),
    og_image: z.string().optional(),
    parents: z.array(z.string()).optional(),
    symboles: z.array(z.string()).optional(),
    domaines: z.array(z.string()).optional(),
  }),
});

const ressources = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    id: z.string(),
    type: z.literal("ressource"),
    description: z.string(),
  }),
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
  schema: z.object({
    title: z.string(),
    slug: z.string(),
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
  }),
});

const data = defineCollection({
  type: "data",
  schema: z.object({
    categories: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        tags: z.array(
          z.object({
            id: z.string(),
            label: z.string(),
          }),
        ),
      }),
    ),
  }),
});

export const collections = {
  dieux,
  ressources,
  pages,
  recits,
  data,
};
