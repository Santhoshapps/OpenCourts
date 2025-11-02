import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { createPageUrl } from "@/utils";

export default function OauthCallback() {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing Google authorization...');

  useEffect(() => {
    // This code handles the ?code=... and ?error=... params from Google's redirect
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(`Authorization failed: ${error}. Redirecting back to Admin panel...`);
      setTimeout(() => {
        window.location.href = createPageUrl('Admin');
      }, 3000);
      return;
    }

    if (code) {
      // The most important step: store the code where the Admin page can find it.
      sessionStorage.setItem('google_oauth_code', code);
      setStatus('success');
      setMessage('Authorization successful! Redirecting...');
      
      // Redirect back to the admin page to complete the process.
      setTimeout(() => {
        window.location.href = createPageUrl('Admin');
      }, 1500);
    } else {
      // This handles cases where the redirect happens without a code or error.
      setStatus('error');
      setMessage('No authorization code was received from Google. Redirecting...');
      setTimeout(() => {
        window.location.href = createPageUrl('Admin');
      }, 3000);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />}
            {status === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
            {status === 'error' && <AlertCircle className="w-6 h-6 text-red-600" />}
            Google Calendar Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}