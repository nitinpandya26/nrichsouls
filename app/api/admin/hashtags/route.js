import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabase';

const SETTINGS_KEY = 'hashtag_groups';

async function loadGroups() {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .maybeSingle();
  if (!data?.value) return [];
  try { return JSON.parse(data.value); } catch { return []; }
}

// GET /api/admin/hashtags — list groups
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const groups = await loadGroups();
  return NextResponse.json({ groups });
}

// POST /api/admin/hashtags — replace all groups
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { groups } = await request.json().catch(() => ({}));
  if (!Array.isArray(groups)) {
    return NextResponse.json({ error: 'groups must be an array' }, { status: 400 });
  }

  // Validate each group has name + tags
  const clean = groups
    .filter((g) => g?.name?.trim() && g?.tags?.trim())
    .map((g) => ({ name: g.name.trim(), tags: g.tags.trim() }));

  await supabaseAdmin.from('settings').upsert(
    { key: SETTINGS_KEY, value: JSON.stringify(clean), updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  );

  return NextResponse.json({ groups: clean });
}
