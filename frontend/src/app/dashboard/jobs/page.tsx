'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { jobApi } from '@/lib/api';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  created_at: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async (page = 1, searchParams = '', locationParams = '') => {
    setLoading(true);
    try {
      const data = await jobApi.getAll({ 
        page, 
        search: searchParams, 
        location: locationParams 
      });
      setJobs(data.jobs || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs(1, search, location);
  };

  const handleScrape = async () => {
    setScraping(true);
    try {
      await jobApi.scrape(search, location);
      loadJobs(1, search, location);
    } catch (err) {
      console.error('Failed to scrape jobs:', err);
    } finally {
      setScraping(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Job Discovery</h1>
        <p className="text-zinc-600 mt-1">Find and apply to jobs</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs (e.g., software engineer)"
            className="flex-1 px-4 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="flex-1 px-4 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleScrape}
            disabled={scraping}
            className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {scraping ? 'Scraping...' : 'Scrape Jobs'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-zinc-200">
        <div className="p-4 border-b border-zinc-200 flex justify-between items-center">
          <span className="text-sm text-zinc-600">
            {pagination.total} jobs found
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-600">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-zinc-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-zinc-900 mb-2">No jobs found</h3>
            <p className="text-zinc-600">Click &quot;Scrape Jobs&quot; to discover new opportunities</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {jobs.map((job) => (
              <li key={job.id} className="p-4 hover:bg-zinc-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-zinc-900">{job.title}</h3>
                    <p className="text-sm text-zinc-600 mt-1">{job.company}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {job.location || 'Remote'}
                      </span>
                      <span>{formatDate(job.created_at)}</span>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="text-sm text-zinc-600 hover:text-zinc-900"
                  >
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        {pagination.pages > 1 && (
          <div className="p-4 border-t border-zinc-200 flex justify-center gap-2">
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => loadJobs(i + 1, search, location)}
                className={`px-3 py-1 text-sm rounded-md ${
                  pagination.page === i + 1
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}