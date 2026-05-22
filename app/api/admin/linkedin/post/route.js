import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../../lib/auth';
import { supabaseAdmin } from '../../../../../lib/supabase';

async function uploadImageToLinkedIn(token, personUrn, imageUrl) {
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
  const arrayBuffer = await imgRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const initRes = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': '202304',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({ initializeUploadRequest: { owner: personUrn } }),
  });

  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    throw new Error(err.message ?? `LinkedIn initializeUpload error ${initRes.status}`);
  }

  const initData = await initRes.json();
  const { uploadUrl, image: imageUrn } = initData.value;

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: buffer,
  });

  if (!putRes.ok) throw new Error(`LinkedIn image upload PUT error ${putRes.status}`);

  return imageUrn;
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { text, imageUrl } = await request.json().catch(() => ({}));
  if (!text?.trim()) return NextResponse.json({ error: 'text is required' }, { status: 400 });

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

  let imageUrn = null;
  if (imageUrl?.trim()) {
    try {
      imageUrn = await uploadImageToLinkedIn(s.linkedin_access_token, s.linkedin_person_urn, imageUrl.trim());
    } catch (e) {
      return NextResponse.json({ error: `Image upload failed: ${e.message}` }, { status: 502 });
    }
  }

  const postBody = {
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
  };

  if (imageUrn) {
    postBody.content = { media: { id: imageUrn } };
  }

  const liRes = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${s.linkedin_access_token}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': '202304',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postBody),
  });

  if (!liRes.ok) {
    const err = await liRes.json().catch(() => ({}));
    const msg = err.message ?? err.error ?? `LinkedIn API error ${liRes.status}`;
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const postId = liRes.headers.get('x-linkedin-id');
  return NextResponse.json({ ok: true, postId });
}
