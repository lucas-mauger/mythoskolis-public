import { defineCollection, z } from 'astro:content';

const dieux = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    image: z.string().optional(),
    description: z.string().optional(),
  }),
});

const ressources = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const collections = { dieux, ressources };
