import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabase';

function requireAdmin(session) {
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

// GET /api/admin/posts — list ALL posts including drafts
export async function GET(request) {
  const session = await getServerSession(authOptions);
  const guard = requireAdmin(session);
  if (guard) return guard;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  let query = supabaseAdmin
    .from('posts')
    .select('id,title,slug,excerpt,category,date,read_time,cover_image,published,status,created_at')
    .order('date', { ascending: false });

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const posts = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? '',
    category: row.category,
    date: row.date
      ? new Date(row.date).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })
      : '',
    readTime: row.read_time ?? '',
    coverImage: row.cover_image ?? null,
    published: row.published,
    status: row.status,
  }));

  return NextResponse.json({ posts });
}

// POST /api/admin/posts — create a new draft post
export async function POST(request) {
  const session = await getServerSession(authOptions);
  const guard = requireAdmin(session);
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.slug || !body?.category) {
    return NextResponse.json({ error: 'title, slug, and category are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert({
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt ?? '',
      content: body.content ?? '',
      category: body.category,
      date: body.date ?? new Date().toISOString().split('T')[0],
      read_time: body.readTime ?? '',
      cover_image: body.coverImage ?? '',
      published: body.published ?? false,
      status: body.published ? 'published' : 'draft',
      source: 'cms',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A post with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data }, { status: 201 });
}
