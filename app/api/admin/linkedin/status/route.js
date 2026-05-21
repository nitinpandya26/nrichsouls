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
    .in('key', ['linkedin_person_urn', 'linkedin_person_name', 'linkedin_token_expires_at']);

  const byKey = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));

  const hasToken = !!byKey.linkedin_person_urn;
  const expired = hasToken && byKey.linkedin_token_expires_at
    ? new Date(byKey.linkedin_token_expires_at) < new Date()
    : false;

  return NextResponse.json({
    connected: hasToken && !expired,
    expired: hasToken && expired,
    name: byKey.linkedin_person_name ?? null,
    expiresAt: byKey.linkedin_token_expires_at ?? null,
  });
}
