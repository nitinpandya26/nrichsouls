import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from '@notionhq/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
  for (const line of envFile.split('\n')) {
    const eq = line.indexOf('=');
    if (eq === -1 || line.trimStart().startsWith('#')) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^"(.*)"$/, '$1');
    if (key && !process.env[key]) process.env[key] = val;
  }
} catch {}

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Query all pages (no filter)
const res = await notion.databases.query({ database_id: DATABASE_ID, page_size: 10 });
console.log(`Total pages found: ${res.results.length}`);

for (const page of res.results) {
  const p = page.properties;
  const title = p.Title?.title?.map(t => t.plain_text).join('') || '(no title)';
  const published = p.Published?.checkbox;
  const slug = p.Slug?.rich_text?.map(t => t.plain_text).join('') || '(no slug)';
  const tags = p.Tags?.multi_select?.map(t => t.name).join(', ') || '(no tags)';
  console.log(`  - "${title}" | published:${published} | slug:${slug} | tags:${tags}`);
}
