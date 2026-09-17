import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { SITE } from './config/site.mjs';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default(SITE.name),
    category: z.string(),
    cover: z.string(),
    coverAlt: z.string(),
    coverPosition: z.string().default('center'),
    coverAspect: z.string().optional(),
    coverScale: z.string().optional(),
    coverFit: z.string().optional(),
    coverBg: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
