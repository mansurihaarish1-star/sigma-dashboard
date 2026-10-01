'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { DataStore } from '@/lib/store';
import { Student, StudentScoreSummary } from '@/lib/types';
import { 
  Star, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  Plus, 
  Calendar, 
  Edit3, 
  Save, 
  X,
  Sparkles
} from 'lucide-react';

export default function RewardPointsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [students, setStudents] = useState<Student[]>([]);
  const [summaries, setSummaries] = useState<StudentScoreSummary[]>([]);

  // Modal for editing Homework & Other points
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [homeworkPoints, setHomeworkPoints] = useState<number>(85);
  const [otherPoints, setOtherPoints] = useState<number>(30);
  const [otherReason, setOtherReason] = useState<string>('');

  const loadData = () => {
    const active = DataStore.getStudents().filter(s => s.status === 'ACTIVE');
    setStudents(active);

    const scores = DataStore.getMonthlyLeaderboard(selectedMonth);
    setSummaries(scores);
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const openEditModal = (summary: StudentScoreSummary) => {
    setEditingStudent(summary.student);
    setHomeworkPoints(summary.homeworkPoints);
    setOtherPoints(summary.otherPoints);
    setOtherReason(summary.otherReason || '');
    setIsModalOpen(true);
  };

  const handleSavePoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    DataStore.saveRewardRecord({
      studentId: editingStudent.id,
      month: selectedMonth,
      attendancePoints: 0, // Auto-calculated by DataStore
      homeworkPoints: Number(homeworkPoints),
      otherPoints: Number(otherPoints),
      otherReason
    });

    setIsModalOpen(false);
    loadData();
  };

  const quickAddHomework = (pts: number) => {
    setHomeworkPoints(prev => Math.min(100, Math.max(0, prev + pts)));
  };

  const quickAddOther = (pts: number, reason: string) => {
    setOtherPoints(prev => Math.min(50, Math.max(0, prev + pts)));
    if (!otherReason) setOtherReason(reason);
  };

  return (
    <div className="flex-1 bg-slate-50 flex flex-col min-h-screen">
      <Header title="Sigma Reward System" subtitle="Monthly 300-Points Evaluation (Attendance + Homework + Participation)" />

      <main className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Month Selector & Rules Summary */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Monthly Reward Points</h2>
              <p className="text-xs text-slate-500">Max 300 points: Attendance (150) + Homework (100) + Other (50)</p>
            </div>

            {/* Month Picker */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Points Breakdown Cards Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                150
              </div>
              <div>
                <div className="text-xs font-bold text-purple-950">Attendance (150 Pts)</div>
                <div className="text-[10px] text-purple-600 font-medium">Auto-calculated per class</div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                100
              </div>
              <div>
                <div className="text-xs font-bold text-blue-950">Homework (100 Pts)</div>
                <div className="text-[10px] text-blue-600 font-medium">+5 per assignment completed</div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                50
              </div>
              <div>
                <div className="text-xs font-bold text-amber-950">Other / Participation (50 Pts)</div>
                <div className="text-[10px] text-amber-600 font-medium">+5 or +10 with reason</div>
              </div>
            </div>
          </div>
        </div>

        {/* Student Reward Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summaries.map((item) => {
            const isTop3 = item.rank && item.rank <= 3;

            return (
              <div
                key={item.student.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Header: Student Name & Total Score Pill */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-extrabold text-slate-900">{item.student.name}</span>
                      <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                        {item.student.studentId}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-medium mt-0.5">
                      {item.student.standard} &bull; {item.student.batch}
                    </div>
                  </div>

                  {/* Prominent Current Score Badge (e.g. 245 / 300) */}
                  <div className="text-right">
                    <div className="inline-block bg-purple-900 text-white px-3 py-1 rounded-xl text-sm font-black shadow-sm">
                      <span className="text-amber-300">{item.totalPoints}</span>
                      <span className="text-purple-300 font-normal text-xs"> / 300</span>
                    </div>
                    {item.rank && (
                      <div className="text-[10px] font-bold text-slate-400 mt-1">
                        Rank #{item.rank}
                      </div>
                    )}
                  </div>
                </div>

                {/* Breakdown List */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="border-r border-slate-200 pr-1">
                    <span className="text-[10px] text-slate-400 font-medium block">Attendance</span>
                    <span className="font-extrabold text-purple-700">{item.attendancePoints}</span>
                    <span className="text-[9px] text-slate-400"> / 150</span>
                  </div>
                  <div className="border-r border-slate-200 pr-1">
                    <span className="text-[10px] text-slate-400 font-medium block">Homework</span>
                    <span className="font-extrabold text-blue-700">{item.homeworkPoints}</span>
                    <span className="text-[9px] text-slate-400"> / 100</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Other</span>
                    <span className="font-extrabold text-amber-600">{item.otherPoints}</span>
                    <span className="text-[9px] text-slate-400"> / 50</span>
                  </div>
                </div>

                {item.otherReason && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-100 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="italic truncate">{item.otherReason}</span>
                  </div>
                )}

                {/* Edit Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => openEditModal(item)}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs px-3.5 py-1.5 rounded-xl border border-purple-200 flex items-center space-x-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Points</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Edit Reward Points Modal */}
      {isModalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-purple-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Edit Reward Points</h3>
                <p className="text-xs text-purple-300">{editingStudent.name} ({editingStudent.studentId})</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-purple-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePoints} className="p-6 space-y-4">
              {/* Homework Points */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Homework Points (Max 100)</label>
                  <span className="text-xs font-extrabold text-blue-600">{homeworkPoints} / 100</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={homeworkPoints}
                  onChange={(e) => setHomeworkPoints(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => quickAddHomework(5)}
                    className="bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-100"
                  >
                    +5 Completed HW
                  </button>
                  <button
                    type="button"
                    onClick={() => quickAddHomework(10)}
                    className="bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-100"
                  >
                    +10 HW Bonus
                  </button>
                </div>
              </div>

              {/* Other / Participation Points */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Other / Participation (Max 50)</label>
                  <span className="text-xs font-extrabold text-amber-600">{otherPoints} / 50</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={otherPoints}
                  onChange={(e) => setOtherPoints(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => quickAddOther(5, 'Excellent participation')}
                    className="bg-amber-50 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-amber-200 hover:bg-amber-100"
                  >
                    +5 Participation
                  </button>
                  <button
                    type="button"
                    onClick={() => quickAddOther(10, 'Excellent performance')}
                    className="bg-amber-50 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-amber-200 hover:bg-amber-100"
                  >
                    +10 Performance
                  </button>
                </div>
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Excellent math participation"
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/30"
                >
                  Save Points
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
