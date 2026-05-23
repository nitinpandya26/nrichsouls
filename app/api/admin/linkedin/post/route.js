import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../../lib/auth';
import { supabaseAdmin } from '../../../../../lib/supabase';

const LI_VERSION = '202604';
const LI_HEADERS = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  'LinkedIn-Version': LI_VERSION,
  'X-Restli-Protocol-Version': '2.0.0',
});

async function uploadImageToLinkedIn(token, personUrn, imageUrl) {
  // 1. Fetch image binary
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
  const buffer = Buffer.from(await imgRes.arrayBuffer());

  // 2. Initialize upload
  const initRes = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
    method: 'POST',
    headers: LI_HEADERS(token),
    body: JSON.stringify({ initializeUploadRequest: { owner: personUrn } }),
  });
  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    throw new Error(err.message ?? err.error ?? `initializeUpload ${initRes.status}`);
  }
  const { value: { uploadUrl, image: imageUrn } } = await initRes.json();

  // 3. Upload binary
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: buffer,
  });
  if (!putRes.ok) throw new Error(`Image PUT failed: ${putRes.status}`);

  // 4. Poll until LinkedIn marks image AVAILABLE (up to 10s)
  const encodedUrn = encodeURIComponent(imageUrn);
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const statusRes = await fetch(`https://api.linkedin.com/rest/images/${encodedUrn}`, {
      headers: LI_HEADERS(token),
    });
    if (statusRes.ok) {
      const { status } = await statusRes.json();
      if (status === 'AVAILABLE') break;
    }
  }

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

  // Upload image if provided
  let imageUrn = null;
  if (imageUrl?.trim()) {
    try {
      imageUrn = await uploadImageToLinkedIn(s.linkedin_access_token, s.linkedin_person_urn, imageUrl.trim());
    } catch (e) {
      return NextResponse.json({ error: `Image upload failed: ${e.message}` }, { status: 502 });
    }
  }

  // Build post body
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
    headers: LI_HEADERS(s.linkedin_access_token),
    body: JSON.stringify(postBody),
  });

  if (!liRes.ok) {
    const err = await liRes.json().catch(() => ({}));
    const msg = err.message ?? err.error ?? JSON.stringify(err);
    return NextResponse.json({ error: `LinkedIn post failed (${liRes.status}): ${msg}` }, { status: 502 });
  }

  const postId = liRes.headers.get('x-linkedin-id');
  return NextResponse.json({ ok: true, postId });
}
