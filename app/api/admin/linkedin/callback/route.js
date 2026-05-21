import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authOptions } from '../../../../../lib/auth';
import { supabaseAdmin } from '../../../../../lib/supabase';

async function upsert(key, value) {
  await supabaseAdmin.from('settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.redirect(new URL('/admin/login', request.url));

  const { searchParams } = new URL(request.url);
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error');

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/admin/settings?error=${encodeURIComponent(oauthError)}`, request.url)
    );
  }

  // CSRF check
  const cookieStore = await cookies();
  const savedState = cookieStore.get('li_oauth_state')?.value;
  if (!state || state !== savedState) {
    return NextResponse.redirect(new URL('/admin/settings?error=invalid_state', request.url));
  }

  // Exchange code → token
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/admin/settings?error=token_exchange_failed', request.url));
  }

  const { access_token, expires_in } = await tokenRes.json();

  // Get person info via OpenID Connect userinfo
  const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const me = await meRes.json();
  const personId = me.sub;  // OpenID sub = LinkedIn person ID

  if (!personId) {
    return NextResponse.redirect(new URL('/admin/settings?error=cannot_get_profile', request.url));
  }

  // Persist to Supabase settings table
  const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
  await upsert('linkedin_access_token',    access_token);
  await upsert('linkedin_person_urn',      `urn:li:person:${personId}`);
  await upsert('linkedin_person_name',     me.name ?? '');
  await upsert('linkedin_token_expires_at', expiresAt);

  const response = NextResponse.redirect(new URL('/admin/settings?connected=linkedin', request.url));
  response.cookies.delete('li_oauth_state');
  return response;
}
