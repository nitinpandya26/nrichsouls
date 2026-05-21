import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../../../lib/auth';
import { supabaseAdmin } from '../../../../lib/supabase';

const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const ext = file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTS.includes(ext)) {
    return NextResponse.json({ error: `Unsupported type. Allowed: ${ALLOWED_EXTS.join(', ')}` }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 413 });
  }

  const buffer = Buffer.from(arrayBuffer);
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // Ensure bucket exists (no-op if already present)
  await supabaseAdmin.storage
    .createBucket('images', { public: true, fileSizeLimit: MAX_BYTES })
    .catch(() => {});

  const { data, error } = await supabaseAdmin.storage
    .from('images')
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabaseAdmin.storage.from('images').getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl });
}
