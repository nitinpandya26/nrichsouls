/**
 * Migrates all Published posts from your Notion database into Supabase.
 * Skips any slug that already exists in Supabase (preserves the 40 MD posts).
 *
 * Usage:
 *   node scripts/migrate-notion-to-supabase.mjs
 *
 * Requires .env.local with:
 *   NOTION_API_KEY, NOTION_DATABASE_ID
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { Client } from '@notionhq/client';
import { createClient } from '@supabase/supabase-js';

// ── Clients ───────────────────────────────────────────────────────────────────

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Category map (mirrors lib/notion.js) ─────────────────────────────────────

const TAG_TO_CATEGORY = {
  'AI & Tech': 'ai-tech-automation',
  'AI': 'ai-tech-automation',
  'Tech': 'ai-tech-automation',
  'Automation': 'ai-tech-automation',
  'Career': 'career-growth-remote-work',
  'Career Growth': 'career-growth-remote-work',
  'Remote Work': 'career-growth-remote-work',
  'Health': 'health-wellness',
  'Health & Wellness': 'health-wellness',
  'Wellness': 'health-wellness',
};

// ── Notion helpers ────────────────────────────────────────────────────────────

function getText(richText) {
  return richText?.map((t) => t.plain_text).join('') ?? '';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderRichText(richText) {
  if (!richText?.length) return '';
  return richText.map((text) => {
    let content = escapeHtml(text.plain_text);
    const { annotations, href } = text;
    if (annotations.bold)          content = `<strong>${content}</strong>`;
    if (annotations.italic)        content = `<em>${content}</em>`;
    if (annotations.strikethrough) content = `<s>${content}</s>`;
    if (annotations.underline)     content = `<u>${content}</u>`;
    if (annotations.code)          content = `<code>${content}</code>`;
    if (href) content = `<a href="${href}" target="_blank" rel="noopener noreferrer">${content}</a>`;
    return content;
  }).join('');
}

function formatPost(page) {
  const p = page.properties;
  const title = getText(p.Title?.title) || getText(p.Name?.title) || 'Untitled';
  const slug =
    getText(p.Slug?.rich_text) ||
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const tags = p.Tags?.multi_select?.map((t) => t.name) ?? [];
  const category = tags.map((t) => TAG_TO_CATEGORY[t]).find(Boolean) ?? 'ai-tech-automation';

  const rawCover =
    p.CoverImage?.files?.[0]?.file?.url ||
    p.CoverImage?.files?.[0]?.external?.url ||
    page.cover?.external?.url ||
    page.cover?.file?.url ||
    null;

  const rawDate = p.Date?.date?.start;
  const isoDate = rawDate
    ? new Date(rawDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  return {
    id: page.id,
    title,
    slug,
    excerpt: getText(p.Excerpt?.rich_text),
    category,
    date: isoDate,
    read_time: getText(p.ReadTime?.rich_text) || '',
    cover_image: rawCover ?? '',
    published: p.Published?.checkbox ?? false,
  };
}

async function getAllNotionPages() {
  const results = [];
  let cursor;
  do {
    const res = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: { property: 'Published', checkbox: { equals: true } },
      sorts: [{ property: 'Date', direction: 'descending' }],
      page_size: 100,
      start_cursor: cursor,
    });
    results.push(...res.results);
    cursor = res.has_more ? res.next_cursor : null;
  } while (cursor);
  return results;
}

async function getAllBlocks(blockId) {
  const blocks = [];
  let cursor;
  do {
    const { results, next_cursor } = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });
    blocks.push(...results);
    cursor = next_cursor;
  } while (cursor);
  return blocks;
}

function renderBlocks(blocks) {
  let html = '';
  let listType = null;

  for (const block of blocks) {
    const { type } = block;
    const value = block[type];

    if (type !== 'bulleted_list_item' && listType === 'ul') { html += '</ul>\n'; listType = null; }
    if (type !== 'numbered_list_item' && listType === 'ol') { html += '</ol>\n'; listType = null; }

    switch (type) {
      case 'paragraph':
        html += `<p>${renderRichText(value.rich_text)}</p>\n`;
        break;
      case 'heading_1':
        html += `<h1>${renderRichText(value.rich_text)}</h1>\n`;
        break;
      case 'heading_2':
        html += `<h2>${renderRichText(value.rich_text)}</h2>\n`;
        break;
      case 'heading_3':
        html += `<h3>${renderRichText(value.rich_text)}</h3>\n`;
        break;
      case 'bulleted_list_item':
        if (listType !== 'ul') { html += '<ul>\n'; listType = 'ul'; }
        html += `<li>${renderRichText(value.rich_text)}</li>\n`;
        break;
      case 'numbered_list_item':
        if (listType !== 'ol') { html += '<ol>\n'; listType = 'ol'; }
        html += `<li>${renderRichText(value.rich_text)}</li>\n`;
        break;
      case 'quote':
        html += `<blockquote>${renderRichText(value.rich_text)}</blockquote>\n`;
        break;
      case 'code':
        html += `<pre><code class="language-${value.language || 'plaintext'}">${escapeHtml(getText(value.rich_text))}</code></pre>\n`;
        break;
      case 'divider':
        html += '<hr />\n';
        break;
      case 'image': {
        const src = value.type === 'external' ? value.external.url : value.file.url;
        const caption = value.caption?.length ? getText(value.caption) : '';
        html += `<figure><img src="${src}" alt="${escapeHtml(caption)}" style="max-width:100%;border-radius:12px;" />${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}</figure>\n`;
        break;
      }
      case 'callout': {
        const emoji = value.icon?.emoji ?? '💡';
        html += `<div class="callout"><span class="callout-icon">${emoji}</span><div>${renderRichText(value.rich_text)}</div></div>\n`;
        break;
      }
      case 'toggle':
        html += `<details><summary>${renderRichText(value.rich_text)}</summary></details>\n`;
        break;
      default:
        break;
    }
  }

  if (listType === 'ul') html += '</ul>\n';
  if (listType === 'ol') html += '</ol>\n';
  return html;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function migrate() {
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
    console.error('❌  Missing NOTION_API_KEY or NOTION_DATABASE_ID in .env.local');
    process.exit(1);
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌  Missing Supabase env vars in .env.local');
    process.exit(1);
  }

  // ── Fetch existing slugs from Supabase ──────────────────────────────────────
  console.log('\n🔍  Fetching existing slugs from Supabase…');
  const { data: existing, error: existErr } = await supabase
    .from('posts')
    .select('slug');
  if (existErr) { console.error('❌  Supabase error:', existErr.message); process.exit(1); }
  const existingSlugs = new Set((existing ?? []).map((r) => r.slug));
  console.log(`    Found ${existingSlugs.size} existing posts in Supabase\n`);

  // ── Fetch all published Notion pages ────────────────────────────────────────
  console.log('📖  Fetching published posts from Notion…');
  const pages = await getAllNotionPages();
  console.log(`    Found ${pages.length} published Notion posts\n`);

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const page of pages) {
    const meta = formatPost(page);

    if (existingSlugs.has(meta.slug)) {
      console.log(`  ↷  skip (already exists): ${meta.slug}`);
      skipped++;
      continue;
    }

    // Fetch content blocks and render to HTML
    let content = '';
    try {
      const blocks = await getAllBlocks(page.id);
      content = renderBlocks(blocks);
    } catch (e) {
      console.warn(`  ⚠  Could not fetch content for "${meta.slug}": ${e.message}`);
    }

    const { error } = await supabase.from('posts').insert({
      title:       meta.title,
      slug:        meta.slug,
      excerpt:     meta.excerpt,
      content,
      category:    meta.category,
      date:        meta.date,
      read_time:   meta.read_time,
      cover_image: meta.cover_image,
      published:   true,
      status:      'published',
      source:      'notion',
    });

    if (error) {
      console.error(`  ✗  ${meta.slug} — ${error.message}`);
      failed++;
    } else {
      console.log(`  ✓  ${meta.slug}`);
      inserted++;
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Notion → Supabase complete
  ✓ Inserted : ${inserted}
  ↷ Skipped  : ${skipped}  (already in Supabase)
  ✗ Failed   : ${failed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

migrate().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
