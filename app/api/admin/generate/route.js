import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../lib/auth';


const CATEGORY_NAMES = {
  'ai-tech-automation': 'AI, Tech & Automation',
  'career-growth-remote-work': 'Career Growth & Remote Work',
  'health-wellness': 'Health & Wellness',
};

function buildPrompt(idea, category, tone) {
  const catName = CATEGORY_NAMES[category] ?? category;
  return `You are a professional content creator for NrichSouls — a blog covering AI & Tech, Career Growth, and Health & Wellness. The brand voice is practical, evidence-based, slightly personal, zero fluff.

CATEGORY: ${catName}
TONE: ${tone}
IDEA: ${idea}

Generate platform-optimised content. Return ONLY valid JSON — no markdown fences, no explanation, just the raw JSON object.

{
  "title": "compelling, specific blog post title (no clickbait)",
  "blog": "<full HTML article>",
  "linkedin": "<LinkedIn post text>",
  "twitter": "<Twitter/X thread>",
  "instagram": "<Instagram caption>"
}

BLOG rules:
- Use <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags only — no <html>/<body>
- Engaging hook paragraph (no "In today's world…")
- 5-6 sections, each with a clear H2 heading
- Practical, numbered or bulleted takeaways where suitable
- Closing paragraph with a clear call to action
- 900–1100 words total

LINKEDIN rules:
- PLAIN TEXT ONLY — absolutely no HTML tags (<strong>, <em>, <ul>, <li>, etc.)
- First line = strong hook (no "I'm excited to share…" or "Thrilled to announce…")
- Personal insight or contrarian angle on the idea
- 3–4 bullet takeaways using the • character (not HTML lists)
- End with a thought-provoking question for comments
- 200–280 words
- 4–5 relevant hashtags on the last line

TWITTER/X rules:
- PLAIN TEXT ONLY — absolutely no HTML tags
- Thread of exactly 7 tweets
- Tweet 1: punchy hook that makes people stop scrolling, NO numbers
- Tweets 2–6: one insight per tweet, labeled (2/7) … (6/7)
- Tweet 7: CTA + summary labeled (7/7)
- Every tweet MUST be 180–220 characters — write full, substantive sentences, never stop at one short line
- Separate tweets with exactly the string: ---

INSTAGRAM rules:
- PLAIN TEXT ONLY — absolutely no HTML tags
- First line: punchy opener with an emoji
- Body: value-driven content, emojis throughout, line breaks for readability
- Call to action (save this / drop a comment / follow for more)
- 150–200 words of caption
- New line, then exactly 22 hashtags starting with # separated by spaces`;
}

async function callOpenAI(prompt, model = 'gpt-4o') {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.75,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `OpenAI error ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callAnthropic(prompt, model = 'claude-sonnet-4-6') {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Anthropic error ${res.status}`);
  }
  const data = await res.json();
  return data.content[0].text;
}

function parseResult(raw) {
  // Strip any accidental markdown fences before parsing
  const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  return JSON.parse(cleaned);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { idea, category = 'ai-tech-automation', tone = 'professional', provider = 'openai', customPrompt } =
    await request.json().catch(() => ({}));

  if (!idea?.trim() && !customPrompt?.trim()) {
    return NextResponse.json({ error: 'idea is required' }, { status: 400 });
  }

  // value format: 'openai' | 'anthropic' | 'openai:gpt-4o-mini' | 'anthropic:claude-opus-4-7'
  const [useProvider, explicitModel] = provider.includes(':')
    ? provider.split(':')
    : [provider === 'anthropic' ? 'anthropic' : 'openai', null];

  if (useProvider === 'openai' && !process.env.OPENAI_API_KEY?.startsWith('sk-')) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured in .env.local' }, { status: 503 });
  }
  if (useProvider === 'anthropic' && !process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-')) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured in .env.local' }, { status: 503 });
  }

  const prompt = customPrompt?.trim() || buildPrompt(idea.trim(), category, tone);

  let raw;
  try {
    raw = useProvider === 'anthropic'
      ? await callAnthropic(prompt, explicitModel)
      : await callOpenAI(prompt, explicitModel);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }

  let result;
  try {
    result = parseResult(raw);
  } catch {
    return NextResponse.json(
      { error: 'AI returned invalid JSON. Try again.', raw },
      { status: 500 }
    );
  }

  return NextResponse.json({
    title: result.title ?? '',
    blog: result.blog ?? '',
    linkedin: result.linkedin ?? '',
    twitter: result.twitter ?? '',
    instagram: result.instagram ?? '',
    provider: useProvider,
  });
}
