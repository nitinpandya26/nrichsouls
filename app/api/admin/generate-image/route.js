import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabase';

const MODEL_CONFIGS = {
  'gpt-image-2': {
    validSizes:    ['auto', '1024x1024', '1024x1536', '1536x1024'],
    validQualities: ['auto', 'low', 'medium', 'high'],
    hasQuality:    true,
    hasResponseFormat: false,
  },
  'gpt-image-1': {
    validSizes:    ['auto', '1024x1024', '1024x1536', '1536x1024'],
    validQualities: ['auto', 'low', 'medium', 'high'],
    hasQuality:    true,
    hasResponseFormat: false,
  },
  'dall-e-3': {
    validSizes:    ['1792x1024', '1024x1024', '1024x1792'],
    validQualities: ['standard', 'hd'],
    hasQuality:    true,
    hasResponseFormat: true,
  },
  'dall-e-2': {
    validSizes:    ['256x256', '512x512', '1024x1024'],
    validQualities: [],
    hasQuality:    false,
    hasResponseFormat: true,
  },
};

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    prompt,
    model   = 'dall-e-3',
    size    = null,
    quality = null,
  } = await request.json().catch(() => ({}));

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  const config = MODEL_CONFIGS[model];
  if (!config) {
    return NextResponse.json({ error: `Unknown model: ${model}. Valid: ${Object.keys(MODEL_CONFIGS).join(', ')}` }, { status: 400 });
  }

  const useSize = size ?? config.validSizes[0];
  if (!config.validSizes.includes(useSize)) {
    return NextResponse.json({ error: `Invalid size "${useSize}" for ${model}. Valid: ${config.validSizes.join(', ')}` }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY?.startsWith('sk-')) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 503 });
  }

  const reqBody = {
    model,
    prompt: prompt.trim(),
    n: 1,
    size: useSize,
  };

  if (config.hasQuality && quality && config.validQualities.includes(quality)) {
    reqBody.quality = quality;
  } else if (config.hasQuality && config.validQualities.length > 0) {
    reqBody.quality = config.validQualities[0];
  }

  if (config.hasResponseFormat) {
    reqBody.response_format = 'b64_json';
  }

  const dalleRes = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reqBody),
  });

  if (!dalleRes.ok) {
    const err = await dalleRes.json().catch(() => ({}));
    return NextResponse.json({ error: err.error?.message ?? `OpenAI error ${dalleRes.status}` }, { status: 502 });
  }

  const dalle = await dalleRes.json();
  const imgData = dalle.data[0];
  const b64 = imgData.b64_json;
  const revisedPrompt = imgData.revised_prompt ?? prompt;
  const buffer = Buffer.from(b64, 'base64');

  const fileName = `img-${model}-${Date.now()}.png`;
  await supabaseAdmin.storage
    .createBucket('images', { public: true, fileSizeLimit: 20 * 1024 * 1024 })
    .catch(() => {});

  const { data, error } = await supabaseAdmin.storage
    .from('images')
    .upload(fileName, buffer, { contentType: 'image/png', upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabaseAdmin.storage.from('images').getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl, revisedPrompt, model });
}
