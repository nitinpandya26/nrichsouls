import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../lib/auth';

const DEFAULT_MODEL = 'anthropic:claude-sonnet-4-6';

function buildSystemPrompt(count) {
  return `You are a visual content strategist. Generate exactly ${count} distinct image prompts for an Instagram carousel based on the article content. Each prompt should describe a standalone, visually striking image that illustrates a key concept or insight from the article. Prompts should be detailed, photorealistic or illustrative, and suitable for an AI image generator. Return ONLY valid JSON with no markdown fences: {"prompts":["prompt 1","prompt 2",...]}`;
}

async function callOpenAI(systemPrompt, userContent, model) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `OpenAI error ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callAnthropic(systemPrompt, userContent, model) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Anthropic error ${res.status}`);
  }
  const data = await res.json();
  return data.content[0].text;
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { blogHtml, title, count = 6, provider = DEFAULT_MODEL } =
    await request.json().catch(() => ({}));

  if (!blogHtml?.trim() && !title?.trim()) {
    return NextResponse.json({ error: 'blogHtml or title is required' }, { status: 400 });
  }

  // provider format: 'anthropic:claude-sonnet-4-6' | 'openai:gpt-4o-mini' etc.
  const [useProvider, useModel] = provider.includes(':')
    ? provider.split(':')
    : ['openai', 'gpt-4o-mini'];

  if (useProvider === 'openai' && !process.env.OPENAI_API_KEY?.startsWith('sk-')) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 503 });
  }
  if (useProvider === 'anthropic' && !process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-')) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 503 });
  }

  const plainText = (blogHtml ?? title ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3000);

  const systemPrompt = buildSystemPrompt(count);
  const userContent = `Article title: ${title ?? ''}\n\nContent:\n${plainText}`;

  let raw;
  try {
    raw = useProvider === 'anthropic'
      ? await callAnthropic(systemPrompt, userContent, useModel)
      : await callOpenAI(systemPrompt, userContent, useModel);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }

  let prompts;
  try {
    const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
    prompts = JSON.parse(cleaned).prompts ?? [];
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }

  return NextResponse.json({ prompts });
}
