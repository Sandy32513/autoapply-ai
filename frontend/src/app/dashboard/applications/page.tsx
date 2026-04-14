'use client';

import { useEffect, useState } from 'react';
import { applicationApi } from '@/lib/api';

interface Application {
  id: string;
  job_title: string;
  company: string;
  company_url: string;
  status: string;
  error_message: string | null;
  attempts: number;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  success: 'Applied',
  failed: 'Failed',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await applicationApi.getAll();
      setApplications(data.applications || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = filter === 'all' 
    ? applications 
    : applications.filter(app => app.status === filter);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Applications</h1>
        <p className="text-zinc-600 mt-1">Track your job applications</p>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'processing', 'success', 'failed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-sm rounded-md ${
              filter === status
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {status === 'all' ? 'All' : statusLabels[status] || status}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-zinc-200">
        {loading ? (
          <div className="p-12 text-center text-zinc-600">Loading...</div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-zinc-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-zinc-900 mb-2">No applications</h3>
            <p className="text-zinc-600">Apply to jobs to see them here</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {filteredApps.map((app) => (
              <li key={app.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-zinc-900">{app.job_title}</h3>
                    <p className="text-sm text-zinc-600 mt-1">{app.company}</p>
                    
                    {app.error_message && (
                      <p className="text-xs text-red-600 mt-2">
                        Error: {app.error_message}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                      <span>{formatDate(app.created_at)}</span>
                      {app.attempts > 0 && (
                        <span>Attempts: {app.attempts}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[app.status] || 'bg-gray-100'}`}>
                      {statusLabels[app.status] || app.status}
                    </span>
                    
                    {app.company_url && (
                      <a
                        href={app.company_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-600 hover:text-zinc-900"
                      >
                        View Job →
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}