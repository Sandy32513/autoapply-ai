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
      description: 'Your uploaded resumes',
      href: '/dashboard/resumes',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
      title: 'Applications',
      value: stats.applications,
      description: 'Job applications sent',
      href: '/dashboard/applications',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    },
    {
      title: 'AI Tailored',
      value: stats.tailored,
      description: 'Resumes optimized with AI',
      href: '/dashboard/tailor',
      icon: 'M9.663 17h4.673M18.258 15a3.5 3.5 0 10-4.968-4.488A3.5 3.5 0 0014.258 7.5 3.5 3.5 0 00-3.488 4.663m1.257 4.837a3.5 3.5 0 104.488-1.988 3.5 3.5 0 00-1.488 4.488',
    },
  ];

  const actions = [
    {
      title: 'Upload Resume',
      href: '/dashboard/resumes',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      desc: 'Add your resume',
    },
    {
      title: 'Find Jobs',
      href: '/dashboard/jobs',
      icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      desc: 'Browse opportunities',
    },
    {
      title: 'AI Tailor',
      href: '/dashboard/tailor',
      icon: 'M9.663 17h4.673M18.258 15a3.5 3.5 0 10-4.968-4.488A3.5 3.5 0 0014.258 7.5 3.5 3.5 0 00-3.488 4.663m1.257 4.837a3.5 3.5 0 104.488-1.988 3.5 3.5 0 00-1.488 4.488',
      desc: 'Optimize with AI',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="animate-fadeInUp">
        <h1 className="text-4xl font-semibold tracking-tight" style={{ color: 'var(--fg)' }}>
          Welcome back
        </h1>
        <p className="text-lg mt-2" style={{ color: 'var(--muted)' }}>
          Track your job applications and optimize your resume with AI
        </p>
      </div>

      {/* Stats Cards - Apple Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((card, index) => (
          <Link
            key={card.title}
            href={card.href}
            className={`apple-card p-6 animate-fadeInUp delay-${index + 1}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{card.title}</p>
                <p className="text-4xl font-semibold mt-2" style={{ color: 'var(--fg)' }}>
                  {loading ? '...' : card.value}
                </p>
                <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
                  {card.description}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                <svg className="w-6 h-6" fill="none" stroke="var(--primary)" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="animate-fadeInUp delay-4">
        <h2 className="text-2xl font-semibold mb-5" style={{ color: 'var(--fg)' }}>Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <Link
              key={action.title}
              href={action.href}
              className="apple-card p-5 flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                <svg className="w-5 h-5" fill="none" stroke="var(--primary)" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium" style={{ color: 'var(--fg)' }}>{action.title}</p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{action.desc}</p>
              </div>
              <svg className="w-5 h-5 transition-base group-hover:translate-x-1" style={{ color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Pro Tip */}
      <div className="apple-card p-6 animate-fadeInUp delay-4">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl apple-gradient flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M18.258 15a3.5 3.5 0 10-4.968-4.488A3.5 3.5 0 0014.258 7.5 3.5 3.5 0 00-3.488 4.663m1.257 4.837a3.5 3.5 0 104.488-1.988 3.5 3.5 0 00-1.488 4.488" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>Pro Tip</h3>
            <p className="mt-1" style={{ color: 'var(--muted)' }}>
              Use AI Tailor to optimize your resume for each job application for 40% higher response rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}