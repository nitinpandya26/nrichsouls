import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../../lib/auth';
import { supabaseAdmin } from '../../../../../lib/supabase';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .in('key', ['instagram_access_token', 'instagram_user_id', 'instagram_username']);

  const s = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));

  return NextResponse.json({
    connected: !!(s.instagram_access_token && s.instagram_user_id),
    userId: s.instagram_user_id ?? null,
    username: s.instagram_username ?? null,
  });
}
