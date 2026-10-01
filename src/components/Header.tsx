'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DataStore } from '@/lib/store';
import { GraduationCap, LogOut, UserCheck, RefreshCw, Check } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { adminName, logout } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncText, setLastSyncText] = useState('Live');

  const handleManualSync = async () => {
    setIsSyncing(true);
    await DataStore.syncWithServer();
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncText('Synced');
      setTimeout(() => setLastSyncText('Live'), 2500);
    }, 400);
  };

  useEffect(() => {
    const handleSyncEvent = () => {
      setLastSyncText('Synced');
      setTimeout(() => setLastSyncText('Live'), 2500);
    };
    window.addEventListener('sigma_store_changed', handleSyncEvent);
    return () => window.removeEventListener('sigma_store_changed', handleSyncEvent);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Brand icon on mobile */}
      <div className="flex items-center space-x-3">
        <Link href="/" className="md:hidden flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 text-base tracking-tight">SIGMA</span>
        </Link>
        
        <div className="hidden md:block">
          {title && <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>}
          {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
      </div>

      {/* Sync Status & Admin User controls */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        {/* Real-time Multi-user Sync Badge */}
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          title="Multi-user Cloud Sync Active. Click to sync instantly."
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100/70 transition-all cursor-pointer"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold hidden sm:inline">{isSyncing ? 'Syncing...' : lastSyncText}</span>
          <RefreshCw className={`w-3 h-3 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>

        <div className="flex items-center space-x-2 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100">
          <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-purple-900 hidden sm:inline">{adminName}</span>
          <span className="text-[10px] font-bold uppercase bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded-md">Admin</span>
        </div>

        <button
          onClick={logout}
          title="Sign Out"
          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

