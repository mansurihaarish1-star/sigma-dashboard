'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { DataStore } from '@/lib/store';
import { Student, StudentScoreSummary, FeeReceipt } from '@/lib/types';
import { 
  ArrowLeft, 
  User, 
  CalendarCheck, 
  Award, 
  Receipt, 
  Phone, 
  GraduationCap, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Percent, 
  Star,
  Printer
} from 'lucide-react';

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [attendanceStats, setAttendanceStats] = useState({ total: 0, present: 0, absent: 0, leave: 0, percentage: 0 });
  const [scoreSummary, setScoreSummary] = useState<StudentScoreSummary | null>(null);
  const [feeHistory, setFeeHistory] = useState<FeeReceipt[]>([]);
  const [currentMonth, setCurrentMonth] = useState('2026-09');

  useEffect(() => {
    if (!id) return;
    const std = DataStore.getStudentById(id);
    if (!std) {
      return;
    }
    setStudent(std);

    const month = new Date().toISOString().substring(0, 7);
    setCurrentMonth(month);

    // Fetch Attendance Stats
    const att = DataStore.getStudentAttendanceSummary(std.id, month);
    setAttendanceStats(att);

    // Fetch Reward Score Summary
    const score = DataStore.calculateStudentScoreForMonth(std, month);
    setScoreSummary(score);

    // Fetch Fee Receipts
    const fees = DataStore.getFeeReceiptsByStudent(std.id);
    setFeeHistory(fees);
  }, [id]);

  if (!student) {
    return (
      <div className="flex-1 bg-slate-50 flex flex-col min-h-screen">
        <Header title="Student Profile" />
        <div className="p-8 text-center max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200">
          <p className="text-sm font-bold text-slate-700">Student Not Found</p>
          <button
            onClick={() => router.push('/students')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl"
          >
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 flex flex-col min-h-screen">
      <Header title={`${student.name}'s Profile`} subtitle={`Student ID: ${student.studentId}`} />

      <main className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Back Button */}
        <Link
          href="/students"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-purple-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Students</span>
        </Link>

        {/* Section 1: Student Information */}
        <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-purple-600/30">
                {student.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">{student.name}</h1>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="text-xs font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                    {student.studentId}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    student.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {student.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right bg-slate-50 p-3 rounded-xl border border-slate-100 w-full sm:w-auto">
              <div className="text-xs text-slate-400 font-medium">Monthly Fee</div>
              <div className="text-lg font-extrabold text-slate-900">₹{student.monthlyFee.toLocaleString()}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Standard</span>
              <span className="font-bold text-slate-800 text-sm">{student.standard}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Batch</span>
              <span className="font-bold text-slate-800 text-sm">{student.batch}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Parent / Guardian</span>
              <span className="font-bold text-slate-800 text-sm">{student.parentName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Mobile Number</span>
              <a href={`tel:${student.parentMobile}`} className="font-bold text-purple-600 hover:underline flex items-center space-x-1 text-sm mt-0.5">
                <Phone className="w-3.5 h-3.5" />
                <span>{student.parentMobile}</span>
              </a>
            </div>
          </div>
        </section>

        {/* Section 2: Attendance Metrics */}
        <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-100">
            <CalendarCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Attendance Metrics</h2>
            <span className="text-xs text-slate-400 ml-auto font-medium">September 2026</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <div className="text-xs text-slate-500 font-semibold mb-1">Total Classes</div>
              <div className="text-2xl font-extrabold text-slate-900">{attendanceStats.total}</div>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
              <div className="text-xs text-emerald-700 font-semibold mb-1 flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Present</span>
              </div>
              <div className="text-2xl font-extrabold text-emerald-700">{attendanceStats.present}</div>
            </div>

            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-center">
              <div className="text-xs text-rose-700 font-semibold mb-1 flex items-center justify-center space-x-1">
                <XCircle className="w-3.5 h-3.5" />
                <span>Absent</span>
              </div>
              <div className="text-2xl font-extrabold text-rose-700">{attendanceStats.absent}</div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
              <div className="text-xs text-amber-700 font-semibold mb-1 flex items-center justify-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Leave / %</span>
              </div>
              <div className="text-2xl font-extrabold text-amber-700">{attendanceStats.percentage}%</div>
            </div>
          </div>
        </section>

        {/* Section 3: Reward Points */}
        <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">Reward Points Breakdown</h2>
            </div>
            <div className="bg-purple-100 text-purple-800 text-xs font-extrabold px-3 py-1 rounded-full border border-purple-200">
              Total: {scoreSummary ? scoreSummary.totalPoints : 0} / 300 Pts
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100">
              <div className="text-xs text-purple-700 font-bold mb-1">Attendance Points</div>
              <div className="text-xl font-extrabold text-purple-900">
                {scoreSummary?.attendancePoints || 0} <span className="text-xs text-purple-500 font-normal">/ 150</span>
              </div>
              <p className="text-[10px] text-purple-600 mt-1">Auto-calculated from present classes</p>
            </div>

            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
              <div className="text-xs text-blue-700 font-bold mb-1">Homework Points</div>
              <div className="text-xl font-extrabold text-blue-900">
                {scoreSummary?.homeworkPoints || 0} <span className="text-xs text-blue-500 font-normal">/ 100</span>
              </div>
              <p className="text-[10px] text-blue-600 mt-1">Completed assignments</p>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100">
              <div className="text-xs text-amber-700 font-bold mb-1">Other / Participation</div>
              <div className="text-xl font-extrabold text-amber-900">
                {scoreSummary?.otherPoints || 0} <span className="text-xs text-amber-500 font-normal">/ 50</span>
              </div>
              <p className="text-[10px] text-amber-700 mt-1 truncate">
                {scoreSummary?.otherReason || 'Participation & effort'}
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Fee Payments */}
        <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Fee Payment History</h2>
            </div>
            <Link
              href={`/fees?action=create&studentId=${student.id}`}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center"
            >
              + Record Payment
            </Link>
          </div>

          {feeHistory.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              No fee receipts recorded yet for this student.
            </div>
          ) : (
            <div className="space-y-3">
              {feeHistory.map((fee) => (
                <div key={fee.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-purple-700">{fee.receiptNumber}</span>
                      <span className="text-xs font-semibold text-slate-700">&bull; {fee.period}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Paid on {fee.paymentDate} via {fee.paymentMethod}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-emerald-600">₹{fee.amount.toLocaleString()}</div>
                    </div>
                    <Link
                      href={`/fees?view=${fee.id}`}
                      className="p-2 text-slate-600 hover:text-purple-600 bg-white border border-slate-200 rounded-lg hover:shadow-xs"
                      title="View Receipt"
                    >
                      <Printer className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
