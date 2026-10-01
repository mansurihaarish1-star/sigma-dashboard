'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  GraduationCap, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  KeyRound
} from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('sigma@2627');
  const [password, setPassword] = useState('sigma123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleQuickFill = () => {
    setUsername('sigma@2627');
    setPassword('sigma123');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    setTimeout(() => {
      const success = login(username, password);
      if (success) {
        router.push('/');
      } else {
        setError('Invalid credentials! Please use username: sigma@2627 and password: sigma123');
        setIsSubmitting(false);
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-purple-500 selection:text-white">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-violet-600/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b12_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b12_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-9 shadow-2xl backdrop-blur-xl relative z-10 transition-all">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-500 text-white shadow-xl shadow-purple-600/40 mb-4 transform hover:scale-105 transition-all">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            SIGMA EDUCATION
          </h1>
          <p className="text-xs sm:text-sm text-purple-300/90 font-medium mt-1.5 flex items-center justify-center space-x-1.5">
            <span>Tuition Management Portal</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium flex items-start space-x-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-mono"
                placeholder="sigma@2627"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-mono"
                placeholder="sigma123"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-purple-600/30 hover:shadow-purple-500/50 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50 cursor-pointer"
          >
            <span>{isSubmitting ? 'Signing in...' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials Box */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/80 border border-purple-500/20 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5 text-xs text-purple-300 font-semibold">
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                <span>Authorized Admin Access</span>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-[11px] font-bold text-purple-400 hover:text-purple-300 underline underline-offset-2 flex items-center space-x-1 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>1-Click Auto Fill</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 pt-1">
              <div className="bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-sans">Username</span>
                <span className="text-purple-300 font-bold">sigma@2627</span>
              </div>
              <div className="bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-sans">Password</span>
                <span className="text-indigo-300 font-bold">sigma123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
