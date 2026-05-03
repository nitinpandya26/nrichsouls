import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Maps Notion tag names → internal category slugs
const TAG_TO_CATEGORY = {
  'AI & Tech': 'ai-tech-automation',
  'AI': 'ai-tech-automation',
  'Tech': 'ai-tech-automation',
  'Automation': 'ai-tech-automation',
  'Career': 'career-growth-remote-work',
  'Career Growth': 'career-growth-remote-work',
  'Remote Work': 'career-growth-remote-work',
  'Health': 'health-wellness',
  'Health & Wellness': 'health-wellness',
  'Wellness': 'health-wellness',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getText(richText) {
  return richText?.map((t) => t.plain_text).join('') ?? '';
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderRichText(richText) {
  if (!richText?.length) return '';
  return richText.map((text) => {
    let content = escapeHtml(text.plain_text);
    const { annotations, href } = text;
    if (annotations.bold) content = `<strong>${content}</strong>`;
    if (annotations.italic) content = `<em>${content}</em>`;
    if (annotations.strikethrough) content = `<s>${content}</s>`;
    if (annotations.underline) content = `<u>${content}</u>`;
    if (annotations.code) content = `<code>${content}</code>`;
    if (href) content = `<a href="${href}" target="_blank" rel="noopener noreferrer">${content}</a>`;
    return content;
  }).join('');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatPost(page) {
  const p = page.properties;

  const title = getText(p.Title?.title) || getText(p.Name?.title) || 'Untitled';
  const slug =
    getText(p.Slug?.rich_text) ||
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Derive category from Tags (use first matching tag)
  const tags = p.Tags?.multi_select?.map((t) => t.name) ?? [];
  const category = tags.map((t) => TAG_TO_CATEGORY[t]).find(Boolean) ?? 'ai-tech-automation';

  // Cover image — from Notion page cover or a CoverImage property if added later
  const rawCover =
    p.CoverImage?.files?.[0]?.file?.url ||
    p.CoverImage?.files?.[0]?.external?.url ||
    p.CoverImage?.url ||
    page.cover?.external?.url ||
    page.cover?.file?.url ||
    null;

  return {
    id: page.id,
    slug,
    title,
    excerpt: getText(p.Excerpt?.rich_text),
    category,
    tags,
    date: formatDate(p.Date?.date?.start),
    readTime: getText(p.ReadTime?.rich_text) || '',
    coverImage: rawCover,
    published: p.Published?.checkbox ?? false,
    source: 'notion',
  };
}

// ── Block fetching ────────────────────────────────────────────────────────────

async function getAllBlocks(blockId) {
  const blocks = [];
  let cursor;
  do {
    const { results, next_cursor } = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });
    blocks.push(...results);
    cursor = next_cursor;
  } while (cursor);
  return blocks;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getNotionPosts() {
  const results = [];
  let cursor;
  do {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: { property: 'Published', checkbox: { equals: true } },
      sorts: [{ property: 'Date', direction: 'descending' }],
      page_size: 100,
      start_cursor: cursor,
    });
    results.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);
  return results.map(formatPost);
}

export async function getNotionPostsByCategory(category) {
  const all = await getNotionPosts();
  return all.filter((p) => p.category === category);
}

export async function getNotionPostBySlug(slug) {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: 'Slug',
      rich_text: { equals: slug },
    },
  });
  const page = response.results.find((p) => {
    const post = formatPost(p);
    return post.published && post.slug === slug;
  });
  return page ? formatPost(page) : null;
}

export async function getNotionPostContent(pageId) {
  const blocks = await getAllBlocks(pageId);
  return renderBlocks(blocks);
}

// ── Block renderer ────────────────────────────────────────────────────────────

function renderBlocks(blocks) {
  let html = '';
  let listType = null;

  for (const block of blocks) {
    const { type } = block;
    const value = block[type];

    if (type !== 'bulleted_list_item' && listType === 'ul') { html += '</ul>\n'; listType = null; }
    if (type !== 'numbered_list_item' && listType === 'ol') { html += '</ol>\n'; listType = null; }

    switch (type) {
      case 'paragraph':
        html += `<p>${renderRichText(value.rich_text)}</p>\n`;
        break;
      case 'heading_1':
        html += `<h1>${renderRichText(value.rich_text)}</h1>\n`;
        break;
      case 'heading_2':
        html += `<h2>${renderRichText(value.rich_text)}</h2>\n`;
        break;
      case 'heading_3':
        html += `<h3 class="article-h3">${renderRichText(value.rich_text)}</h3>\n`;
        break;
      case 'bulleted_list_item':
        if (listType !== 'ul') { html += '<ul>\n'; listType = 'ul'; }
        html += `<li>${renderRichText(value.rich_text)}</li>\n`;
        break;
      case 'numbered_list_item':
        if (listType !== 'ol') { html += '<ol>\n'; listType = 'ol'; }
        html += `<li>${renderRichText(value.rich_text)}</li>\n`;
        break;
      case 'quote':
        html += `<blockquote>${renderRichText(value.rich_text)}</blockquote>\n`;
        break;
      case 'code':
        html += `<pre><code class="language-${value.language || 'plaintext'}">${escapeHtml(getText(value.rich_text))}</code></pre>\n`;
        break;
      case 'divider':
        html += '<hr />\n';
        break;
      case 'image': {
        const src = value.type === 'external' ? value.external.url : value.file.url;
        const caption = value.caption?.length ? getText(value.caption) : '';
        html += `<figure><img src="${src}" alt="${escapeHtml(caption)}" style="max-width:100%;border-radius:12px;" />${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}</figure>\n`;
        break;
      }
      case 'callout': {
        const emoji = value.icon?.emoji ?? '💡';
        html += `<div class="callout"><span class="callout-icon">${emoji}</span><div>${renderRichText(value.rich_text)}</div></div>\n`;
        break;
      }
      case 'toggle':
        html += `<details><summary>${renderRichText(value.rich_text)}</summary></details>\n`;
        break;
      default:
        break;
    }
  }

  if (listType === 'ul') html += '</ul>\n';
  if (listType === 'ol') html += '</ol>\n';

  return html;
}
