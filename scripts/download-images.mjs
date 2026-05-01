/**
 * Copies WordPress featured images from the local Jetpack backup into public/images/,
 * then updates each post's .md frontmatter with a coverImage field.
 *
 * Run with: node scripts/download-images.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xmlPath = path.join(__dirname, '..', '..', 'nrichsouls.WordPress.2026-04-25.xml');
const backupUploads = path.join(
  __dirname, '..', '..', // up to nrichsouls_website
  'jetpack-backup-nrichsouls-wpcomstaging-com-2026-05-01-02-34-39',
  'wp-content', 'uploads'
);
const postsDir = path.join(__dirname, '..', 'content', 'posts');
const imagesDir = path.join(__dirname, '..', 'public', 'images');

if (!fs.existsSync(xmlPath)) { console.error('XML not found:', xmlPath); process.exit(1); }
if (!fs.existsSync(backupUploads)) { console.error('Backup uploads not found:', backupUploads); process.exit(1); }
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

const xml = fs.readFileSync(xmlPath, 'utf-8');

function extractCDATA(text, tag) {
  const escaped = tag.replace(':', '\\:');
  const regex = new RegExp(`<${escaped}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${escaped}>`);
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}
function extractTag(text, tag) {
  const escaped = tag.replace(':', '\\:');
  const regex = new RegExp(`<${escaped}[^>]*>([^<]*)<\\/${escaped}>`);
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}
function get(tag, item) {
  return extractCDATA(item, tag) || extractTag(item, tag);
}

// Given a WP attachment URL, return the relative path under wp-content/uploads
// e.g. https://nrichsouls.in/wp-content/uploads/2025/05/image.png → 2025/05/image.png
function urlToLocalPath(url) {
  const marker = '/wp-content/uploads/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
console.log(`Parsed ${itemMatches.length} total XML items\n`);

// attachment post_id → URL
const attachments = {};
for (const match of itemMatches) {
  const item = match[1];
  if (get('wp:post_type', item) !== 'attachment') continue;
  const id = get('wp:post_id', item);
  const url = get('wp:attachment_url', item);
  if (id && url) attachments[id] = url;
}
console.log(`  Found ${Object.keys(attachments).length} image attachments`);

// published posts: slug + thumbnailId
const posts = [];
for (const match of itemMatches) {
  const item = match[1];
  if (get('wp:post_type', item) !== 'post') continue;
  if (get('wp:status', item) !== 'publish') continue;
  const slug = get('wp:post_name', item);
  if (!slug) continue;

  let thumbnailId = null;
  for (const pm of item.matchAll(/<wp:postmeta>([\s\S]*?)<\/wp:postmeta>/g)) {
    if (get('wp:meta_key', pm[1]) === '_thumbnail_id') {
      thumbnailId = get('wp:meta_value', pm[1]);
      break;
    }
  }
  posts.push({ slug, thumbnailId });
}
console.log(`  Found ${posts.length} published posts`);
console.log(`  Posts with featured image: ${posts.filter(p => p.thumbnailId).length}\n`);

// Add or update coverImage in .md frontmatter
function updateFrontmatter(slug, coverImage) {
  const filePath = path.join(postsDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return false;
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(
    /^(---\n)([\s\S]*?)(---\n)/,
    (_, open, body, close) => {
      if (body.includes('coverImage:')) {
        body = body.replace(/coverImage:.*\n/, `coverImage: "${coverImage}"\n`);
      } else {
        body += `coverImage: "${coverImage}"\n`;
      }
      return open + body + close;
    }
  );
  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
}

// Main
let copied = 0;
let skipped = 0;
let failed = 0;
let noImage = 0;

for (const { slug, thumbnailId } of posts) {
  if (!thumbnailId) {
    console.log(`  – No featured image: ${slug}`);
    noImage++;
    continue;
  }

  const imageUrl = attachments[thumbnailId];
  if (!imageUrl) {
    console.log(`  ⚠ Attachment ID ${thumbnailId} not in XML: ${slug}`);
    noImage++;
    continue;
  }

  const relPath = urlToLocalPath(imageUrl);
  if (!relPath) {
    console.log(`  ⚠ Could not parse URL: ${imageUrl}`);
    noImage++;
    continue;
  }

  const srcPath = path.join(backupUploads, ...relPath.split('/'));
  if (!fs.existsSync(srcPath)) {
    console.log(`  ⚠ File not in backup: ${relPath}`);
    noImage++;
    continue;
  }

  const ext = path.extname(relPath) || '.jpg';
  const filename = `${slug}${ext}`;
  const destPath = path.join(imagesDir, filename);
  const coverImage = `/images/${filename}`;

  if (fs.existsSync(destPath)) {
    console.log(`  ↩ Already exists: ${filename}`);
    updateFrontmatter(slug, coverImage);
    skipped++;
    continue;
  }

  try {
    fs.copyFileSync(srcPath, destPath);
    updateFrontmatter(slug, coverImage);
    console.log(`  ✓ ${filename}`);
    copied++;
  } catch (err) {
    console.log(`  ✗ ${slug}: ${err.message}`);
    failed++;
  }
}

console.log(`\n─────────────────────────────────`);
console.log(`Copied     : ${copied}`);
console.log(`Skipped    : ${skipped} (already existed)`);
console.log(`No image   : ${noImage}`);
console.log(`Failed     : ${failed}`);
console.log(`─────────────────────────────────`);
