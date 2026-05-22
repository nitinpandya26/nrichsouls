import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../lib/auth';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { blogHtml, title, count = 6 } = await request.json().catch(() => ({}));
  if (!blogHtml?.trim() && !title?.trim()) {
    return NextResponse.json({ error: 'blogHtml or title is required' }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY?.startsWith('sk-')) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 503 });
  }

  const plainText = (blogHtml ?? title ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3000);

  const systemPrompt = `You are a visual content strategist. Generate exactly ${count} distinct image prompts for an Instagram carousel based on the article content. Each prompt should describe a standalone, visually striking image that illustrates a key concept or insight from the article. Prompts should be detailed, photorealistic or illustrative, and suitable for an AI image generator. Return ONLY valid JSON: {"prompts":["prompt 1","prompt 2",...]}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Article title: ${title ?? ''}\n\nContent:\n${plainText}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err.error?.message ?? `OpenAI error ${res.status}` }, { status: 502 });
  }

  const json = await res.json();
  let prompts;
  try {
    const parsed = JSON.parse(json.choices[0].message.content);
    prompts = parsed.prompts ?? [];
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }

  return NextResponse.json({ prompts });
}
