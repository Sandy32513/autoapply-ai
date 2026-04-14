'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { jobApi, applicationApi, resumeApi } from '@/lib/api';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  source: string;
  created_at: string;
}

interface Resume {
  id: string;
  file_name: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      loadJob(params.id as string);
      loadResumes();
    }
  }, [params.id]);

  const loadJob = async (id: string) => {
    try {
      const data = await jobApi.getById(id);
      setJob(data.job);
    } catch (err) {
      setError('Failed to load job');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadResumes = async () => {
    try {
      const data = await resumeApi.getAll();
      setResumes(data.resumes || []);
      if (data.resumes?.length > 0) {
        setSelectedResume(data.resumes[0].id);
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
    }
  };

  const handleApply = async () => {
    if (!job) return;

    setApplying(true);
    setApplyMessage('');

    try {
      const result = await applicationApi.apply(job.id, selectedResume || undefined);
      setApplyMessage(result.message || 'Application submitted!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply';
      setApplyMessage(errorMessage);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-zinc-600">Loading...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="px-4 sm:px-0">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <p className="text-red-600">{error || 'Job not found'}</p>
          <Link href="/dashboard/jobs" className="text-zinc-600 hover:underline mt-4 inline-block">
            ← Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <Link href="/dashboard/jobs" className="text-sm text-zinc-600 hover:underline mb-4 inline-block">
        ← Back to Jobs
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-zinc-200">
        <div className="p-6 border-b border-zinc-200">
          <h1 className="text-2xl font-bold text-zinc-900">{job.title}</h1>
          <div className="mt-2 flex items-center gap-4 text-zinc-600">
            <span className="font-medium">{job.company}</span>
            <span>•</span>
            <span>{job.location || 'Remote'}</span>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Job Description</h2>
          <p className="text-zinc-700 whitespace-pre-wrap">{job.description}</p>

          <div className="mt-8 p-4 bg-zinc-50 rounded-lg">
            <h3 className="font-medium text-zinc-900 mb-4">Apply with AutoApply AI</h3>
            
            {resumes.length > 0 ? (
              <>
                <select
                  value={selectedResume}
                  onChange={(e) => setSelectedResume(e.target.value)}
                  className="w-full mb-3 px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.file_name}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {applying ? 'Submitting...' : 'Auto Apply with AI'}
                </button>
              </>
            ) : (
              <p className="text-sm text-zinc-600">
                Upload a resume first to use auto-apply
              </p>
            )}

            {applyMessage && (
              <p className={`mt-3 text-sm ${applyMessage.includes('submitted') ? 'text-green-600' : 'text-red-600'}`}>
                {applyMessage}
              </p>
            )}
          </div>

          <div className="mt-6 flex gap-4">
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              Apply Manually
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-200 text-sm text-zinc-500">
            <p>Posted: {new Date(job.created_at).toLocaleDateString()}</p>
            <p>Source: {job.source}</p>
          </div>
        </div>
      </div>
    </div>
  );
}