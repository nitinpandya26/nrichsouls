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
    .sort((a, b) => new Date(b.date) - new Date(a.date));
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
