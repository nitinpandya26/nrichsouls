import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabase';

function requireAdmin(session) {
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

// GET /api/admin/ideas — list all saved ideas
export async function GET() {
  const session = await getServerSession(authOptions);
  const guard = requireAdmin(session);
  if (guard) return guard;

  const { data, error } = await supabaseAdmin
    .from('ideas')
    .select('id,title,raw_idea,category,tone,ai_provider,status,post_id,created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ideas: data ?? [] });
}

// POST /api/admin/ideas — save a new idea (with generated content)
export async function POST(request) {
  const session = await getServerSession(authOptions);
  const guard = requireAdmin(session);
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  if (!body?.raw_idea) {
    return NextResponse.json({ error: 'raw_idea is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('ideas')
    .insert({
      raw_idea:           body.raw_idea,
      title:              body.title ?? null,
      category:           body.category ?? 'ai-tech-automation',
      tone:               body.tone ?? 'professional',
      ai_provider:        body.ai_provider ?? 'openai',
      generated_blog:     body.generated_blog ?? null,
      generated_linkedin: body.generated_linkedin ?? null,
      generated_twitter:  body.generated_twitter ?? null,
      generated_instagram:body.generated_instagram ?? null,
      status:             'draft',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ idea: data }, { status: 201 });
}
