'use client';

import { useEffect, useState } from 'react';
import { resumeApi } from '@/lib/api';

interface Resume {
  id: string;
  file_name: string;
  created_at: string;
}

interface TailoredResume {
  id: string;
  resume_id: string;
  job_description: string;
  tailored_output: string;
  created_at: string;
}

export default function TailorPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [tailoredResumes, setTailoredResumes] = useState<TailoredResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tailoring, setTailoring] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resumesData, tailoredData] = await Promise.all([
        resumeApi.getAll(),
        resumeApi.getTailored(),
      ]);
      setResumes(resumesData.resumes || []);
      setTailoredResumes(tailoredData.tailored_resumes || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTailor = async () => {
    if (!selectedResume) {
      setError('Please select a resume');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please enter a job description');
      return;
    }

    setError('');
    setResult(null);
    setTailoring(true);

    try {
      const response = await resumeApi.tailor(selectedResume, jobDescription);
      setResult(response.tailored.tailored_output);
      loadData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to tailor resume';
      setError(errorMessage);
    } finally {
      setTailoring(false);
    }
  };

  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">AI Resume Tailor</h1>
        <p className="text-zinc-600 mt-1">Optimize your resume for specific job applications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Tailor Resume</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Select Resume
              </label>
              <select
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
              >
                <option value="">Choose a resume...</option>
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.file_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={8}
                className="w-full px-4 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                placeholder="Paste the job description here..."
              />
              <p className="text-xs text-zinc-500 mt-1">
                {jobDescription.length}/5000 characters
              </p>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <button
              onClick={handleTailor}
              disabled={tailoring || !selectedResume || !jobDescription.trim()}
              className="w-full py-2.5 px-4 bg-zinc-900 text-white font-medium rounded-md hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {tailoring ? 'Tailoring...' : 'Tailor Resume with AI'}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-zinc-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Result</h2>
            {result && (
              <button
                onClick={handleCopy}
                className="text-sm text-zinc-600 hover:text-zinc-900"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-zinc-600">Loading...</div>
            </div>
          ) : tailoring ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-zinc-600">Generating tailored resume...</div>
            </div>
          ) : result ? (
            <pre className="whitespace-pre-wrap text-sm text-zinc-700 bg-zinc-50 p-4 rounded-md h-96 overflow-y-auto font-mono">
              {result}
            </pre>
          ) : (
            <div className="flex items-center justify-center h-64 text-zinc-400">
              Your tailored resume will appear here
            </div>
          )}
        </div>
      </div>

      {tailoredResumes.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-zinc-200">
          <div className="p-6 border-b border-zinc-200">
            <h2 className="text-lg font-semibold text-zinc-900">Previous Results</h2>
          </div>
          <ul className="divide-y divide-zinc-200">
            {tailoredResumes.map((tailored) => {
              const originalResume = resumes.find((r) => r.id === tailored.resume_id);
              return (
                <li 
                  key={tailored.id} 
                  className="p-4 hover:bg-zinc-50 cursor-pointer"
                  onClick={() => {
                    setSelectedResume(tailored.resume_id);
                    setJobDescription(tailored.job_description);
                    setResult(tailored.tailored_output);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {originalResume?.file_name || 'Resume'}
                      </p>
                      <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                        {tailored.job_description.substring(0, 100)}...
                      </p>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {formatDate(tailored.created_at)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}