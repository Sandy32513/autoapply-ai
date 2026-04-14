'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestPage() {
  const [status, setStatus] = useState('Testing...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('resumes').select('count');
        if (error) {
          setStatus('Error: ' + error.message);
        } else {
          setStatus('Connected! Count: ' + (data?.[0]?.count ?? 0));
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setStatus('Error: ' + errorMessage);
      }
    };
    testConnection();
  }, []);

  return (
    <div style={{ padding: '50px', fontFamily: 'monospace' }}>
      <h1>Supabase Test</h1>
      <p>{status}</p>
      <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
    </div>
  );
}