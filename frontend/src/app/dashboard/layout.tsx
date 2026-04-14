'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l-2-2m2 2l2-2M9 21V9m0 10a3 3 0 01-3 3 0 01-.017-1.998A3 3 0 0114.016 17h.984A3 3 0 0118 20a3 3 0 01-3 3 0 01-1-5.98V12m0 9l-2-2m2 2l2-2' },
    { href: '/dashboard/jobs', label: 'Jobs', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { href: '/dashboard/resumes', label: 'Resumes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { href: '/dashboard/tailor', label: 'AI Tailor', icon: 'M9.663 17h4.673M18.258 15a3.5 3.5 0 10-4.968-4.488A3.5 3.5 0 0014.258 7.5 3.5 3.5 0 00-3.488 4.663m1.257 4.837a3.5 3.5 0 104.488-1.988 3.5 3.5 0 00-1.488 4.488m4.488-1.988a3.5 3.5 0 014.488 1.488M12 20v-4.5m0 4.5h4.5' },
    { href: '/dashboard/applications', label: 'Applications', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Apple-style Navigation */}
      <nav className="apple-nav" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg apple-gradient flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-base font-semibold" style={{ color: 'var(--fg)' }}>
                  AutoApply AI
                </span>
              </Link>
            </div>

            {/* Nav Items - Centered */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-base"
                  style={{
                    color: isActive(item.href) ? 'var(--primary)' : 'var(--muted)',
                    background: isActive(item.href) ? 'rgba(0, 113, 227, 0.1)' : 'transparent',
                  }}
                >
                  <span className="hidden md:inline">{item.label}</span>
                  <span className="md:hidden">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>

            {/* CTA Button */}
            <div>
              <Link href="/dashboard/tailor" className="apple-btn">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">New Application</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with padding */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
}