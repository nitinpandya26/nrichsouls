import { getAllPosts, mergeAndSort } from "../../lib/posts";
import { getNotionPosts } from "../../lib/notion";

const SITE = "https://nrichsouls.in";

function escapeXml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRssDate(dateStr) {
  if (!dateStr) return new Date().toUTCString();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

export async function GET() {
  const mdPosts = getAllPosts();
  let notionPosts = [];
  try { notionPosts = await getNotionPosts(); } catch {}
  const posts = mergeAndSort(notionPosts, mdPosts);

  const items = posts
    .map((post) => {
      const url = `${SITE}/blog/${post.slug}`;
      const cover = post.coverImage
        ? post.coverImage.startsWith("http")
          ? post.coverImage
          : `${SITE}${post.coverImage}`
        : null;

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${toRssDate(post.date)}</pubDate>
      <category>${escapeXml(post.category)}</category>
      ${post.readTime ? `<dc:description>${escapeXml(post.readTime)}</dc:description>` : ""}
      ${cover ? `<enclosure url="${escapeXml(cover)}" type="image/jpeg" length="0" />` : ""}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NrichSouls Blog</title>
    <link>${SITE}/blog</link>
    <description>Practical insights on AI &amp; Tech, Career Growth, and Health &amp; Wellness.</description>
    <language>en-us</language>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
