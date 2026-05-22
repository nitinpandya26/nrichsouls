import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../../../lib/auth';
import { supabaseAdmin } from '../../../../../../lib/supabase';

// POST /api/admin/ideas/[id]/publish
// Creates an UNPUBLISHED draft post from the idea's blog content.
// Returns { ok, postId, slug } — caller should redirect to /admin/posts/[postId]/edit
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data: idea, error: ideaErr } = await supabaseAdmin
    .from('ideas')
    .select('*')
    .eq('id', id)
    .single();

  if (ideaErr || !idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  if (!idea.generated_blog) return NextResponse.json({ error: 'No blog content to push' }, { status: 400 });

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
    const fallbackSlug = `${slug}-${Date.now()}`;
    const { data: post, error: postErr } = await supabaseAdmin
      .from('posts')
      .insert({
        title,
        slug:        fallbackSlug,
        excerpt:     idea.raw_idea?.slice(0, 200) ?? '',
        content:     idea.generated_blog,
        category:    idea.category ?? 'ai-tech-automation',
        date:        body.date ?? today,
        read_time:   body.readTime ?? '',
        cover_image: idea.cover_image ?? body.coverImage ?? '',
        published:   false,
        status:      'draft',
        source:      'cms',
      })
      .select('id,slug')
      .single();

    if (postErr) return NextResponse.json({ error: postErr.message }, { status: 500 });

    await supabaseAdmin.from('ideas').update({ post_id: post.id }).eq('id', id);
    return NextResponse.json({ ok: true, postId: post.id, slug: post.slug });
  }

  const { data: post, error: postErr } = await supabaseAdmin
    .from('posts')
    .insert({
      title,
      slug,
      excerpt:     idea.raw_idea?.slice(0, 200) ?? '',
      content:     idea.generated_blog,
      category:    idea.category ?? 'ai-tech-automation',
      date:        body.date ?? today,
      read_time:   body.readTime ?? '',
      cover_image: idea.cover_image ?? body.coverImage ?? '',
      published:   false,
      status:      'draft',
      source:      'cms',
    })
    .select('id,slug')
    .single();

  if (postErr) return NextResponse.json({ error: postErr.message }, { status: 500 });

  await supabaseAdmin.from('ideas').update({ post_id: post.id }).eq('id', id);

  return NextResponse.json({ ok: true, postId: post.id, slug: post.slug });
}
