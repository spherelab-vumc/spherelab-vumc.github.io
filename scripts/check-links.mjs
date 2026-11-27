// Checks that every internal link in the built site (dist/) points to a page that exists.
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const base = (process.env.BASE_PATH || '/').replace(/\/$/, '');
const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const p = path.join(d, e.name);
  e.isDirectory() ? walk(p) : files.push(p);
});
walk(dist);

const exists = (href) => {
  let p = href.split(/[?#]/)[0];
  if (base && p.startsWith(base)) p = p.slice(base.length);
  const f = path.join(dist, decodeURI(p));
  return fs.existsSync(f) && fs.statSync(f).isFile() || fs.existsSync(path.join(f, 'index.html'));
};

let bad = 0;
for (const f of files.filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(f, 'utf-8');
  for (const [, href] of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    if (href.startsWith('//')) continue;
    if (!exists(href)) { bad++; console.log(`Broken: ${href}  (in ${path.relative(dist, f)})`); }
  }
}
console.log(bad ? `${bad} broken internal link(s).` : 'All internal links OK.');
process.exit(bad ? 1 : 0);
