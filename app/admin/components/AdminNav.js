'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function AdminNav({ email }) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/admin',          label: 'Dashboard', icon: '▦' },
    { href: '/admin/ideas',    label: 'Ideas',     icon: '💡' },
    { href: '/admin/ideas/new', label: 'New Idea', icon: '+',  highlight: true },
    { href: '/admin/posts/new',    label: 'New Post', icon: '✏️', highlight: true },
    { href: '/admin/carousel/new', label: 'Carousel', icon: '🎠', highlight: true },
    { href: '/admin/settings',     label: 'Settings',  icon: '⚙️' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
              N
            </div>
            <span className="font-bold text-slate-800 text-sm hidden sm:block">NrichSouls CMS</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              if (link.highlight) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <span className="text-base leading-none">{link.icon}</span>
                    {link.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User + actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="text-xs text-slate-500 hover:text-indigo-600 transition-colors hidden sm:block"
          >
            View site ↗
          </Link>
          <span className="text-xs text-slate-500 hidden sm:block truncate max-w-[160px]">
            {email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="text-xs font-medium text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
