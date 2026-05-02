/**
 * Syncs markdown posts into the Notion database with full block structure.
 * Archives all existing pages first, then recreates with:
 *  - Notion page cover (banner image from WordPress CDN)
 *  - Cover image as first content block
 *  - Structured HTML blocks: headings, lists, inline formatting, inline images
 *
 * Run with: node scripts/sync-to-notion.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from '@notionhq/client';
import { parse } from 'node-html-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local so the script works without pre-setting env vars
try {
  const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
  for (const line of envFile.split('\n')) {
    const eq = line.indexOf('=');
    if (eq === -1 || line.trimStart().startsWith('#')) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^"(.*)"$/, '$1');
    if (key && !process.env[key]) process.env[key] = val;
  }
} catch { /* .env.local optional if vars already set */ }

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const POSTS_DIR  = path.join(__dirname, '..', 'content', 'posts');
const XML_PATH   = path.join(__dirname, '..', '..', 'nrichsouls.WordPress.2026-04-25.xml');

// Base URL of the deployed site — images live at SITE_BASE + coverImage (e.g. /images/slug.png)
const SITE_BASE = 'https://nrichsouls.in';

const CATEGORY_TO_TAG = {
  'ai-tech-automation':        'AI & Tech',
  'career-growth-remote-work': 'Career Growth',
  'health-wellness':           'Health & Wellness',
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── WordPress XML — build slug → cover image URL map ─────────────────────────

function getTag(tag, item) {
  const open  = `<${tag}`;
  const close = `</${tag}>`;
  const s = item.indexOf(open);
  if (s === -1) return '';
  const bodyStart = item.indexOf('>', s) + 1;
  const bodyEnd   = item.indexOf(close, bodyStart);
  if (bodyEnd === -1) return '';
  let val = item.slice(bodyStart, bodyEnd);
  const c = val.indexOf('<![CDATA[');
  if (c !== -1) { const ce = val.indexOf(']]>', c); val = ce !== -1 ? val.slice(c + 9, ce) : val.slice(c + 9); }
  return val.trim();
}

function buildCoverMap() {
  if (!fs.existsSync(XML_PATH)) {
    console.warn('WordPress XML not found — no cover images will be set in Notion.');
    return {};
  }
  const xml = fs.readFileSync(XML_PATH, 'utf-8');
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1]);

  // attachment id → CDN url
  const attachments = {};
  for (const item of items) {
    if (getTag('wp:post_type', item) !== 'attachment') continue;
    const id  = getTag('wp:post_id', item);
    const url = getTag('wp:attachment_url', item);
    if (id && url) attachments[id] = url;
  }

  // post slug → cover url (keyed by both raw WP slug and decoded version)
  const map = {};
  for (const item of items) {
    if (getTag('wp:post_type', item) !== 'post')   continue;
    if (getTag('wp:status',    item) !== 'publish') continue;
    const wpSlug = getTag('wp:post_name', item);
    if (!wpSlug) continue;
    let thumbId = null;
    for (const pm of item.matchAll(/<wp:postmeta>([\s\S]*?)<\/wp:postmeta>/g)) {
      if (getTag('wp:meta_key', pm[1]) === '_thumbnail_id') {
        thumbId = getTag('wp:meta_value', pm[1]);
        break;
      }
    }
    const url = thumbId ? (attachments[thumbId] || null) : null;
    map[wpSlug]                      = url;   // encoded slug  (%e2%ad%90star-...)
    map[decodeURIComponent(wpSlug)]  = url;   // decoded slug  (⭐star-...)
  }
  return map;
}

// ── Frontmatter ───────────────────────────────────────────────────────────────

function parseFrontmatter(raw) {
  // Strip UTF-8 BOM if present
  const clean = raw.replace(/^﻿/, '');
  const match = clean.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { _body: clean };
  const data = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^"(.*)"$/, '$1');
    data[key] = val;
  }
  const bodyMatch = clean.match(/^---[\s\S]*?---\n([\s\S]*)$/);
  data._body = bodyMatch ? bodyMatch[1].trim() : '';
  return data;
}

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
}

// ── Inline rich_text builder ──────────────────────────────────────────────────

function nodeToRichText(node, ann = {}) {
  const segs = [];
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      const text = child.rawText;
      if (!text) continue;
      const seg = {
        type: 'text',
        text: { content: text },
        annotations: {
          bold: !!ann.bold, italic: !!ann.italic, code: !!ann.code,
          strikethrough: !!ann.strikethrough, underline: false, color: 'default',
        },
      };
      if (ann.href) seg.text.link = { url: ann.href };
      segs.push(seg);
    } else if (child.nodeType === 1) {
      const tag = child.tagName?.toLowerCase();
      if (!tag) continue;
      if (tag === 'br') {
        segs.push({ type: 'text', text: { content: '\n' },
          annotations: { bold: false, italic: false, code: false, strikethrough: false, underline: false, color: 'default' } });
        continue;
      }
      const next = { ...ann };
      if (tag === 'strong' || tag === 'b')          next.bold = true;
      if (tag === 'em'     || tag === 'i')           next.italic = true;
      if (tag === 'code'   || tag === 'kbd')         next.code = true;
      if (tag === 's' || tag === 'del' || tag === 'strike') next.strikethrough = true;
      if (tag === 'a') { const h = child.getAttribute('href'); if (h) next.href = h; }
      segs.push(...nodeToRichText(child, next));
    }
  }
  return segs;
}

function mergeSegs(segs) {
  if (!segs.length) return segs;
  const out = [{ ...segs[0], text: { ...segs[0].text } }];
  for (let i = 1; i < segs.length; i++) {
    const prev = out[out.length - 1];
    const curr = segs[i];
    if (
      JSON.stringify(prev.annotations) === JSON.stringify(curr.annotations) &&
      JSON.stringify(prev.text.link)   === JSON.stringify(curr.text.link)
    ) {
      prev.text.content += curr.text.content;
    } else {
      out.push({ ...curr, text: { ...curr.text } });
    }
  }
  return out;
}

function splitLong(segs) {
  const out = [];
  for (const seg of segs) {
    let s = seg.text.content;
    while (s.length > 2000) { out.push({ ...seg, text: { ...seg.text, content: s.slice(0, 2000) } }); s = s.slice(2000); }
    if (s) out.push({ ...seg, text: { ...seg.text, content: s } });
  }
  return out;
}

function buildRichText(node) {
  return splitLong(mergeSegs(nodeToRichText(node)));
}

function makeBlock(type, rt) {
  return { object: 'block', type, [type]: { rich_text: rt } };
}

function toAbsoluteUrl(src) {
  if (!src) return null;
  const clean = src.split('?')[0];
  if (/^https?:\/\//.test(clean)) return clean;
  if (clean.startsWith('/')) return `${SITE_BASE}${clean}`;
  return null;
}

function imageBlock(src, altOrCaption) {
  const url = toAbsoluteUrl(src);
  if (!url) return null;
  return {
    object: 'block', type: 'image',
    image: {
      type: 'external', external: { url },
      caption: altOrCaption
        ? [{ type: 'text', text: { content: altOrCaption.slice(0, 2000) } }]
        : [],
    },
  };
}

// ── Block builder ─────────────────────────────────────────────────────────────

function elementToBlocks(el) {
  if (!el || el.nodeType !== 1) return [];
  const tag = el.tagName?.toLowerCase();
  if (!tag) return [];
  const blocks = [];

  switch (tag) {
    case 'h1': { const rt = buildRichText(el); if (rt.length) blocks.push(makeBlock('heading_1', rt)); break; }
    case 'h2': { const rt = buildRichText(el); if (rt.length) blocks.push(makeBlock('heading_2', rt)); break; }
    case 'h3': case 'h4': { const rt = buildRichText(el); if (rt.length) blocks.push(makeBlock('heading_3', rt)); break; }
    case 'h5': case 'h6': { const rt = buildRichText(el); if (rt.length) blocks.push(makeBlock('paragraph', rt)); break; }
    case 'p': {
      const img = el.querySelector('img');
      if (img && !el.text.trim()) {
        blocks.push(...elementToBlocks(img));
      } else {
        const rt = buildRichText(el);
        if (rt.length) blocks.push(makeBlock('paragraph', rt));
      }
      break;
    }
    case 'ul': {
      for (const li of el.childNodes.filter(n => n.tagName?.toLowerCase() === 'li')) {
        const rt = buildRichText(li);
        if (rt.length) blocks.push(makeBlock('bulleted_list_item', rt));
      }
      break;
    }
    case 'ol': {
      for (const li of el.childNodes.filter(n => n.tagName?.toLowerCase() === 'li')) {
        const rt = buildRichText(li);
        if (rt.length) blocks.push(makeBlock('numbered_list_item', rt));
      }
      break;
    }
    case 'blockquote': {
      const paras = el.querySelectorAll('p');
      if (paras.length) {
        for (const p of paras) { const rt = buildRichText(p); if (rt.length) blocks.push(makeBlock('quote', rt)); }
      } else {
        const rt = buildRichText(el); if (rt.length) blocks.push(makeBlock('quote', rt));
      }
      break;
    }
    case 'pre': {
      const codeEl = el.querySelector('code');
      const raw = (codeEl || el).rawText.trim();
      if (raw) blocks.push({ object: 'block', type: 'code', code: { rich_text: [{ type: 'text', text: { content: raw.slice(0, 2000) } }], language: 'plain text' } });
      break;
    }
    case 'hr': {
      blocks.push({ object: 'block', type: 'divider', divider: {} });
      break;
    }
    case 'img': {
      const src = el.getAttribute('src');
      const alt = el.getAttribute('alt') || '';
      const blk = src ? imageBlock(src, alt) : null;
      if (blk) blocks.push(blk);
      break;
    }
    case 'figure': {
      const img = el.querySelector('img');
      if (img) {
        const src = img.getAttribute('src');
        const cap = el.querySelector('figcaption')?.text?.trim() || img.getAttribute('alt') || '';
        const blk = src ? imageBlock(src, cap) : null;
        if (blk) blocks.push(blk);
      }
      break;
    }
    case 'table': break;
    case 'div': case 'section': case 'article': {
      for (const child of el.childNodes) {
        if (child.nodeType === 1) blocks.push(...elementToBlocks(child));
        else if (child.nodeType === 3 && child.rawText.trim()) {
          blocks.push(makeBlock('paragraph', [{ type: 'text', text: { content: child.rawText.trim().slice(0, 2000) }, annotations: { bold: false, italic: false, code: false, strikethrough: false, underline: false, color: 'default' } }]));
        }
      }
      break;
    }
    default: break;
  }
  return blocks;
}

function htmlToBlocks(html) {
  if (!html?.trim()) return [];
  const cleaned = html.replace(/<!--\s*\/?wp:[^>]*-->/g, '');
  const root    = parse(cleaned);
  const blocks  = [];
  for (const child of root.childNodes) {
    if (child.nodeType === 1) {
      blocks.push(...elementToBlocks(child));
    } else if (child.nodeType === 3 && child.rawText.trim()) {
      blocks.push(makeBlock('paragraph', [{ type: 'text', text: { content: child.rawText.trim().slice(0, 2000) }, annotations: { bold: false, italic: false, code: false, strikethrough: false, underline: false, color: 'default' } }]));
    }
  }
  return blocks;
}

// ── Notion helpers ────────────────────────────────────────────────────────────

async function archiveAllPages() {
  console.log('Archiving existing Notion pages...');
  let cursor, count = 0;
  do {
    const res = await notion.databases.query({ database_id: DATABASE_ID, start_cursor: cursor, page_size: 100 });
    for (const page of res.results) {
      await notion.pages.update({ page_id: page.id, archived: true });
      count++;
      await sleep(300);
    }
    cursor = res.next_cursor;
  } while (cursor);
  console.log(`Archived ${count} pages\n`);
}

async function createNotionPage(post, coverUrl, allBlocks) {
  const tag     = CATEGORY_TO_TAG[post.category];
  const isoDate = parseDate(post.date);

  // If we have a cover image, insert it as the first content block too
  const contentBlocks = coverUrl
    ? [imageBlock(coverUrl, post.title), ...allBlocks]
    : allBlocks;

  const createPayload = {
    parent: { database_id: DATABASE_ID },
    properties: {
      Title:    { title:     [{ text: { content: (post.title || 'Untitled').slice(0, 2000) } }] },
      Slug:     { rich_text: [{ text: { content: post.slug } }] },
      Excerpt:  { rich_text: [{ text: { content: (post.excerpt || '').slice(0, 2000) } }] },
      Published: { checkbox: true },
      ...(tag      && { Tags: { multi_select: [{ name: tag }] } }),
      ...(isoDate  && { Date: { date: { start: isoDate } } }),
    },
    children: contentBlocks.slice(0, 100),
  };

  // Set Notion page cover (banner image at top of page)
  if (coverUrl) {
    const coverAbs = toAbsoluteUrl(coverUrl);
    if (coverAbs) createPayload.cover = { type: 'external', external: { url: coverAbs } };
  }

  const page = await notion.pages.create(createPayload);

  // Append remaining blocks in batches of 100
  let rest = contentBlocks.slice(100);
  while (rest.length > 0) {
    await notion.blocks.children.append({ block_id: page.id, children: rest.slice(0, 100) });
    rest = rest.slice(100);
    await sleep(350);
  }

  return page;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const coverMap = buildCoverMap();
console.log(`Cover image URLs loaded: ${Object.values(coverMap).filter(Boolean).length / 2} posts\n`);

await archiveAllPages();

const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
console.log(`Syncing ${files.length} posts with full structure + cover images...\n`);

let created = 0, failed = 0;

for (const file of files) {
  const raw  = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
  const data = parseFrontmatter(raw);

  const filename = file.replace(/\.md$/, '');           // e.g. %e2%ad%90star-...
  const slug     = data.slug || filename;               // cleaned slug from frontmatter

  // Prefer the local public image (accessible at SITE_BASE after deployment),
  // fall back to WordPress CDN URL from the XML export
  const localCover = data.coverImage ? `${SITE_BASE}${data.coverImage}` : null;
  const wpCover    = coverMap[slug] || coverMap[filename] || coverMap[decodeURIComponent(filename)] || null;
  const coverUrl   = localCover || wpCover;

  const title    = data.title || slug;
  const bodyHtml = data._body || '';

  let blocks = [];
  try {
    blocks = htmlToBlocks(bodyHtml);
  } catch (err) {
    console.warn(`  ⚠ Parse error for ${slug}: ${err.message}`);
  }

  try {
    await createNotionPage({ ...data, slug, title }, coverUrl, blocks);
    const imgInfo = coverUrl ? '+ cover' : 'no cover';
    console.log(`  ✓ ${title}  (${blocks.length} blocks, ${imgInfo})`);
    created++;
    await sleep(350);
  } catch (err) {
    console.log(`  ✗ ${slug}: ${err.message}`);
    failed++;
  }
}

console.log(`\n─────────────────────────────────`);
console.log(`Created : ${created}`);
console.log(`Failed  : ${failed}`);
console.log(`─────────────────────────────────`);
