'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { DataStore } from '@/lib/store';
import { useAuth } from '@/context/AuthContext';
import { 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  Database, 
  Globe, 
  Server,
  Lock
} from 'lucide-react';

export default function SettingsPage() {
  const { adminName } = useAuth();
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data back to the default initial sample data?')) {
      DataStore.resetToInitialData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 flex flex-col min-h-screen">
      <Header title="Settings &amp; Configuration" subtitle="System preferences and deployment status" />

      <main className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Admin Credentials Card */}
        <section className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900">Admin Account Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-medium block">Active Admin</span>
              <span className="text-sm font-extrabold text-slate-800">{adminName}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-medium block">Default Credentials</span>
              <span className="text-xs font-mono font-bold text-purple-700">sigma@2627 &bull; sigma123</span>
            </div>
          </div>
        </section>

        {/* Reset Data Card */}
        <section className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Database className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900">Database &amp; Sample Data Control</h2>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Clicking reset will restore all student enrolments, attendance history, 300-point reward records, and fee receipts to initial sample demo state.
          </p>

          <div className="flex items-center justify-between pt-2">
            {resetSuccess ? (
              <div className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sample data reset successfully!</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Reverts to 6 students with full September history</span>
            )}

            <button
              onClick={handleResetData}
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-purple-600" />
              <span>Reset Sample Data</span>
            </button>
          </div>
        </section>

        {/* Vercel Deployment Tips Card */}
        <section className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Globe className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">Vercel Deployment Guide</h2>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <p>
              This Next.js application is 100% production-ready for deployment on <strong>Vercel</strong>.
            </p>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] space-y-1 text-purple-300">
              <div>DATABASE_URL=&quot;postgresql://postgres:...@db.supabase.co:5432/postgres&quot;</div>
              <div>NEXTAUTH_SECRET=&quot;sigma-education-super-secret-key-2026&quot;</div>
            </div>
            <p className="text-slate-400">
              For complete deployment steps with GitHub and Supabase, refer to the included <strong className="text-white">README.md</strong> file in the project repository.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
