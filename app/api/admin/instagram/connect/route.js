import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../../lib/auth';
import { supabaseAdmin } from '../../../../../lib/supabase';

const IG_BASE = 'https://graph.facebook.com/v21.0';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { accessToken, userId } = await request.json().catch(() => ({}));
  if (!accessToken?.trim() || !userId?.trim()) {
    return NextResponse.json({ error: 'accessToken and userId are required' }, { status: 400 });
  }

  // Verify the token works by fetching the IG user
  const verifyRes = await fetch(
    `${IG_BASE}/${userId.trim()}?fields=id,username&access_token=${accessToken.trim()}`
  );
  if (!verifyRes.ok) {
    const err = await verifyRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: err.error?.message ?? `Instagram verification failed (${verifyRes.status})` },
      { status: 400 }
    );
  }
  const igUser = await verifyRes.json();

  // Upsert into settings
  const rows = [
    { key: 'instagram_access_token', value: accessToken.trim() },
    { key: 'instagram_user_id',      value: igUser.id ?? userId.trim() },
    { key: 'instagram_username',     value: igUser.username ?? '' },
  ];
  for (const row of rows) {
    await supabaseAdmin.from('settings').upsert(row, { onConflict: 'key' });
  }

  return NextResponse.json({ ok: true, username: igUser.username ?? userId });
}
