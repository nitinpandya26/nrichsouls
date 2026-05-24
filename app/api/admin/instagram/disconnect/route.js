import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../../lib/auth';
import { supabaseAdmin } from '../../../../../lib/supabase';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabaseAdmin.from('settings').delete().in('key', [
    'instagram_access_token',
    'instagram_user_id',
    'instagram_username',
  ]);

  return NextResponse.json({ ok: true });
}
