/**
 * One-time script to import WordPress XML export into content/posts/*.md files.
 * Run with: node scripts/import-wp.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xmlPath = path.join(
  __dirname,
  '..',
  '..',
  'nrichsouls.WordPress.2026-04-25.xml'
);
const outputDir = path.join(__dirname, '..', 'content', 'posts');

if (!fs.existsSync(xmlPath)) {
  console.error('XML file not found at:', xmlPath);
  process.exit(1);
}

const xml = fs.readFileSync(xmlPath, 'utf-8');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Extract all <item> blocks
const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

function extractTag(text, tag) {
  const escaped = tag.replace(':', '\\:');
  const regex = new RegExp(`<${escaped}[^>]*>([^<]*)<\\/${escaped}>`);
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function extractCDATA(text, tag) {
  const escaped = tag.replace(':', '\\:');
  const regex = new RegExp(
    `<${escaped}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${escaped}>`
  );
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#[0-9]+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calcReadTime(html) {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === '0000-00-00 00:00:00') return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeYaml(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ').trim();
}

let count = 0;
let skipped = 0;

for (const match of itemMatches) {
  const item = match[1];

  const postType =
    extractCDATA(item, 'wp:post_type') || extractTag(item, 'wp:post_type');
  const status =
    extractCDATA(item, 'wp:status') || extractTag(item, 'wp:status');

  if (postType !== 'post' || status !== 'publish') {
    skipped++;
    continue;
  }

  const title =
    extractCDATA(item, 'title') ||
    extractTag(item, 'title') ||
    'Untitled';
  let slug =
    extractCDATA(item, 'wp:post_name') ||
    extractTag(item, 'wp:post_name') ||
    toSlug(title);

  // Remove any trailing slashes that WordPress might add
  slug = slug.replace(/\/$/, '');
  if (!slug) slug = toSlug(title);

  const postDate =
    extractCDATA(item, 'wp:post_date') ||
    extractTag(item, 'wp:post_date') ||
    '';
  const content = extractCDATA(item, 'content:encoded');
  let excerpt = extractCDATA(item, 'excerpt:encoded');

  if (!excerpt && content) {
    excerpt = stripHtml(content).substring(0, 220).trim();
    if (excerpt.length === 220) excerpt += '...';
  }

  // Category: prefer nicename attribute (already the slug)
  const catMatch = item.match(/domain="category"\s+nicename="([^"]+)"/);
  const category = catMatch ? catMatch[1] : 'uncategorized';

  const readTime = content ? calcReadTime(content) : '3 min read';
  const date = formatDate(postDate);

  const mdContent = `---
title: "${escapeYaml(title)}"
slug: "${slug}"
excerpt: "${escapeYaml(excerpt)}"
category: "${category}"
date: "${date}"
readTime: "${readTime}"
---

${content}
`;

  const fileName = `${slug}.md`;
  fs.writeFileSync(path.join(outputDir, fileName), mdContent, 'utf-8');
  console.log(`  ✓  ${fileName}`);
  count++;
}

console.log(`\nDone — created ${count} posts, skipped ${skipped} non-post items.`);
