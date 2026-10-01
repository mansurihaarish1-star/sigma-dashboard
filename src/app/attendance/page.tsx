'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { DataStore } from '@/lib/store';
import { Student, AttendanceStatus, AttendanceRecord } from '@/lib/types';
import { 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Save, 
  CheckCheck,
  Calendar,
  Filter,
  Users
} from 'lucide-react';

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedBatch, setSelectedBatch] = useState<string>('All');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load students & existing attendance for selected date
  useEffect(() => {
    const allStudents = DataStore.getStudents().filter(s => s.status === 'ACTIVE');
    setStudents(allStudents);

    const existingRecords = DataStore.getAttendanceByDateAndBatch(selectedDate);
    const map: Record<string, AttendanceStatus> = {};

    allStudents.forEach(s => {
      const rec = existingRecords.find(r => r.studentId === s.id);
      map[s.id] = rec ? rec.status : 'PRESENT'; // Default to Present for speed
    });

    setAttendanceMap(map);
    setSaveSuccess(false);
  }, [selectedDate]);

  // Filter students by batch
  const filteredStudents = students.filter(s => 
    selectedBatch === 'All' || s.batch === selectedBatch
  );

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }));
    setSaveSuccess(false);
  };

  const markAllPresent = () => {
    const updatedMap = { ...attendanceMap };
    filteredStudents.forEach(s => {
      updatedMap[s.id] = 'PRESENT';
    });
    setAttendanceMap(updatedMap);
    setSaveSuccess(false);
  };

  const handleSaveAttendance = () => {
    const recordsToSave: AttendanceRecord[] = filteredStudents.map(s => ({
      id: `att-${s.id}-${selectedDate}`,
      studentId: s.id,
      date: selectedDate,
      batch: s.batch,
      status: attendanceMap[s.id] || 'PRESENT'
    }));

    DataStore.saveAttendanceRecords(recordsToSave);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Quick Stats for current date selection
  const totalCount = filteredStudents.length;
  const presentCount = filteredStudents.filter(s => attendanceMap[s.id] === 'PRESENT').length;
  const absentCount = filteredStudents.filter(s => attendanceMap[s.id] === 'ABSENT').length;
  const leaveCount = filteredStudents.filter(s => attendanceMap[s.id] === 'LEAVE').length;

  return (
    <div className="flex-1 bg-slate-50 flex flex-col min-h-screen">
      <Header title="Attendance Tracking" subtitle="Record daily attendance for tuition batches" />

      <main className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto w-full">
        {/* Date & Batch Selection Control Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200/90 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                <span>Select Attendance Date</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Batch Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                <Filter className="w-3.5 h-3.5 text-purple-600" />
                <span>Select Batch</span>
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="All">All Batches</option>
                <option value="Morning Batch">Morning Batch</option>
                <option value="Evening Batch">Evening Batch</option>
              </select>
            </div>
          </div>

          {/* Quick Metrics & Mark All Present Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center space-x-3 text-xs">
              <span className="font-bold text-slate-700">Total: {totalCount}</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">🟢 Present: {presentCount}</span>
              <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">🔴 Absent: {absentCount}</span>
              <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">🟡 Leave: {leaveCount}</span>
            </div>

            <button
              onClick={markAllPresent}
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-purple-600" />
              <span>Mark All Present</span>
            </button>
          </div>
        </div>

        {/* Student Attendance List */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between text-xs font-bold">
            <span>Student Name &amp; ID</span>
            <span>Attendance Status</span>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active students found in this batch.
              </div>
            ) : (
              filteredStudents.map((student) => {
                const currentStatus = attendanceMap[student.id] || 'PRESENT';

                return (
                  <div key={student.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-extrabold text-slate-900">{student.name}</span>
                        <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                          {student.studentId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {student.standard} &bull; {student.batch}
                      </div>
                    </div>

                    {/* Status Toggle Buttons */}
                    <div className="flex items-center space-x-2">
                      {/* 🟢 Present */}
                      <button
                        onClick={() => setStudentStatus(student.id, 'PRESENT')}
                        className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1 transition-all ${
                          currentStatus === 'PRESENT'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-600'
                            : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Present</span>
                      </button>

                      {/* 🔴 Absent */}
                      <button
                        onClick={() => setStudentStatus(student.id, 'ABSENT')}
                        className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1 transition-all ${
                          currentStatus === 'ABSENT'
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-600'
                            : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Absent</span>
                      </button>

                      {/* 🟡 Leave */}
                      <button
                        onClick={() => setStudentStatus(student.id, 'LEAVE')}
                        className={`flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1 transition-all ${
                          currentStatus === 'LEAVE'
                            ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-500'
                            : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        <span>Leave</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Save Action Bar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            {saveSuccess ? (
              <div className="text-xs font-bold text-emerald-600 flex items-center space-x-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Attendance saved successfully!</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Be sure to save attendance after updates</span>
            )}

            <button
              onClick={handleSaveAttendance}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-purple-600/30 flex items-center space-x-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Attendance</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
