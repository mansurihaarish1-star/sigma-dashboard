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
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function RewardPointsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => DataStore.getSelectedMonth());
  const [students, setStudents] = useState<Student[]>([]);
  const [summaries, setSummaries] = useState<StudentScoreSummary[]>([]);

  // Modal for editing Homework & Discipline points
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingSummary, setEditingSummary] = useState<StudentScoreSummary | null>(null);
  const [homeworkPoints, setHomeworkPoints] = useState<number>(85);
  const [disciplinePoints, setDisciplinePoints] = useState<number>(30);
  const [otherReason, setOtherReason] = useState<string>('');

  const loadData = (monthToLoad = selectedMonth) => {
    const active = DataStore.getStudents().filter(s => s.status === 'ACTIVE');
    setStudents(active);

    const scores = DataStore.getMonthlyLeaderboard(monthToLoad);
    setSummaries(scores);
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

  const openEditModal = (summary: StudentScoreSummary) => {
    setEditingStudent(summary.student);
    setEditingSummary(summary);
    setHomeworkPoints(summary.homeworkPoints);
    setDisciplinePoints(summary.disciplinePoints !== undefined ? summary.disciplinePoints : summary.otherPoints);
    setOtherReason(summary.otherReason || '');
    setIsModalOpen(true);
  };

  const handleSavePoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    DataStore.saveRewardRecord({
      studentId: editingStudent.id,
      month: selectedMonth,
      attendancePoints: editingSummary?.attendancePoints || 0,
      homeworkPoints: Number(homeworkPoints),
      otherPoints: Number(disciplinePoints),
      disciplinePoints: Number(disciplinePoints),
      otherReason
    });

    setIsModalOpen(false);
    loadData();
  };

  const quickAddHomework = (pts: number) => {
    setHomeworkPoints(prev => Math.min(100, Math.max(0, prev + pts)));
  };

  const quickAddDiscipline = (pts: number, reason: string) => {
    setDisciplinePoints(prev => Math.min(50, Math.max(0, prev + pts)));
    if (!otherReason) setOtherReason(reason);
  };

  return (
    <div className="flex-1 bg-slate-50 flex flex-col min-h-screen">
      <Header title="Sigma Reward System" subtitle="Monthly 300-Points Evaluation (Attendance + Homework + Discipline)" />

      <main className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Month Selector & Rules Summary */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Monthly Reward Points</h2>
              <p className="text-xs text-slate-500">Max 300 points: Attendance (150) + Homework (100) + Discipline (50)</p>
            </div>

            {/* Month Picker */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Points Breakdown Cards Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-100 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                150
              </div>
              <div>
                <div className="text-xs font-bold text-purple-950">Attendance (150 Pts)</div>
                <div className="text-[11px] text-purple-700 font-semibold">1 Attended Class = 5 Points</div>
                <div className="text-[10px] text-purple-500">Max 150 pts after 30 classes</div>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                100
              </div>
              <div>
                <div className="text-xs font-bold text-blue-950">Homework (100 Pts)</div>
                <div className="text-[11px] text-blue-700 font-semibold">+5 / +10 per assignment</div>
                <div className="text-[10px] text-blue-500">Completed homework &amp; tasks</div>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-100 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                50
              </div>
              <div>
                <div className="text-xs font-bold text-amber-950">Discipline (50 Pts)</div>
                <div className="text-[11px] text-amber-700 font-semibold">Good conduct &amp; effort</div>
                <div className="text-[10px] text-amber-600">Classroom discipline &amp; participation</div>
              </div>
            </div>
          </div>

          {/* Simple Class-Based Formula Explainer */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-xs">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Simple Class-Based System:</span>
                <span className="text-white font-mono bg-purple-800/80 px-2 py-0.5 rounded text-[11px]">
                  Attendance Points = Classes Attended × 5
                </span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Present = +5 pts &bull; Absent = 0 pts &bull; Leave = 0 pts (No deductions or percentage rates used).
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-slate-200 font-medium text-[11px] shrink-0">
              Total = Attendance + Homework + Discipline (Max 300)
            </div>
          </div>
        </div>

        {/* Student Reward Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summaries.map((item) => {
            const disciplinePts = item.disciplinePoints !== undefined ? item.disciplinePoints : (item.otherPoints || 0);

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

                  {/* Prominent Current Score Badge (e.g. 105 / 300) */}
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Reward Score</div>
                    <div className="inline-block bg-purple-900 text-white px-3 py-1 rounded-xl text-sm font-black shadow-sm mt-0.5">
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

                {/* Individual Components Displayed Separately */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {/* Attendance Component */}
                  <div className="bg-purple-50/70 border border-purple-100 p-3 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-purple-950 uppercase tracking-wide block">
                        Attendance
                      </span>
                      <div className="text-base font-extrabold text-purple-700 mt-0.5">
                        {item.attendancePoints} <span className="text-[10px] text-slate-400 font-normal">/ 150</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-purple-200/60 text-[10px] space-y-0.5 font-medium">
                      <div className="text-slate-600">
                        Classes Attended: <strong className="text-slate-900 font-extrabold">{item.classesPresent}</strong>
                      </div>
                      <div className="text-purple-700 font-bold">
                        Attendance Points: <strong className="font-extrabold">{item.attendancePoints}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Homework Component */}
                  <div className="bg-blue-50/70 border border-blue-100 p-3 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wide block">
                        Homework
                      </span>
                      <div className="text-base font-extrabold text-blue-700 mt-0.5">
                        {item.homeworkPoints} <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-blue-200/60 text-[10px] text-slate-500 font-medium">
                      Completed tasks
                    </div>
                  </div>

                  {/* Discipline Component */}
                  <div className="bg-amber-50/70 border border-amber-100 p-3 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wide block">
                        Discipline
                      </span>
                      <div className="text-base font-extrabold text-amber-600 mt-0.5">
                        {disciplinePts} <span className="text-[10px] text-slate-400 font-normal">/ 50</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-amber-200/60 text-[10px] text-slate-500 font-medium">
                      Conduct &amp; effort
                    </div>
                  </div>
                </div>

                {/* Total Reward Score Calculation Bar */}
                <div className="bg-slate-100/90 px-3.5 py-2 rounded-xl text-xs flex items-center justify-between text-slate-700 border border-slate-200">
                  <div className="text-[11px] text-slate-600 font-semibold truncate mr-2">
                    Total: <strong className="text-purple-700">{item.attendancePoints}</strong> (Att) + <strong className="text-blue-700">{item.homeworkPoints}</strong> (HW) + <strong className="text-amber-700">{disciplinePts}</strong> (Disc) = <strong className="text-slate-900">{item.totalPoints} pts</strong>
                  </div>
                  <span className="text-xs font-black text-purple-950 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shrink-0">
                    {item.totalPoints} / 300
                  </span>
                </div>

                {item.otherReason && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-100 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="italic truncate">{item.otherReason}</span>
                  </div>
                )}

                {/* Edit Button */}
                <div className="pt-1 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 font-medium">
                    {item.classesPresent} attended × 5 pts = {item.attendancePoints} pts
                  </div>
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
              {/* Informational Attendance Box (Auto-calculated from attendance) */}
              <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200/70 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-950 uppercase tracking-wide">Attendance Points (Auto)</span>
                  <span className="text-xs font-extrabold text-purple-700">
                    {editingSummary ? editingSummary.attendancePoints : 0} / 150
                  </span>
                </div>
                <div className="text-xs text-purple-800 font-medium">
                  Classes Attended: <strong>{editingSummary ? editingSummary.classesPresent : 0}</strong> &times; 5 = <strong>{editingSummary ? editingSummary.attendancePoints : 0} Points</strong>
                </div>
                <div className="text-[10px] text-purple-600">
                  Attendance points are strictly class-based (+5 pts per present class) and update automatically from the Attendance section.
                </div>
              </div>

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

              {/* Discipline Points */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Discipline Points (Max 50)</label>
                  <span className="text-xs font-extrabold text-amber-600">{disciplinePoints} / 50</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={disciplinePoints}
                  onChange={(e) => setDisciplinePoints(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => quickAddDiscipline(5, 'Good classroom discipline')}
                    className="bg-amber-50 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-amber-200 hover:bg-amber-100"
                  >
                    +5 Good Conduct
                  </button>
                  <button
                    type="button"
                    onClick={() => quickAddDiscipline(10, 'Excellent participation & conduct')}
                    className="bg-amber-50 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-amber-200 hover:bg-amber-100"
                  >
                    +10 Excellent Conduct
                  </button>
                </div>
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Good classroom discipline and active participation"
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800"
                />
              </div>

              {/* Live Preview of Total Reward Points */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">Calculated Total Reward:</span>
                <span className="font-black text-purple-900 bg-purple-100 px-2.5 py-1 rounded-lg">
                  {Math.min(300, (editingSummary?.attendancePoints || 0) + Number(homeworkPoints) + Number(disciplinePoints))} / 300
                </span>
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
