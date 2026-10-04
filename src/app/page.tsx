'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { DataStore } from '@/lib/store';
import { Student, StudentScoreSummary, FeeReceipt, MonthlyAward } from '@/lib/types';
import { 
  Users, 
  CalendarCheck, 
  Trophy, 
  Receipt, 
  Plus, 
  ArrowUpRight, 
  Star, 
  TrendingUp, 
  Award, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const [activeStudents, setActiveStudents] = useState<Student[]>([]);
  const [todayAttendancePercent, setTodayAttendancePercent] = useState<number>(0);
  const [todayTotalMarked, setTodayTotalMarked] = useState<number>(0);
  const [sigmaStar, setSigmaStar] = useState<{ winners: StudentScoreSummary[]; confirmedAward?: MonthlyAward }>({ winners: [] });
  const [recentFees, setRecentFees] = useState<FeeReceipt[]>([]);
  const [top5Students, setTop5Students] = useState<StudentScoreSummary[]>([]);
  const [currentMonthStr, setCurrentMonthStr] = useState<string>(() => DataStore.getSelectedMonth());

  const loadDashboardData = () => {
    // Current date & selected/current month string
    const today = new Date().toISOString().split('T')[0];
    const month = DataStore.getSelectedMonth();
    setCurrentMonthStr(month);

    // 1. Total Active Students
    const students = DataStore.getStudents();
    const active = students.filter(s => s.status === 'ACTIVE');
    setActiveStudents(active);

    // 2. Today's Attendance
    const todayRecords = DataStore.getAttendanceByDateAndBatch(today);
    setTodayTotalMarked(todayRecords.length);
    if (todayRecords.length > 0) {
      const present = todayRecords.filter(r => r.status === 'PRESENT').length;
      setTodayAttendancePercent(Math.round((present / todayRecords.length) * 100));
    } else {
      // If no records for today, use overall current month average
      let totalPresent = 0;
      let totalCount = 0;
      active.forEach(s => {
        const sum = DataStore.getStudentAttendanceSummary(s.id, month);
        totalPresent += sum.present;
        totalCount += sum.total;
      });
      setTodayAttendancePercent(totalCount > 0 ? Math.round((totalPresent / totalCount) * 100) : 92);
    }

    // 3. This Month's Sigma Star
    const starInfo = DataStore.getSigmaStarWinner(month);
    setSigmaStar(starInfo);

    // 4. Pending / Recent Fee Payments
    const fees = DataStore.getFeeReceipts().slice(0, 4);
    setRecentFees(fees);

    // 5. Top 5 Students by Points
    const leaderboard = DataStore.getMonthlyLeaderboard(month);
    setTop5Students(leaderboard.slice(0, 5));
  };

  useEffect(() => {
    loadDashboardData();
    const handleSync = () => loadDashboardData();
    window.addEventListener('sigma_store_changed', handleSync);
    return () => window.removeEventListener('sigma_store_changed', handleSync);
  }, []);

  const winnerStudent = sigmaStar.winners[0];

  return (
    <div className="flex-1 bg-slate-50 flex flex-col min-h-screen">
      <Header title="Dashboard" subtitle="Sigma Education Management System" />

      <main className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Quick Action Buttons */}
        <section className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/students?action=add"
              className="flex items-center space-x-3 p-3.5 bg-purple-50 hover:bg-purple-100/80 border border-purple-200/60 rounded-xl transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30 group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-purple-950">Add Student</div>
                <div className="text-[10px] text-purple-600 font-medium">New Admission</div>
              </div>
            </Link>

            <Link
              href="/attendance"
              className="flex items-center space-x-3 p-3.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/60 rounded-xl transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-950">Mark Attendance</div>
                <div className="text-[10px] text-emerald-600 font-medium">Today&apos;s Class</div>
              </div>
            </Link>

            <Link
              href="/rewards"
              className="flex items-center space-x-3 p-3.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/60 rounded-xl transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 group-hover:scale-105 transition-transform">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-950">Add Reward Points</div>
                <div className="text-[10px] text-amber-600 font-medium">HW &amp; Discipline</div>
              </div>
            </Link>

            <Link
              href="/fees?action=create"
              className="flex items-center space-x-3 p-3.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/60 rounded-xl transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-blue-950">Create Fee Receipt</div>
                <div className="text-[10px] text-blue-600 font-medium">Record Payment</div>
              </div>
            </Link>
          </div>
        </section>

        {/* Key Metrics Overview Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Students */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Active Students</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{activeStudents.length}</p>
              <span className="inline-flex items-center text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full mt-2">
                Active Enrolments
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Today's Attendance */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Today&apos;s Attendance</p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">{todayAttendancePercent}%</p>
              <span className="text-[10px] text-slate-400 font-medium block mt-2">
                {todayTotalMarked > 0 ? `${todayTotalMarked} Marked Today` : 'Monthly avg rate'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Monthly Sigma Star */}
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-5 rounded-2xl shadow-md border border-purple-800 flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center space-x-1 text-[10px] text-purple-300 font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Sigma Star Winner</span>
              </div>
              <p className="text-lg font-bold text-white truncate max-w-[140px]">
                {winnerStudent ? winnerStudent.student.name : 'Calculating...'}
              </p>
              <div className="mt-2 inline-block bg-purple-500/40 text-amber-300 border border-purple-400/40 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                {winnerStudent ? `${winnerStudent.totalPoints} / 300 Pts` : '0 / 300'}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-purple-950 flex items-center justify-center font-bold shadow-lg shadow-amber-400/30 z-10 shrink-0">
              <Trophy className="w-7 h-7" />
            </div>
          </div>

          {/* Card 4: Fee Collection Summary */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Recent Receipts</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{recentFees.length}</p>
              <Link href="/fees" className="inline-flex items-center text-[10px] text-blue-600 font-semibold mt-2 hover:underline">
                <span>View Receipts</span>
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Dashboard Main Grid: Top 5 Points & Recent Fee Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 Students Leaderboard Preview */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Top 5 Students by Points</h3>
                    <p className="text-[11px] text-slate-500">September 2026 Monthly Ranking</p>
                  </div>
                </div>
                <Link
                  href="/sigma-star"
                  className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center"
                >
                  <span>Leaderboard</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100 mt-2">
                {top5Students.map((item, idx) => {
                  const isFirst = idx === 0;
                  return (
                    <div key={item.student.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isFirst ? 'bg-amber-400 text-purple-950 font-black' :
                          idx === 1 ? 'bg-slate-200 text-slate-700' :
                          idx === 2 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <Link href={`/students/${item.student.id}`} className="text-xs font-bold text-slate-800 hover:text-purple-600 transition-colors">
                            {item.student.name}
                          </Link>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {item.student.standard} &bull; {item.student.batch}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-extrabold text-purple-700">
                          {item.totalPoints} / 300
                        </div>
                        <div className="text-[9px] text-slate-400">
                          Att: {item.attendancePoints} ({item.classesPresent} cls) | HW: {item.homeworkPoints} | Disc: {item.disciplinePoints ?? item.otherPoints}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Fee Payments */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Recent Fee Payments</h3>
                    <p className="text-[11px] text-slate-500">Latest Recorded Transactions</p>
                  </div>
                </div>
                <Link
                  href="/fees"
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center"
                >
                  <span>View All</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100 mt-2">
                {recentFees.map((fee) => (
                  <div key={fee.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{fee.studentName}</div>
                      <div className="text-[10px] text-slate-400">
                        {fee.receiptNumber} &bull; {fee.period}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-emerald-600">
                        ₹{fee.amount.toLocaleString()}
                      </div>
                      <span className="inline-block text-[9px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {fee.paymentMethod}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
