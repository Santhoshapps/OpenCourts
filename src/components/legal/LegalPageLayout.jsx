import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home } from 'lucide-react';

export default function LegalPageLayout({ children, title }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/11bc0e5e4_ChatGPTImageJul29202509_56_38AM.png?v=cachebust2" alt="OpenCourts Logo" className="w-10 h-10" />
            <h1 className="text-xl font-bold text-gray-800">OpenCourts Legal</h1>
          </div>
          <Link to={createPageUrl("Home")}>
            <Home className="w-5 h-5 text-gray-600 hover:text-emerald-600" />
          </Link>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white p-6 sm:p-10 rounded-lg shadow-md">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-4">{title}</h2>
            <div className="prose prose-lg max-w-none text-gray-700">
                {children}
            </div>
        </div>
      </main>
      <footer className="text-center py-6 text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} OpenCourts. All rights reserved.</p>
      </footer>
    </div>
  );
}