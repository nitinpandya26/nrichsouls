import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDir = path.join(process.cwd(), 'content', 'posts');

function decodeEntities(str) {
  if (!str) return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”');
}

// Robustly convert any date string to a timestamp for sorting.
// Handles ISO (2025-07-23), "July 23, 2025", and "23 July 2025".
const MONTHS = { january:0,february:1,march:2,april:3,may:4,june:5,
  july:6,august:7,september:8,october:9,november:10,december:11 };

export function parseDateTs(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.getTime();
  // Fallback: "Month D, YYYY" or "D Month YYYY"
  const m = String(dateStr).match(/(\d+|[a-z]+)\s+(\d+|[a-z]+),?\s+(\d{4})/i);
  if (m) {
    const [, a, b, yr] = m;
    const monIdx = MONTHS[a.toLowerCase()] ?? MONTHS[b.toLowerCase()];
    const day    = isNaN(a) ? parseInt(b) : parseInt(a);
    if (monIdx !== undefined) return new Date(+yr, monIdx, day).getTime();
  }
  return 0;
}

function getPostFiles() {
  return fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'));
}

function parsePost(fileName) {
  const filePath = path.join(postsDir, fileName);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return {
    ...data,
    slug: data.slug || fileName.replace(/\.md$/, ''),
    title: decodeEntities(data.title),
    excerpt: decodeEntities(data.excerpt),
    content,
  };
}

export function getAllPosts() {
  return getPostFiles()
    .map(parsePost)
    .sort((a, b) => parseDateTs(b.date) - parseDateTs(a.date));
}

export function getPostBySlug(slug) {
  for (const fileName of getPostFiles()) {
    const post = parsePost(fileName);
    if (post.slug === slug) return post;
  }
  return null;
}

export function getPostsByCategory(category) {
  return getAllPosts().filter((p) => p.category === category);
}

export function getFeaturedPosts(count = 3) {
  return getAllPosts().slice(0, count);
}
