/**
 * Turns a Markdown page body into numbered sections for the editorial layout.
 *   "## Heading"            starts a section (shown as § 1, § 2, …)
 *   "*italic line*"         directly under a heading becomes small grey details (e.g. course numbers, dates)
 *   "> quoted lines"        become the section's side note in the margin
 * Internal links like [text](/research/) are prefixed with the site's base path automatically.
 */
import { createMarkdownProcessor } from '@astrojs/markdown-remark';

export interface PageSection {
  heading: string;
  meta?: string; // HTML
  body: string; // HTML
  sidenote?: string; // HTML
}

let processor: Awaited<ReturnType<typeof createMarkdownProcessor>> | null = null;

async function toHtml(md: string): Promise<string> {
  processor ??= await createMarkdownProcessor();
  const { code } = await processor.render(md);
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base ? code.replace(/href="\/(?!\/)/g, `href="${base}/`) : code;
}

const inline = (html: string) => html.replace(/^<p>([\s\S]*)<\/p>\s*$/, '$1');

export async function pageSections(markdown: string): Promise<PageSection[]> {
  const clean = markdown.replace(/<!--[\s\S]*?-->/g, '');
  const parts = clean.split(/^##\s+(.+)$/m); // [before, heading1, body1, heading2, body2, …]
  const sections: PageSection[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const heading = parts[i].trim();
    let lines = parts[i + 1].split('\n');

    // Side note: every line starting with ">"
    const noteLines = lines.filter((l) => /^\s*>/.test(l)).map((l) => l.replace(/^\s*>\s?/, ''));
    lines = lines.filter((l) => !/^\s*>/.test(l));

    // Meta: first non-empty line if it is entirely *italic*
    let meta: string | undefined;
    const first = lines.findIndex((l) => l.trim() !== '');
    if (first >= 0 && /^\*[^*].*\*$/.test(lines[first].trim())) {
      meta = inline(await toHtml(lines[first].trim()));
      lines.splice(first, 1);
    }

    sections.push({
      heading,
      meta,
      body: await toHtml(lines.join('\n')),
      // Two-space line breaks are easy to lose in an editor, so treat each ">" line as its own line
      sidenote: noteLines.length ? inline(await toHtml(noteLines.join('  \n'))) : undefined,
    });
  }
  return sections;
}
