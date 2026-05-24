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

  const { caption, imageUrls } = await request.json().catch(() => ({}));
  if (!Array.isArray(imageUrls) || imageUrls.length < 2) {
    return NextResponse.json({ error: 'At least 2 imageUrls are required for a carousel' }, { status: 400 });
  }
  if (imageUrls.length > 10) {
    return NextResponse.json({ error: 'Maximum 10 images per carousel' }, { status: 400 });
  }

  const s = await getCredentials();
  if (!s.instagram_access_token || !s.instagram_user_id) {
    return NextResponse.json(
      { error: 'Instagram not connected. Go to Settings → Instagram to connect.' },
      { status: 503 }
    );
  }

  const token = s.instagram_access_token;
  const userId = s.instagram_user_id;

  // Step 1: Create item containers for each image
  const itemIds = [];
  for (const url of imageUrls) {
    const res = await fetch(`${IG_BASE}/${userId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token: token }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Item container failed for ${url} (${res.status}): ${err.error?.message ?? JSON.stringify(err)}` },
        { status: 502 }
      );
    }
    const { id } = await res.json();
    itemIds.push(id);
  }

  // Step 2: Create carousel container
  const carouselRes = await fetch(`${IG_BASE}/${userId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      caption: caption?.trim() ?? '',
      children: itemIds.join(','),
      access_token: token,
    }),
  });
  if (!carouselRes.ok) {
    const err = await carouselRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: `Carousel container failed (${carouselRes.status}): ${err.error?.message ?? JSON.stringify(err)}` },
      { status: 502 }
    );
  }
  const { id: carouselId } = await carouselRes.json();

  // Step 3: Publish
  const publishRes = await fetch(`${IG_BASE}/${userId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: carouselId, access_token: token }),
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
