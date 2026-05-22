import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../../lib/auth';
import { supabaseAdmin } from '../../../../../lib/supabase';

function requireAdmin(session) {
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

// GET /api/admin/ideas/[id]
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  const guard = requireAdmin(session);
  if (guard) return guard;

  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('ideas')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ idea: data });
}

// PATCH /api/admin/ideas/[id] — update generated content or status
export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  const guard = requireAdmin(session);
  if (guard) return guard;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const allowed = [
    'title', 'raw_idea', 'category', 'tone', 'ai_provider',
    'generated_blog', 'generated_linkedin', 'generated_twitter', 'generated_instagram',
    'cover_image', 'status', 'post_id',
  ];
  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('ideas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ idea: data });
}

// DELETE /api/admin/ideas/[id]
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  const guard = requireAdmin(session);
  if (guard) return guard;

  const { id } = await params;
  const { error } = await supabaseAdmin.from('ideas').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
