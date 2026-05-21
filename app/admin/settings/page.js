'use client';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const ERROR_MESSAGES = {
  linkedin_not_configured: 'LINKEDIN_CLIENT_ID or LINKEDIN_REDIRECT_URI is missing from .env.local',
  invalid_state:           'OAuth state mismatch — possible CSRF. Please try again.',
  token_exchange_failed:   'Could not exchange the authorisation code for a token. Check your LinkedIn app credentials.',
  cannot_get_profile:      'Could not retrieve your LinkedIn profile. Make sure the openid & profile scopes are approved.',
  access_denied:           'You denied the LinkedIn permission request.',
};

function StatusBadge({ connected, expired }) {
  if (connected)  return <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Connected ✓</span>;
  if (expired)    return <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">Token expired</span>;
  return <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">Not connected</span>;
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const errorKey  = searchParams.get('error');
  const connected = searchParams.get('connected');

  const [li, setLi]               = useState(null);
  const [liLoading, setLiLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  // Hashtag groups state
  const [groups, setGroups]       = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [savingGroups, setSavingGroups]   = useState(false);
  const [newName, setNewName]     = useState('');
  const [newTags, setNewTags]     = useState('');
  const hashtagRef = useRef(null);

  useEffect(() => {
    fetch('/api/admin/linkedin/status')
      .then((r) => r.json())
      .then(setLi)
      .finally(() => setLiLoading(false));
    fetch('/api/admin/hashtags')
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .finally(() => setGroupsLoading(false));
    // Scroll to hashtags anchor if URL has #hashtags
    if (window.location.hash === '#hashtags') {
      setTimeout(() => hashtagRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  }, [connected]);

  async function addGroup() {
    if (!newName.trim() || !newTags.trim()) return;
    const updated = [...groups, { name: newName.trim(), tags: newTags.trim() }];
    await saveGroups(updated);
    setNewName(''); setNewTags('');
  }

  async function removeGroup(i) {
    const updated = groups.filter((_, idx) => idx !== i);
    await saveGroups(updated);
  }

  async function saveGroups(updated) {
    setSavingGroups(true);
    try {
      const res = await fetch('/api/admin/hashtags', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: updated }),
      });
      const data = await res.json();
      setGroups(data.groups ?? updated);
    } finally { setSavingGroups(false); }
  }

  async function disconnect() {
    if (!confirm('Disconnect LinkedIn? You will need to reconnect to post again.')) return;
    setDisconnecting(true);
    await fetch('/api/admin/linkedin/disconnect', { method: 'POST' });
    setLi({ connected: false, expired: false, name: null });
    setDisconnecting(false);
  }

  const envVars = [
    { key: 'LINKEDIN_CLIENT_ID',     label: 'LinkedIn Client ID' },
    { key: 'LINKEDIN_CLIENT_SECRET', label: 'LinkedIn Client Secret' },
    { key: 'LINKEDIN_REDIRECT_URI',  label: 'LinkedIn Redirect URI' },
    { key: 'OPENAI_API_KEY',         label: 'OpenAI API Key' },
    { key: 'ANTHROPIC_API_KEY',      label: 'Anthropic API Key' },
    { key: 'NEXT_PUBLIC_SUPABASE_URL',    label: 'Supabase URL' },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase Anon Key' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage integrations and API connections</p>
      </div>

      {/* Error banner */}
      {errorKey && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          <strong>Error:</strong> {ERROR_MESSAGES[errorKey] ?? errorKey}
        </div>
      )}
      {connected === 'linkedin' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
          LinkedIn connected successfully!
        </div>
      )}

      {/* LinkedIn card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* LinkedIn logo */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#0077b5' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">LinkedIn</h2>
              <p className="text-sm text-slate-500">Publish posts directly to your LinkedIn feed</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {liLoading ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <StatusBadge connected={li?.connected} expired={li?.expired} />
            )}
          </div>
        </div>

        {/* Details when connected */}
        {li?.connected && li.name && (
          <div className="mt-4 pl-16 text-sm text-slate-600">
            Posting as <strong>{li.name}</strong>
            {li.expiresAt && (
              <span className="text-xs text-slate-400 ml-2">
                (token expires {new Date(li.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 pl-16 flex flex-wrap items-center gap-3">
          {li?.connected ? (
            <button
              onClick={disconnect}
              disabled={disconnecting}
              className="text-sm font-semibold px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          ) : (
            <a
              href="/api/admin/linkedin/auth"
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-colors"
              style={{ backgroundColor: '#0077b5' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#005f8e'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0077b5'}
            >
              {li?.expired ? '🔄 Reconnect LinkedIn' : '🔗 Connect LinkedIn'}
            </a>
          )}

          <a
            href="https://www.linkedin.com/developers/apps/new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-indigo-600 transition-colors"
          >
            Create LinkedIn app ↗
          </a>
        </div>

        {/* Setup instructions */}
        {!li?.connected && (
          <details className="mt-5 pl-16">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
              Setup instructions
            </summary>
            <ol className="mt-3 space-y-2 text-xs text-slate-600 list-decimal list-inside leading-relaxed">
              <li>Go to <a href="https://www.linkedin.com/developers/apps/new" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">LinkedIn Developers</a> and create an app.</li>
              <li>Under <strong>Auth</strong>, add this redirect URL: <code className="bg-slate-100 px-1 rounded">{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/admin/linkedin/callback</code></li>
              <li>Under <strong>Products</strong>, request <em>Sign In with LinkedIn using OpenID Connect</em> and <em>Share on LinkedIn</em>.</li>
              <li>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong> into <code className="bg-slate-100 px-1 rounded">.env.local</code>:
                <pre className="mt-1.5 bg-slate-100 rounded p-2 font-mono text-xs leading-relaxed whitespace-pre-wrap">
{`LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/admin/linkedin/callback`}
                </pre>
              </li>
              <li>Restart the dev server, then click <strong>Connect LinkedIn</strong> above.</li>
            </ol>
          </details>
        )}
      </div>

      {/* Hashtag groups */}
      <div id="hashtags" ref={hashtagRef} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">📸</span>
          <h2 className="text-base font-bold text-slate-800">Instagram Hashtag Groups</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          Save reusable hashtag sets. On any idea&apos;s Instagram tab, click <em>Append &amp; Copy</em> to combine your caption with a group.
        </p>

        {/* Existing groups */}
        {groupsLoading ? (
          <div className="text-sm text-slate-400">Loading…</div>
        ) : groups.length === 0 ? (
          <p className="text-sm text-slate-400 mb-4">No groups yet — add one below.</p>
        ) : (
          <div className="space-y-2 mb-5">
            {groups.map((g, i) => (
              <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700">{g.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 break-all leading-relaxed">{g.tags}</p>
                </div>
                <button
                  onClick={() => removeGroup(i)}
                  disabled={savingGroups}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0 disabled:opacity-40 mt-0.5"
                  title="Remove group"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new group */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Add Group</p>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Group name (e.g. AI & Tech)"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-indigo-400"
          />
          <textarea
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
            placeholder="#AI #MachineLearning #Tech #Productivity #Innovation #FutureOfWork"
            rows={2}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 resize-none font-mono"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {newTags.match(/#\w+/g)?.length ?? 0} hashtags
            </span>
            <button
              onClick={addGroup}
              disabled={savingGroups || !newName.trim() || !newTags.trim()}
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
            >
              {savingGroups ? 'Saving…' : 'Add Group'}
            </button>
          </div>
        </div>
      </div>

      {/* Env var checklist */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-800 mb-4">Environment Variables</h2>
        <p className="text-sm text-slate-500 mb-4">
          These are checked at runtime — status shown is based on what&apos;s in your <code className="bg-slate-100 px-1 rounded text-xs">.env.local</code>.
        </p>
        <div className="space-y-2">
          {envVars.map((v) => (
            <div key={v.key} className="flex items-center gap-3 text-sm">
              <span className="text-slate-400 font-mono text-xs w-64 shrink-0">{v.key}</span>
              <span className="text-slate-600">{v.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">
          We can&apos;t read env var values client-side for security. Check your <code className="bg-slate-100 px-1 rounded">.env.local</code> file directly.
        </p>
      </div>
    </div>
  );
}
