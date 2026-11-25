// Guides: Markdown files in _build/guides/*.md become /guides/<slug>/ pages.
// File format: "key: value" header lines (title, description, date, and any
// number of "related: /path/ | Link text"), a line with ---, then Markdown.
// Supported Markdown: ## and ### headings, paragraphs, - and 1. lists,
// | tables |, **bold** and [links](/path/).
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function loadGuides(root) {
  const dir = join(root, '_build/guides');
  return readdirSync(dir).filter((f) => f.endsWith('.md')).sort().map((f) => {
    const raw = readFileSync(join(dir, f), 'utf8');
    const [headPart, ...bodyParts] = raw.split(/\n---\n/);
    const meta = { slug: f.replace(/\.md$/, ''), related: [] };
    for (const line of headPart.split('\n')) {
      const m = line.match(/^(\w+):\s*(.*)$/);
      if (!m) continue;
      if (m[1] === 'related') { const [href, text] = m[2].split('|').map((s) => s.trim()); meta.related.push({ href, text }); }
      else meta[m[1]] = m[2].trim();
    }
    meta.body = bodyParts.join('\n---\n').trim();
    meta.path = `/guides/${meta.slug}/`;
    meta.words = meta.body.replace(/[|#*\-[\]()]/g, ' ').split(/\s+/).filter(Boolean).length;
    return meta;
  });
}

function inline(text, esc) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((\/[^)\s]*|https?:\/\/[^)\s]+)\)/g, (m, t, href) => `<a href="${href}">${t}</a>`);
}

export function renderMarkdown(md, esc) {
  const out = [];
  const blocks = md.split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split('\n');
    if (/^### /.test(block)) { out.push(`<h3>${inline(block.slice(4), esc)}</h3>`); continue; }
    if (/^## /.test(block)) {
      const text = block.slice(3);
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      out.push(`<h2 id="${id}">${inline(text, esc)}</h2>`);
      continue;
    }
    if (lines.every((l) => /^\d+\.\s/.test(l))) {
      out.push(`<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+\.\s+/, ''), esc)}</li>`).join('')}</ol>`);
      continue;
    }
    if (lines.every((l) => /^-\s/.test(l))) {
      out.push(`<ul>${lines.map((l) => `<li>${inline(l.replace(/^-\s+/, ''), esc)}</li>`).join('')}</ul>`);
      continue;
    }
    if (lines.length >= 2 && lines.every((l) => /^\|.*\|$/.test(l)) && /^\|[\s|:-]+\|$/.test(lines[1])) {
      const cells = (l) => l.slice(1, -1).split('|').map((c) => c.trim());
      const head = cells(lines[0]);
      const rows = lines.slice(2).map(cells);
      out.push(`<div class="chart-wrap"><table class="chart">
        <thead><tr>${head.map((c) => `<th scope="col">${inline(c, esc)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r) => `<tr>${r.map((c, i) => i === 0 ? `<th scope="row">${inline(c, esc)}</th>` : `<td class="num-main">${inline(c, esc)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>`);
      continue;
    }
    out.push(`<p>${inline(lines.join(' '), esc)}</p>`);
  }
  return out.join('\n      ');
}

export function buildGuidePages(h, guides) {
  const { esc, head, FOOT, AD, crumbs, crumbsLd, write, generated, SITE } = h;
  const dateText = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  for (const gd of guides) {
    const crumbItems = [['Home', '/'], ['Kitchen', '/kitchen/'], ['Guides', '/guides/'], [gd.short || gd.title, gd.path]];
    const others = guides.filter((x) => x.slug !== gd.slug);
    const html = head({
      title: `${gd.title} | Lazy Cat Tools`,
      description: gd.description,
      path: gd.path,
      jsonld: [
        {
          '@type': 'Article', headline: gd.title, description: gd.description, datePublished: gd.date, dateModified: gd.date,
          author: { '@type': 'Person', name: 'Jake', url: `${SITE}/pages/about/` },
          publisher: { '@type': 'Organization', name: 'Lazy Cat Tools', url: SITE },
          mainEntityOfPage: SITE + gd.path,
        },
        crumbsLd(crumbItems),
      ],
    }) + `
  <main id="main-content" class="kitchen-main guide">
    ${crumbs(crumbItems)}
    <h1>${esc(gd.title)}</h1>
    <p class="byline">By <a href="/pages/about/">Jake</a> · ${dateText(gd.date)} · ${Math.max(1, Math.round(gd.words / 220))} min read</p>

    <article class="prose guide-body">
      ${renderMarkdown(gd.body, esc)}
    </article>
${AD}
    <section class="k-section" aria-labelledby="tools-h">
      <h2 id="tools-h">Tools for this</h2>
      <ul class="link-grid">
        ${gd.related.map((r) => `<li><a href="${r.href}">${esc(r.text)}</a></li>`).join('\n        ')}
      </ul>
    </section>

    <section class="k-section" aria-labelledby="more-h">
      <h2 id="more-h">More guides</h2>
      <ul class="link-grid">
        ${others.map((o) => `<li><a href="${o.path}">${esc(o.title)}</a></li>`).join('\n        ')}
      </ul>
    </section>
  </main>
` + FOOT;
    write(gd.path, html);
    generated.push(gd.path);
  }

  const crumbItems = [['Home', '/'], ['Kitchen', '/kitchen/'], ['Guides', '/guides/']];
  const hub = head({
    title: 'Baking & Measuring Guides | Lazy Cat Tools',
    description: 'Short, practical guides to measuring and converting recipes: how to measure flour, US vs metric cups, and switching a recipe to grams.',
    path: '/guides/',
    jsonld: [crumbsLd(crumbItems)],
  }) + `
  <main id="main-content" class="kitchen-main">
    ${crumbs(crumbItems)}
    <h1>Guides</h1>
    <p class="answer">Short, practical guides to measuring and converting recipes, written to go with the <a href="/kitchen/">kitchen converters</a>.</p>
    <div class="tool-list" style="margin-top:1.5rem">
      ${guides.map((gd) => `<a class="tool-feature" href="${gd.path}"><strong>${esc(gd.title)}</strong><span>${esc(gd.description)}</span></a>`).join('\n      ')}
    </div>
  </main>
` + FOOT;
  write('/guides/', hub);
  generated.push('/guides/');
}

export function guidesListHtml(guides, esc, heading = 'Guides') {
  return `<section class="k-section" aria-labelledby="guides-h">
      <h2 id="guides-h">${esc(heading)}</h2>
      <ul class="link-grid">
        ${guides.map((gd) => `<li><a href="${gd.path}">${esc(gd.title)}</a></li>`).join('\n        ')}
      </ul>
    </section>`;
}
