import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/*
 * Content model
 *   programs   (3)  →  directions (each names its program)  →  papers (src/data/publications.yaml, "directions")
 * Ids are file names, so adding a direction = adding one file. Cross-references are checked in src/lib/data.ts.
 */

const people = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/people' }),
  schema: z.object({
    name: z.string(),
    role: z.enum(['pi', 'postdoc', 'staff', 'phd', 'undergrad', 'alumni']),
    title: z.string(),
    program: z.string().optional(), // academic program, e.g. "Computer Science"
    since: z.number().optional(),
    until: z.number().optional(),
    now: z.string().optional(), // where alumni went
    photo: z.string().optional(), // e.g. /images/people/name.jpg in /public
    aliases: z.array(z.string()).default([]), // other spellings used in author lists
    directions: z.array(z.string()).default([]), // optional extra research directions
    links: z
      .object({
        email: z.string().optional(),
        website: z.string().optional(),
        scholar: z.string().optional(),
        github: z.string().optional(),
        linkedin: z.string().optional(),
      })
      .default({}),
    order: z.number().default(100),
    credentials: z.string().optional(), // shown after the name, e.g. "Ph.D., FAMIA"
    education: z.array(z.string()).default([]), // shown as a side note on the People page and profile
  }),
});

const programs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/programs' }),
  schema: z.object({
    number: z.number(),
    title: z.string(),
    short: z.string(),
    summary: z.string(),
  }),
});

const directions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/directions' }),
  schema: z.object({
    program: z.string(), // id of a file in src/content/programs
    number: z.number(),
    title: z.string(),
    short: z.string(), // short label for the tree, map and filters
    summary: z.string(),
    questions: z.array(z.string()).default([]),
    funding: z.array(z.string()).default([]), // ids from src/data/funding.yaml
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    date: z.coerce.date(),
    title: z.string(),
  }),
});

// Free-text pages (Teaching, Join & Contact): "## Heading" = numbered section, "> line" = side note
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    kicker: z.string(),
    description: z.string(),
    lede: z.string().optional(),
    contactHeading: z.string().optional(),
  }),
});

export const collections = { people, programs, directions, news, pages };
