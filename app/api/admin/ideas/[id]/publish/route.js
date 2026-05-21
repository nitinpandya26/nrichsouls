import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../../../lib/auth';
import { supabaseAdmin } from '../../../../../../lib/supabase';

// POST /api/admin/ideas/[id]/publish
// Publishes the blog variant of an idea as a live post.
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Fetch the idea
  const { data: idea, error: ideaErr } = await supabaseAdmin
    .from('ideas')
    .select('*')
    .eq('id', id)
    .single();

  if (ideaErr || !idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  if (!idea.generated_blog) return NextResponse.json({ error: 'No blog content to publish' }, { status: 400 });

  // Body can override slug, readTime, coverImage, date
  const body = await request.json().catch(() => ({}));

  const title = idea.title ?? 'Untitled';
  const slug = body.slug
    ?? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const today = new Date().toISOString().split('T')[0];

  // Check slug uniqueness
  const { data: existing } = await supabaseAdmin
    .from('posts')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `Slug "${slug}" already exists. Pass a custom slug in the request body.` },
      { status: 409 }
    );
  }

  // Create the blog post
  const { data: post, error: postErr } = await supabaseAdmin
    .from('posts')
    .insert({
      title,
      slug,
      excerpt:    idea.raw_idea.slice(0, 200),
      content:    idea.generated_blog,
      category:   idea.category ?? 'ai-tech-automation',
      date:       body.date ?? today,
      read_time:  body.readTime ?? '',
      cover_image:body.coverImage ?? '',
      published:  true,
      status:     'published',
      source:     'cms',
    })
    .select('id,slug')
    .single();

  if (postErr) return NextResponse.json({ error: postErr.message }, { status: 500 });

  // Link idea → post and mark idea as published
  await supabaseAdmin
    .from('ideas')
    .update({ post_id: post.id, status: 'published' })
    .eq('id', id);

  revalidatePath(`/blog/${post.slug}`);
  revalidatePath('/blog');
  revalidatePath('/');

  return NextResponse.json({ ok: true, slug: post.slug, postId: post.id });
}
