'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { resumeApi } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({ resumes: 0, applications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const resumesData = await resumeApi.getAll();
      setStats({
        resumes: resumesData.resumes?.length || 0,
        applications: 0,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-600 mt-1">AI-powered job application automation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <div className="text-sm font-medium text-zinc-600">Resumes</div>
          <div className="mt-2 text-3xl font-bold text-zinc-900">{loading ? '...' : stats.resumes}</div>
          <div className="mt-4">
            <Link href="/dashboard/resumes" className="text-sm text-zinc-900 hover:underline">
              View resumes →
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <div className="text-sm font-medium text-zinc-600">Applications</div>
          <div className="mt-2 text-3xl font-bold text-zinc-900">{stats.applications}</div>
          <div className="mt-4">
            <Link href="/dashboard/applications" className="text-sm text-zinc-900 hover:underline">
              View applications →
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <div className="text-sm font-medium text-zinc-600">AI Tailored</div>
          <div className="mt-2 text-3xl font-bold text-zinc-900">-</div>
          <div className="mt-4">
            <Link href="/dashboard/tailor" className="text-sm text-zinc-900 hover:underline">
              View tailoring →
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/dashboard/resumes" className="flex items-center justify-center px-4 py-3 border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors text-center">
            Upload Resume
          </Link>
          <Link href="/dashboard/tailor" className="flex items-center justify-center px-4 py-3 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors text-center">
            Tailor Resume with AI
          </Link>
        </div>
      </div>
    </div>
  );
}