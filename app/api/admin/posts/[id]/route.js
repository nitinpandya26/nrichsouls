import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../../lib/auth';
import { supabaseAdmin } from '../../../../../lib/supabase';

function requireAdmin(session) {
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

// GET /api/admin/posts/[id] — fetch single post (including drafts)
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  const guard = requireAdmin(session);
  if (guard) return guard;

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  return NextResponse.json({ post: data });
}

// PATCH /api/admin/posts/[id] — update post fields (including publish toggle)
export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  const guard = requireAdmin(session);
  if (guard) return guard;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const updates = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.excerpt !== undefined) updates.excerpt = body.excerpt;
  if (body.content !== undefined) updates.content = body.content;
  if (body.category !== undefined) updates.category = body.category;
  if (body.date !== undefined) updates.date = body.date;
  if (body.readTime !== undefined) updates.read_time = body.readTime;
  if (body.coverImage !== undefined) updates.cover_image = body.coverImage;
  if (body.published !== undefined) {
    updates.published = body.published;
    updates.status = body.published ? 'published' : 'draft';
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('posts')
    .update(updates)
    .eq('id', id)
    .select('slug,published')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Revalidate the affected pages so changes appear immediately
  revalidatePath(`/blog/${data.slug}`);
  revalidatePath('/blog');
  revalidatePath('/');

  return NextResponse.json({ ok: true, post: data });
}

// DELETE /api/admin/posts/[id]
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  const guard = requireAdmin(session);
  if (guard) return guard;

  const { id } = await params;

  const { data: post } = await supabaseAdmin
    .from('posts')
    .select('slug')
    .eq('id', id)
    .single();

  const { error } = await supabaseAdmin
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (post?.slug) {
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath('/blog');
    revalidatePath('/');
  }

  return NextResponse.json({ ok: true });
}
