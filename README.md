# SPHERE Lab website

The website of the Social Computing for Health and Well-Being Research Laboratory (#SPHERE Lab) at
Vanderbilt University Medical Center. It is built with [Astro](https://astro.build) and published
for free on GitHub Pages.

You never need to touch the code to keep the site current. Everything you will normally change lives
in simple text files, listed below.

## See the site on your computer

Open Terminal in this folder and run:

```bash
npm install      # first time only
npm run dev      # then open http://localhost:4321 in your browser
```

While `npm run dev` is running, the page refreshes automatically every time you save a file.
Press `Ctrl + C` in Terminal to stop it.

## Common updates

| I want to… | Edit this |
|---|---|
| Change lab name, subtitle, contact, links, main menu | `src/data/site.yaml` (Identity, Contact, Main menu sections) |
| Change the Home page headline, buttons, section titles, or how many items they show | `src/data/site.yaml` → `home:` |
| Change the Home page numbers strip | `src/data/site.yaml` → `stats:` |
| Change the Research page headline, "Supported by" line, funder abbreviations | `src/data/site.yaml` → `research:` |
| Edit the Teaching page | `src/content/pages/teaching.md` |
| Edit the Join & Contact text | `src/content/pages/join.md` (contact details come from `site.yaml`) |
| Add a new lab member | Copy any file in `src/content/people/`, rename it (e.g. `jane-doe.md`), edit it. Roles: pi, postdoc, staff, phd, undergrad, alumni |
| Add someone's education or credentials ("Ph.D., FAMIA") | `education:` / `credentials:` in their file in `src/content/people/` |
| Add a former student or intern (compact list, no photo) | Add a line to `src/data/mentees.yaml` |
| Move someone to alumni | In their file, set `role: "alumni"`, add `until: 2027` and `now: "Where they went"` |
| Add a photo | Drop the original in `headshots/` and ask Claude to process it, or put a 4:5 JPG in `public/images/people/` and add `photo: "/images/people/jane-doe.jpg"` |
| Add a paper | Add a line at the top of `src/data/publications.yaml` (copy an existing line) |
| Add a news item | Add a file to `src/content/news/` (copy an existing one) |
| Edit a research program | `src/content/programs/<program>.md` |
| Edit or add a research direction | `src/content/directions/<direction>.md` (set `program:` to its program) |
| Add or update a grant | `src/data/funding.yaml` (awarded grants only, as this file is public) |

### Text pages (Teaching, Join & Contact)

These are plain Markdown files in `src/content/pages/`:
- `## Heading` starts a numbered section (§ 1, § 2, …).
- An *italic line* directly under a heading becomes small grey details (course numbers, dates).
- Lines starting with `>` become that section's note in the right margin.
- Links to other pages can be written as `[text](/research/)`; they keep working when the site lives in a sub-folder.

### People files

```markdown
---
name: "Jane Doe"
role: "phd"            # pi | postdoc | phd | undergrad | alumni
title: "Ph.D. Student"
program: "Computer Science"
since: 2027
aliases: ["Jane A Doe"] # other spellings used in author lists, so papers link to her
links: { email: "jane.doe@vanderbilt.edu", github: "https://github.com/janedoe" }
---

A short bio in plain text. *Italics* and **bold** work.
```

### Publications

Each paper is one line in `src/data/publications.yaml`:

```yaml
- {"title": "Paper title", "authors": ["Jane Doe", "Zhijun Yin"], "venue": "JAMIA 33(1)", "year": 2027, "type": "journal", "directions": ["llm-reliability"], "links": {"doi": "10.1093/jamia/xxxx", "pdf": "", "code": ""}}
```

- `type`: `journal`, `conference`, `preprint`, `chapter`, or `abstract`
- `links`: `"doi"` (preferred; the title opens https://doi.org/…) or `"pdf"` (any paper page: arXiv, PubMed Central,
  or a PDF). Papers with neither still get a clickable title that searches Google Scholar for the exact title,
  shown with a "Find online" label. Add the real link once the paper is published.
- Optional `"featured": true` (plus `"venueShort": "CHI 2026"`) shows the paper under "Featured work" on the Home
  page. Use a number instead of `true` to set the order (`"featured": 1` is shown first). The maximum shown is
  `home.sections.featured.count` in `site.yaml`.
  - Up to 3 featured papers: three cards side by side.
  - 4 or more: the row becomes a slider (swipe or trackpad, or the ‹ › arrows; a counter shows "1–3 of 6").
    It never moves on its own.
- `directions`: one or more direction ids (the file names in `src/content/directions/`). The **first one is the
  primary direction**, which decides where the paper is counted on the Research page. Use `[]` for
  collaborations outside the lab's programs.
  Current ids: `treatment-adherence`, `online-communities`, `llm-reliability`, `clinical-speech`,
  `medical-imaging`, `clinical-workflows`, `single-cell-omics`, `genetic-association`.
- Lab members are recognized automatically from author names, highlighted, and linked to their profiles.
- **Lab-led vs. collaboration is computed automatically:** a paper is lab-led if the PI (`pi` in
  `src/data/site.yaml`) is first or last author, or a lab member is first author.
- The Research page program columns, the "Who works on what" map, people pages, and all counts
  update by themselves.
  If you mistype an id, the build stops and tells you which paper and which id.

## How the research structure works

```
programs (src/content/programs/)          3 headline programs, shown on the home page
   └── directions (src/content/directions/)   8 concrete directions, each names its program
         └── papers (src/data/publications.yaml)   each paper lists its directions
grants (src/data/funding.yaml)             each direction lists the grant ids that support it
```

To add a ninth direction, add one file to `src/content/directions/`, then tag papers with its id.

## Publish changes

After the one-time GitHub setup, publishing is three commands:

```bash
git add -A
git commit -m "Add new paper"
git push
```

GitHub rebuilds and republishes the site in about a minute. Watch progress under the **Actions** tab of the repository.

## Before you publish: checks

```bash
npm run build        # builds the site into dist/
npm run check-links  # confirms no internal link is broken
```

## Design and long-term maintenance

- **Colors** are defined once in `src/styles/global.css` (light and dark mode). Program colors are `--p1`, `--p2`, `--p3`.
- **Fonts** (Newsreader, Inter, JetBrains Mono) are stored in `src/assets/fonts/` and served with the site, so the site
  never depends on an outside font service.
- **Versions are pinned** in `package.json`. The Node.js version used to publish lives in one file, `.nvmrc`
  (currently 22; Node 22 is supported until April 2027, so change it to the next long-term version then).
- **Shared code** lives in `src/lib/` (`data.ts` loads and checks all content; `markdown.ts` renders text pages).

## Link previews and search engines

- `public/og.jpg` is the preview image shown when the site is shared (Slack, LinkedIn, X, email). It contains the
  lab name and headline as an image, so it does **not** update by itself; ask Claude to regenerate it if the
  headline changes.
- `/sitemap.xml` and `/robots.txt` are generated automatically from the site's pages.

## Privacy notes

- `CV_YIN.pdf` is kept on your computer only. It is listed in `.gitignore`, so it is never uploaded.
- The site shows funders and project titles but never dollar amounts, effort, or pending grants.
  Pending applications are deliberately not stored anywhere in this repository.
- Email addresses are protected from spam harvesters. Write them as `name [at] domain` in config files
  (e.g. `links: {"email": "jane.doe [at] vanderbilt.edu"}`). The site stores them scrambled and shows a normal,
  clickable address to visitors (via `src/components/Email.astro`).
