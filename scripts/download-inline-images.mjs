/**
 * Copies all inline WordPress images from the local Jetpack backup into
 * public/images/content/, then rewrites the src URLs in every .md post.
 *
 * WordPress generates cropped variants (image-10-683x1024.png); the backup
 * only has the originals (image-10.png), so crop suffixes are stripped when
 * the exact variant isn't found.
 *
 * Run with: node scripts/download-inline-images.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BACKUP_UPLOADS = path.join(
  __dirname, '..', '..',
  'jetpack-backup-nrichsouls-wpcomstaging-com-2026-05-01-02-34-39',
  'wp-content', 'uploads'
);
const POSTS_DIR   = path.join(__dirname, '..', 'content', 'posts');
const CONTENT_DIR = path.join(__dirname, '..', 'public', 'images', 'content');

if (!fs.existsSync(CONTENT_DIR)) fs.mkdirSync(CONTENT_DIR, { recursive: true });

// Strip WordPress crop suffix: image-10-683x1024.png → image-10.png
function stripCropSuffix(filename) {
  return filename.replace(/-\d+x\d+(\.[^.]+)$/, '$1');
}

// Extract relative path under wp-content/uploads from a full URL
function urlToRelPath(url) {
  const marker = '/wp-content/uploads/';
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}

// Try to find the file in the backup; fall back to the original (no crop suffix)
function findInBackup(relPath) {
  const exact = path.join(BACKUP_UPLOADS, ...relPath.split('/'));
  if (fs.existsSync(exact)) return { src: exact, filename: path.basename(relPath) };

  const dir      = relPath.split('/').slice(0, -1).join('/');
  const base     = path.basename(relPath);
  const original = stripCropSuffix(base);
  if (original === base) return null;                      // no crop suffix to strip

  const fallback = path.join(BACKUP_UPLOADS, ...dir.split('/'), original);
  if (fs.existsSync(fallback)) return { src: fallback, filename: original };

  return null;
}

// ── Collect all inline image URLs across all posts ────────────────────────────

const WP_IMG_RE = /src="(https:\/\/nrichsouls\.in\/wp-content\/uploads\/[^"]+)"/g;

const urlToLocal = new Map();   // WP URL (no query params) → /images/content/filename

const mdFiles = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
for (const file of mdFiles) {
  const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
  for (const [, rawUrl] of raw.matchAll(WP_IMG_RE)) {
    const url = rawUrl.split('?')[0];   // strip query params
    if (!urlToLocal.has(url)) urlToLocal.set(url, null);
  }
}

console.log(`Found ${urlToLocal.size} unique inline image URLs across all posts\n`);

// ── Copy images from backup ───────────────────────────────────────────────────

let copied = 0, skipped = 0, missing = 0;

for (const [url] of urlToLocal) {
  const relPath = urlToRelPath(url);
  if (!relPath) { urlToLocal.set(url, null); missing++; continue; }

  const found = findInBackup(relPath);
  if (!found) {
    console.log(`  ✗ Not in backup: ${relPath}`);
    missing++;
    continue;
  }

  const dest = path.join(CONTENT_DIR, found.filename);
  const localPath = `/images/content/${found.filename}`;
  urlToLocal.set(url, localPath);

  if (fs.existsSync(dest)) {
    console.log(`  ↩ Already exists: ${found.filename}`);
    skipped++;
    continue;
  }

  fs.copyFileSync(found.src, dest);
  console.log(`  ✓ ${found.filename}`);
  copied++;
}

console.log(`\nCopied: ${copied}  Skipped: ${skipped}  Missing: ${missing}\n`);

// ── Rewrite src URLs in all markdown files ────────────────────────────────────

let filesUpdated = 0;

for (const file of mdFiles) {
  const filePath = path.join(POSTS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  content = content.replace(WP_IMG_RE, (match, rawUrl) => {
    const url = rawUrl.split('?')[0];
    const localPath = urlToLocal.get(url);
    if (!localPath) return match;   // couldn't find — leave as-is
    changed = true;
    return `src="${localPath}"`;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  Updated: ${file}`);
    filesUpdated++;
  }
}

console.log(`\nMarkdown files updated: ${filesUpdated}`);
console.log('Done — restart the dev server to see changes.');
