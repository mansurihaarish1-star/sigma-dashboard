'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { DataStore } from '@/lib/store';
import { StudentScoreSummary, MonthlyAward } from '@/lib/types';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  IndianRupee,
  HelpCircle,
  Medal,
  Star
} from 'lucide-react';

export default function SigmaStarPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => DataStore.getSelectedMonth());
  const [leaderboard, setLeaderboard] = useState<StudentScoreSummary[]>([]);
  const [starInfo, setStarInfo] = useState<{ winners: StudentScoreSummary[]; confirmedAward?: MonthlyAward }>({ winners: [] });
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const loadData = (monthToLoad = selectedMonth) => {
    const scores = DataStore.getMonthlyLeaderboard(monthToLoad);
    setLeaderboard(scores);

    const winnerData = DataStore.getSigmaStarWinner(monthToLoad);
    setStarInfo(winnerData);
    setIsConfirmed(!!winnerData.confirmedAward?.confirmed);
  };

  useEffect(() => {
    const saved = DataStore.getSelectedMonth();
    if (saved && saved !== selectedMonth) {
      setSelectedMonth(saved);
      loadData(saved);
    } else {
      loadData(selectedMonth);
    }

    const handleSync = () => loadData();
    window.addEventListener('sigma_store_changed', handleSync);

    const handleMonthSync = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail && customEvent.detail !== selectedMonth) {
        setSelectedMonth(customEvent.detail);
      }
    };
    window.addEventListener('sigma_month_changed', handleMonthSync);

    return () => {
      window.removeEventListener('sigma_store_changed', handleSync);
      window.removeEventListener('sigma_month_changed', handleMonthSync);
    };
  }, [selectedMonth]);

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    DataStore.setSelectedMonth(month);
  };

  const handleConfirmWinner = (winner: StudentScoreSummary) => {
    DataStore.confirmSigmaStar(selectedMonth, winner);
    loadData();
  };

  const topWinners = starInfo.winners;
  const isJointStar = topWinners.length > 1;

  return (
    <div className="flex-1 bg-slate-50 flex flex-col min-h-screen">
      <Header title="Monthly Sigma Star" subtitle="Leaderboard & Monthly Student Award Winner" />

      <main className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Month Picker Header */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Select Award Month</h2>
            <p className="text-xs text-slate-500">View rankings and confirm the monthly ₹300 reward winner</p>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* 🏆 SIGMA STAR OF THE MONTH HERO BANNER */}
        {topWinners.length > 0 && (
          <section className="bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-800 relative overflow-hidden">
            {/* Background Glow Effect */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left space-y-2">
                <div className="inline-flex items-center space-x-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
                  <Trophy className="w-4 h-4 text-amber-300" />
                  <span>{isJointStar ? '🏆 JOINT SIGMA STARS OF THE MONTH' : '🏆 SIGMA STAR OF THE MONTH'}</span>
                </div>

                <div className="space-y-1">
                  {topWinners.map((winner) => (
                    <h1 key={winner.student.id} className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {winner.student.name}
                    </h1>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                  <span className="text-xl font-extrabold text-amber-300 bg-purple-900/80 border border-purple-700/80 px-3.5 py-1 rounded-xl">
                    {topWinners[0].totalPoints} / 300 Points
                  </span>
                  <span className="text-sm font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-700/60 px-3 py-1 rounded-xl flex items-center space-x-1">
                    <span>Reward:</span>
                    <span className="text-emerald-400 font-extrabold">₹300</span>
                  </span>
                </div>
              </div>

              {/* Confirmation Button & Trophy Badge */}
              <div className="flex flex-col items-center space-y-3 shrink-0">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-purple-950 flex items-center justify-center shadow-xl shadow-amber-500/30 transform hover:scale-105 transition-transform">
                  <Trophy className="w-14 h-14" />
                </div>

                {isConfirmed ? (
                  <div className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Winner Confirmed</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConfirmWinner(topWinners[0])}
                    className="bg-amber-400 hover:bg-amber-300 text-purple-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-400/30 transition-all hover:scale-105"
                  >
                    Confirm Winner &amp; Award ₹300
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Tie-Breaker Explanation Banner */}
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-xs text-purple-950 flex items-start space-x-2.5">
          <HelpCircle className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Transparent Tie-Breaker Rules:</span> In case of tied total points, rank is decided by:
            1. Higher Attendance points &rarr; 2. Higher Homework points &rarr; 3. Higher Discipline points &rarr; 4. Joint Sigma Stars award.
          </div>
        </div>

        {/* 📊 MONTHLY LEADERBOARD TABLE */}
        <section className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Medal className="w-4 h-4 text-amber-400" />
              <h3 className="font-extrabold text-sm tracking-wide">Monthly Leaderboard</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">{selectedMonth}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">Rank</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 text-right">Attendance</th>
                  <th className="py-3 px-4 text-right">Homework</th>
                  <th className="py-3 px-4 text-right">Discipline</th>
                  <th className="py-3 px-4 text-right font-black text-purple-900">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {leaderboard.map((row) => {
                  const isWinner = row.rank === 1;

                  return (
                    <tr
                      key={row.student.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isWinner ? 'bg-purple-50/60 font-semibold' : ''
                      }`}
                    >
                      {/* Rank Cell */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                          row.rank === 1 ? 'bg-amber-400 text-purple-950 shadow-xs' :
                          row.rank === 2 ? 'bg-slate-200 text-slate-700' :
                          row.rank === 3 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {row.rank}
                        </span>
                      </td>

                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 flex items-center space-x-1.5">
                          <span>{row.student.name}</span>
                          {isWinner && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {row.student.studentId} &bull; {row.student.standard}
                        </div>
                      </td>

                      {/* Points Breakdown Cells */}
                      <td className="py-3.5 px-4 text-right text-purple-700 font-bold">
                        <div>{row.attendancePoints}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{row.classesPresent} cls</div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-blue-700 font-bold">
                        {row.homeworkPoints}
                      </td>
                      <td className="py-3.5 px-4 text-right text-amber-700 font-bold">
                        {row.disciplinePoints !== undefined ? row.disciplinePoints : row.otherPoints}
                      </td>

                      {/* Total Score */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-sm font-black text-purple-950 bg-purple-100/80 px-2.5 py-1 rounded-lg">
                          {row.totalPoints}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
