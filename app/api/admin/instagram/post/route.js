import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../../lib/auth';
import { supabaseAdmin } from '../../../../../lib/supabase';

const IG_BASE = 'https://graph.facebook.com/v21.0';

async function getCredentials() {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .in('key', ['instagram_access_token', 'instagram_user_id']);
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { caption, imageUrl } = await request.json().catch(() => ({}));
  if (!imageUrl?.trim()) return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });

  const s = await getCredentials();
  if (!s.instagram_access_token || !s.instagram_user_id) {
    return NextResponse.json(
      { error: 'Instagram not connected. Go to Settings → Instagram to connect.' },
      { status: 503 }
    );
  }

  const token = s.instagram_access_token;
  const userId = s.instagram_user_id;

  // Step 1: Create media container
  const containerRes = await fetch(`${IG_BASE}/${userId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl.trim(),
      caption: caption?.trim() ?? '',
      access_token: token,
    }),
  });
  if (!containerRes.ok) {
    const err = await containerRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: `Create container failed (${containerRes.status}): ${err.error?.message ?? JSON.stringify(err)}` },
      { status: 502 }
    );
  }
  const { id: creationId } = await containerRes.json();

  // Step 2: Publish
  const publishRes = await fetch(`${IG_BASE}/${userId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: creationId, access_token: token }),
  });
  if (!publishRes.ok) {
    const err = await publishRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: `Publish failed (${publishRes.status}): ${err.error?.message ?? JSON.stringify(err)}` },
      { status: 502 }
    );
  }
  const { id: postId } = await publishRes.json();

  return NextResponse.json({ ok: true, postId });
}
