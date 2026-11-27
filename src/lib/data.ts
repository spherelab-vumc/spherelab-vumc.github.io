/**
 * Data layer: the only place that reads config/content files.
 * Pages and components receive ready-made, validated objects from here.
 */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { getCollection, type CollectionEntry } from 'astro:content';

const dataDir = path.resolve('./src/data');
const readYaml = <T>(file: string): T =>
  yaml.load(fs.readFileSync(path.join(dataDir, file), 'utf-8')) as T;

// ---------- types ----------
export interface SiteLink { id?: string; label: string; href: string }
export interface SectionSetting { title: string; count?: number }
export interface Site {
  labName: string;
  labFullName: string;
  subtitle?: string;
  institution: string;
  founded?: number;
  pi: string;
  contact: { email: string; address: string[] };
  links: SiteLink[];
  nav: { href: string; label: string }[];
  stats: { value: string; label: string }[];
  home: {
    headline: string;
    mission?: string;
    buttons?: { label: string; href: string; primary?: boolean }[];
    sections?: Partial<Record<'programs' | 'featured' | 'news' | 'recent', SectionSetting>>;
  };
  research?: {
    headline: string;
    lede?: string;
    supportedBy?: string[];
    funderAbbreviations?: Record<string, string>;
  };
}

export interface Grant {
  id: string;
  funder: string;
  number?: string;
  title: string;
  role: string;
  start: number;
  end: number;
  directions: string[];
}

export interface Publication {
  id: string;
  title: string;
  authors: string[];
  venue: string;
  year: number;
  type: 'journal' | 'conference' | 'preprint' | 'chapter' | 'abstract';
  directions: string[]; // first = primary
  area?: string; // grouping label for papers outside every direction
  featured?: boolean | number; // show on the Home page under "Featured work" (a number sets the order: 1 = first)
  coFirst?: string[]; // co-first authors (names as in `authors`), marked †
  coCorresponding?: string[]; // co-corresponding authors, marked *
  venueShort?: string; // short venue label for featured cards, e.g. "CHI 2026"
  links: { doi?: string; pdf?: string; code?: string };
  members: string[]; // slugs of lab members who are authors
  labLed: boolean;
  programs: string[]; // derived from directions
}

export type Person = CollectionEntry<'people'>;
export type Program = CollectionEntry<'programs'>;
export type Direction = CollectionEntry<'directions'>;

export interface DirectionStats {
  led: number;
  collab: number;
  total: number;
  first: number;
  last: number;
  members: string[]; // person slugs with papers in this direction
  grants: Grant[];
}

export const site = readYaml<Site>('site.yaml');

// ---------- small shared helpers (one definition, used everywhere) ----------
/** Look up an external link by id (e.g. "scholar"). */
export const linkById = (id: string) => site.links.find((l) => l.id === id);

/** A Home page section's title and item count, with defaults. */
export const homeSection = (key: 'programs' | 'featured' | 'news' | 'recent', title: string, count = 0) => ({
  title: site.home.sections?.[key]?.title ?? title,
  count: site.home.sections?.[key]?.count ?? count,
});

/**
 * Where a paper's title links: DOI > paper page (arXiv, PubMed Central, PDF) > a Google Scholar search for the title.
 * `kind` is used for the small link label ("DOI", "arXiv", "PMC", "PubMed", "PDF", "Link", "Search").
 */
export function paperLink(p: { title: string; links?: { doi?: string; pdf?: string } }) {
  const doi = p.links?.doi;
  if (doi) return { href: `https://doi.org/${doi}`, kind: 'DOI' };
  const u = p.links?.pdf;
  if (u) {
    const kind = /arxiv\.org/i.test(u) ? 'arXiv' : /pmc\.ncbi|ncbi\.nlm\.nih\.gov\/pmc/i.test(u) ? 'PMC'
      : /pubmed/i.test(u) ? 'PubMed' : /\.pdf($|[?#])/i.test(u) ? 'PDF' : 'Link';
    return { href: u, kind };
  }
  return { href: `https://scholar.google.com/scholar?q=${encodeURIComponent(`"${p.title}"`)}`, kind: 'Search' };
}

/** Display labels for publication types. */
export const TYPE_LABEL: Record<string, string> = {
  journal: 'Journal', conference: 'Conference', preprint: 'Preprint', chapter: 'Book chapter', abstract: 'Abstract',
};

/** CSS color variable for the n-th program (0-based): --p1, --p2, --p3, then repeats. */
export const programColor = (index: number) => `var(--p${(Math.max(0, index) % 3) + 1})`;

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
/** 3 -> "three"; capitalize -> "Three". Falls back to digits above twelve. */
export const numberWord = (n: number, capitalize = false) => {
  const w = WORDS[n] ?? String(n);
  return capitalize ? w[0].toUpperCase() + w.slice(1) : w;
};

export interface Mentee { name: string; role: string; affiliation?: string; years: string; topic?: string }
const firstYear = (y: string) => parseInt(String(y).match(/\d{4}/)?.[0] ?? '0', 10);
const lastYear = (y: string) => Math.max(...(String(y).match(/\d{4}/g) ?? ['0']).map(Number));
/** Former students and interns (src/data/mentees.yaml), newest first. */
export const mentees: Mentee[] = (fs.existsSync(path.join(dataDir, 'mentees.yaml')) ? readYaml<Mentee[]>('mentees.yaml') ?? [] : [])
  .sort((a, b) => lastYear(b.years) - lastYear(a.years) || firstYear(b.years) - firstYear(a.years) || a.name.localeCompare(b.name));

// ---------- names ----------
/** "Bradley A. Malin" and "Bradley Adam Malin" both become "bradley malin". */
export function nameKey(name: string): string {
  const t = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.*∗†‡]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return t.length < 2 ? t.join(' ') : `${t[0]} ${t[t.length - 1]}`;
}

export const ROLE_ORDER = ['pi', 'postdoc', 'staff', 'phd', 'undergrad', 'alumni'] as const;
export const ROLE_LABEL: Record<string, string> = {
  pi: 'Principal Investigator',
  postdoc: 'Postdoctoral Researchers',
  staff: 'Research Staff',
  phd: 'Ph.D. Students & Candidates',
  undergrad: 'Undergraduate Researchers',
  alumni: 'Alumni',
};

// ---------- loading ----------
interface All {
  people: Person[];
  programs: Program[];
  directions: Direction[];
  pubs: Publication[];
  grants: Grant[];
  memberKeys: Map<string, string>; // nameKey -> person slug
  piKey: string;
}
let cache: All | null = null;

export async function loadAll(): Promise<All> {
  if (cache) return cache;
  const people = (await getCollection('people')).sort(
    (a, b) =>
      ROLE_ORDER.indexOf(a.data.role) - ROLE_ORDER.indexOf(b.data.role) ||
      a.data.order - b.data.order ||
      a.data.name.localeCompare(b.data.name),
  );
  const programs = (await getCollection('programs')).sort((a, b) => a.data.number - b.data.number);
  const directions = (await getCollection('directions')).sort((a, b) => a.data.number - b.data.number);
  const grants = readYaml<Grant[]>('funding.yaml') ?? [];

  // ---- cross-reference checks: fail the build with a readable message ----
  const problems: string[] = [];
  const programIds = new Set(programs.map((p) => p.id));
  const directionIds = new Set(directions.map((d) => d.id));
  const grantIds = new Set(grants.map((g) => g.id));
  for (const d of directions) {
    if (!programIds.has(d.data.program))
      problems.push(`directions/${d.id}.md: program "${d.data.program}" not found in src/content/programs/`);
    for (const g of d.data.funding)
      if (!grantIds.has(g)) problems.push(`directions/${d.id}.md: funding "${g}" not found in src/data/funding.yaml`);
  }
  for (const g of grants)
    for (const d of g.directions ?? [])
      if (!directionIds.has(d)) problems.push(`funding.yaml (${g.id}): direction "${d}" not found`);

  const memberKeys = new Map<string, string>();
  for (const p of people) for (const n of [p.data.name, ...p.data.aliases]) memberKeys.set(nameKey(n), p.id);
  const piKey = nameKey(site.pi);
  const dirProgram = new Map(directions.map((d) => [d.id, d.data.program]));

  const raw = readYaml<any[]>('publications.yaml') ?? [];
  const pubs: Publication[] = raw.map((p, i) => {
    const authors: string[] = p.authors ?? [];
    const keys = authors.map(nameKey);
    const dirs: string[] = p.directions ?? [];
    for (const d of dirs)
      if (!directionIds.has(d)) problems.push(`publications.yaml: "${p.title?.slice(0, 50)}…" has unknown direction "${d}"`);
    const firstIsMember = keys.length > 0 && memberKeys.has(keys[0]) && keys[0] !== piKey;
    const labLed = keys[0] === piKey || keys[keys.length - 1] === piKey || firstIsMember;
    return {
      ...p,
      authors,
      directions: dirs,
      links: p.links ?? {},
      id: `pub-${i}`,
      members: [...new Set(keys.map((k) => memberKeys.get(k)).filter((s) => s && s !== memberKeys.get(piKey)))] as string[],
      labLed,
      programs: [...new Set(dirs.map((d) => dirProgram.get(d)).filter(Boolean))] as string[],
    };
  });
  pubs.sort((a, b) => b.year - a.year);

  if (problems.length) throw new Error('Content problems found:\n  - ' + problems.join('\n  - '));

  cache = { people, programs, directions, pubs, grants, memberKeys, piKey };
  return cache;
}

// ---------- derived statistics (never typed by hand) ----------
/** Counts for one direction, by primary direction only, so every paper is counted once. */
export function directionStats(id: string, all: All): DirectionStats {
  const mine = all.pubs.filter((p) => p.directions[0] === id);
  const years = mine.map((p) => p.year);
  const members = new Set<string>();
  for (const p of all.pubs) if (p.directions.includes(id)) p.members.forEach((m) => members.add(m));
  const d = all.directions.find((x) => x.id === id)!;
  const grants = d.data.funding.map((g) => all.grants.find((x) => x.id === g)!).filter(Boolean);
  return {
    led: mine.filter((p) => p.labLed).length,
    collab: mine.filter((p) => !p.labLed).length,
    total: mine.length,
    first: years.length ? Math.min(...years) : 0,
    last: years.length ? Math.max(...years) : 0,
    members: [...members],
    grants,
  };
}

/** Papers outside every direction ("Other collaborations"). */
export const unassigned = (all: All) => all.pubs.filter((p) => p.directions.length === 0);

/** Directions a person works on, weighted by paper count. */
export function personDirections(person: Person, pubs: Publication[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const d of person.data.directions) m.set(d, (m.get(d) ?? 0) + 1);
  for (const p of pubs) {
    if (!p.members.includes(person.id)) continue;
    for (const d of p.directions) m.set(d, (m.get(d) ?? 0) + 1);
  }
  return m;
}

/** Paper counts of 100 or more round down to the nearest 10 with a "+" (103 -> "100+"), so the site needn't change with every paper. */
export function paperCount(n: number): string {
  return n >= 100 ? `${Math.floor(n / 10) * 10}+` : String(n);
}

/** Resolve "auto:publications" style stat values. */
export function statValue(v: string, all: All): string {
  if (v === 'auto:publications') return paperCount(all.pubs.length);
  if (v === 'auto:lab-led') return paperCount(all.pubs.filter((p) => p.labLed).length);
  if (v === 'auto:members') return String(all.people.filter((p) => p.data.role !== 'alumni').length);
  if (v === 'auto:peer-reviewed') return paperCount(all.pubs.filter((p) => p.type === 'journal' || p.type === 'conference').length);
  if (v === 'auto:preprints') return paperCount(all.pubs.filter((p) => p.type === 'preprint').length);
  return v;
}

// ---------- helpers ----------
/** Prefix an internal path with the site's base path (needed on GitHub Pages). */
export function url(p: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (/^(https?:|mailto:|#)/.test(p)) return p;
  return `${base}${p.startsWith('/') ? p : `/${p}`}`;
}

export const initials = (name: string) =>
  name
    .replace(/[^A-Za-z\s-]/g, '')
    .split(/[\s-]+/)
    .filter((w) => w.length > 1)
    .map((w) => w[0])
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .join('');

export const fmtMonth = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' });

export const roman = (n: number) => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] ?? String(n);
