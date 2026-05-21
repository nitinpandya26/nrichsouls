import { supabase } from './supabase';

function formatPost(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? '',
    content: row.content ?? '',
    category: row.category,
    date: row.date
      ? new Date(row.date).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : '',
    readTime: row.read_time ?? '',
    coverImage: row.cover_image ?? null,
    published: row.published,
    status: row.status,
  };
}

const LIST_COLS = 'id,title,slug,excerpt,category,date,read_time,cover_image,published,status';

export async function getAllPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select(LIST_COLS)
    .eq('published', true)
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(formatPost);
}

export async function getPostBySlug(slug) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  if (error || !data) return null;
  return formatPost(data);
}

export async function getPostsByCategory(category) {
  const { data, error } = await supabase
    .from('posts')
    .select(LIST_COLS)
    .eq('category', category)
    .eq('published', true)
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(formatPost);
}

export async function getFeaturedPosts(count = 3) {
  const { data, error } = await supabase
    .from('posts')
    .select(LIST_COLS)
    .eq('published', true)
    .order('date', { ascending: false })
    .limit(count);
  if (error) throw new Error(error.message);
  return (data ?? []).map(formatPost);
}
