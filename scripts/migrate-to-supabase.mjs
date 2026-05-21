/**
 * One-time migration: reads all content/posts/*.md files and inserts them
 * into your Supabase `posts` table.
 *
 * Usage:
 *   node scripts/migrate-to-supabase.mjs
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Date helpers ──────────────────────────────────────────────────────────────

const MONTHS = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

function toISODate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  // "Month D, YYYY" or "D Month YYYY"
  const m = String(dateStr).match(/([a-z]+)\s+(\d+),?\s+(\d{4})/i);
  if (m) {
    const [, mon, day, yr] = m;
    const idx = MONTHS[mon.toLowerCase()];
    if (idx !== undefined) return new Date(+yr, idx, +day).toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

// ── HTML decode (matches existing lib/posts.js) ───────────────────────────────

function decodeEntities(str) {
  if (!str) return str ?? '';
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#8211;/g, '–').replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘').replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“').replace(/&#8221;/g, '”');
}

// ── Parse a single .md file ───────────────────────────────────────────────────

function parseFile(fileName) {
  const raw = fs.readFileSync(path.join(POSTS_DIR, fileName), 'utf-8');
  const { data, content } = matter(raw);
  return {
    title: decodeEntities(data.title ?? 'Untitled'),
    slug: data.slug ?? decodeURIComponent(fileName.replace(/\.md$/, '')),
    excerpt: decodeEntities(data.excerpt ?? ''),
    content: content ?? '',
    category: data.category ?? 'ai-tech-automation',
    date: toISODate(data.date),
    read_time: data.readTime ?? '',
    cover_image: data.coverImage ?? '',
    published: true,
    status: 'published',
    source: 'migrated',
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function migrate() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  console.log(`\n📂  Found ${files.length} markdown posts to migrate\n`);

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const fileName of files) {
    let post;
    try {
      post = parseFile(fileName);
    } catch (e) {
      console.error(`  ✗  Parse error: ${fileName} — ${e.message}`);
      failed++;
      continue;
    }

    const { error } = await supabase
      .from('posts')
      .upsert(post, { onConflict: 'slug', ignoreDuplicates: false });

    if (error) {
      console.error(`  ✗  ${post.slug} — ${error.message}`);
      failed++;
    } else {
      console.log(`  ✓  ${post.slug}`);
      inserted++;
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Migration complete
  ✓ Upserted : ${inserted}
  ✗ Failed   : ${failed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

migrate().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
