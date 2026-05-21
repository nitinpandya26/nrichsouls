import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabase';


const VALID_SIZES = ['1792x1024', '1024x1024', '1024x1792'];

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { prompt, size = '1792x1024', quality = 'standard' } =
    await request.json().catch(() => ({}));

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }
  if (!VALID_SIZES.includes(size)) {
    return NextResponse.json({ error: `size must be one of: ${VALID_SIZES.join(', ')}` }, { status: 400 });
  }
  if (!process.env.OPENAI_API_KEY?.startsWith('sk-')) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured in .env.local' }, { status: 503 });
  }

  // Generate with DALL-E 3 (b64_json so we can re-host it permanently)
  const dalleRes = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt.trim(),
      n: 1,
      size,
      quality,
      response_format: 'b64_json',
    }),
  });

  if (!dalleRes.ok) {
    const err = await dalleRes.json().catch(() => ({}));
    return NextResponse.json({ error: err.error?.message ?? `OpenAI error ${dalleRes.status}` }, { status: 502 });
  }

  const dalle = await dalleRes.json();
  const b64 = dalle.data[0].b64_json;
  const revisedPrompt = dalle.data[0].revised_prompt ?? prompt;
  const buffer = Buffer.from(b64, 'base64');

  // Upload to Supabase Storage for a permanent URL
  const fileName = `dalle-${Date.now()}.png`;
  await supabaseAdmin.storage
    .createBucket('images', { public: true, fileSizeLimit: 20 * 1024 * 1024 })
    .catch(() => {});

  const { data, error } = await supabaseAdmin.storage
    .from('images')
    .upload(fileName, buffer, { contentType: 'image/png', upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabaseAdmin.storage.from('images').getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl, revisedPrompt });
}
