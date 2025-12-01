'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function IntellifloCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setStatus('Error: No authorization code received');
      console.error('No code parameter in URL');
      return;
    }

    // Exchange the code with the backend
    const exchangeCode = async () => {
      try {
        setStatus('Exchanging authorization code...');

        // Get current user ID
        const userResponse = await fetch('/api/user');
        if (!userResponse.ok) {
          throw new Error('Failed to get user information');
        }
        const userData = await userResponse.json();

        const fastApiBaseUrl = (process.env.NEXT_PUBLIC_FASTAPI_URL || '').replace(/\/$/, '');
        if (!fastApiBaseUrl) {
          throw new Error('NEXT_PUBLIC_FASTAPI_URL is not set for client-side exchange');
        }
        const response = await fetch(`${fastApiBaseUrl}/auth/intelliflo/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, user_id: userData.id }),
        });

        const rawText = await response.text();
        console.log('Exchange response:', rawText);

        let data;
        try {
          data = rawText ? JSON.parse(rawText) : null;
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          data = { raw: rawText };
        }

        if (!response.ok) {
          throw new Error(data?.detail || data?.error || `Exchange failed with status ${response.status}`);
        }

        setStatus('Authentication data received');

        // Store the response data to display
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('intellifloAuthData', JSON.stringify(data));
        }

        // Redirect to Intelliflo page after a moment
        setTimeout(() => {
          router.push('/dashboard/intelliflo');
        }, 2000);
      } catch (error) {
        console.error('Error exchanging code:', error);
        setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    exchangeCode();
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Intelliflo Authentication</h1>
        <p className="text-lg">{status}</p>
        {status.startsWith('Error') && (
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Return Home
          </button>
        )}
      </div>
    </div>
  );
}
