import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../../lib/auth';
import { supabaseAdmin } from '../../../../../lib/supabase';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { text } = await request.json().catch(() => ({}));
  if (!text?.trim()) return NextResponse.json({ error: 'text is required' }, { status: 400 });

  // Load token + person URN from settings
  const { data } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .in('key', ['linkedin_access_token', 'linkedin_person_urn', 'linkedin_token_expires_at']);

  const s = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));

  if (!s.linkedin_access_token || !s.linkedin_person_urn) {
    return NextResponse.json(
      { error: 'LinkedIn not connected. Go to Settings → LinkedIn to connect.' },
      { status: 503 }
    );
  }
  if (s.linkedin_token_expires_at && new Date(s.linkedin_token_expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'LinkedIn token expired. Go to Settings → LinkedIn to reconnect.' },
      { status: 503 }
    );
  }

  // Post via LinkedIn Posts API (2023+)
  const liRes = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${s.linkedin_access_token}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': '202304',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: s.linkedin_person_urn,
      commentary: text.trim(),
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    }),
  });

  if (!liRes.ok) {
    const err = await liRes.json().catch(() => ({}));
    const msg = err.message ?? err.error ?? `LinkedIn API error ${liRes.status}`;
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // LinkedIn returns 201 + X-LinkedIn-Id header with the new post ID
  const postId = liRes.headers.get('x-linkedin-id');
  return NextResponse.json({ ok: true, postId });
}
