import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDir = path.join(process.cwd(), 'content', 'posts');

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
