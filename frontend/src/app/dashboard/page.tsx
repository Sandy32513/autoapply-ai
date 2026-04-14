'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { resumeApi } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({ resumes: 0, applications: 0, tailored: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const resumesData = await resumeApi.getAll();
      const tailoredData = await resumeApi.getTailored();
      setStats({
        resumes: resumesData.resumes?.length || 0,
        applications: 0,
        tailored: tailoredData?.length || 0,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Resumes',
      value: stats.resumes,
      href: '/dashboard/resumes',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: '#6366f1',
      bg: '#eef2ff',
    },
    {
      title: 'Applications',
      value: stats.applications,
      href: '/dashboard/applications',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      color: '#10b981',
      bg: '#ecfdf5',
    },
    {
      title: 'AI Tailored',
      value: stats.tailored,
      href: '/dashboard/tailor',
      icon: 'M9.663 17h4.673M18.258 15a3.5 3.5 0 10-4.968-4.488A3.5 3.5 0 0014.258 7.5 3.5 3.5 0 00-3.488 4.663m1.257 4.837a3.5 3.5 0 104.488-1.988 3.5 3.5 0 00-1.488 4.488',
      color: '#f59e0b',
      bg: '#fffbeb',
    },
  ];

  const actions = [
    {
      title: 'Upload Resume',
      href: '/dashboard/resumes',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      desc: 'Add your resume to get started',
    },
    {
      title: 'Find Jobs',
      href: '/dashboard/jobs',
      icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      desc: 'Browse job listings',
    },
    {
      title: 'AI Tailor',
      href: '/dashboard/tailor',
      icon: 'M9.663 17h4.673M18.258 15a3.5 3.5 0 10-4.968-4.488A3.5 3.5 0 0014.258 7.5 3.5 3.5 0 00-3.488 4.663m1.257 4.837a3.5 3.5 0 104.488-1.988 3.5 3.5 0 00-1.488 4.488',
      desc: 'Optimize for specific jobs',
    },
  ];

  return (
    <div className="animate-fadeInUp">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Welcome back! 👋</h1>
        <p className="text-base mt-2" style={{ color: 'var(--muted)' }}>AI-powered job application automation</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <Link
            key={card.title}
            href={card.href}
            className={`glass-card stat-card p-6 stagger-${index + 1}`}
          >
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>{card.title}</p>
                <div className="mt-2 text-4xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {loading ? '...' : card.value}
                </div>
              </div>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: card.bg }}
              >
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke={card.color}
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
            </div>
            <div className="mt-5 flex items-center text-sm font-medium" style={{ color: card.color }}>
              <span>View {card.title.toLowerCase()}</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-5" style={{ color: 'var(--foreground)' }}>Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <Link
              key={action.title}
              href={action.href}
              className={`glass-card p-5 flex items-center gap-4 glow stagger-${index + 1}`}
            >
              <div
                className="icon-box"
              >
                <svg className="w-5 h-5" fill="none" stroke="var(--primary)" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                </svg>
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{action.title}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Pro Tip Card */}
      <div className="mt-8 glass-card p-6 stagger-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M18.258 15a3.5 3.5 0 10-4.968-4.488A3.5 3.5 0 0014.258 7.5 3.5 3.5 0 00-3.488 4.663m1.257 4.837a3.5 3.5 0 104.488-1.988 3.5 3.5 0 00-1.488 4.488" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>Pro Tip</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                Use AI Tailor to optimize your resume for each job application for better results.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)' }} />
      </div>
    </div>
  );
}