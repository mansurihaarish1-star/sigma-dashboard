'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { DataStore } from '@/lib/store';
import { Student, StudentStatus, STANDARDS } from '@/lib/types';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  UserCheck, 
  UserX, 
  Phone, 
  ChevronRight,
  X,
  GraduationCap,
  Calendar,
  IndianRupee,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStandard, setSelectedStandard] = useState('All');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form Fields
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [standard, setStandard] = useState<string>('Std 10');
  const [batch, setBatch] = useState('Evening Batch');
  const [parentName, setParentName] = useState('');
  const [parentMobile, setParentMobile] = useState('');
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyFee, setMonthlyFee] = useState<number>(2500);
  const [status, setStatus] = useState<StudentStatus>('ACTIVE');

  const router = useRouter();

  const loadData = () => {
    setStudents(DataStore.getStudents());
  };

  useEffect(() => {
    loadData();
    const handleSync = () => {
      loadData();
    };
    window.addEventListener('sigma_store_changed', handleSync);
    return () => window.removeEventListener('sigma_store_changed', handleSync);
  }, []);

  const openAddModal = () => {
    setEditingStudent(null);
    setStudentId(DataStore.generateNextStudentId());
    setName('');
    setStandard('Std 10');
    setBatch('Evening Batch');
    setParentName('');
    setParentMobile('');
    setAdmissionDate(new Date().toISOString().split('T')[0]);
    setMonthlyFee(2500);
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setStudentId(student.studentId);
    setName(student.name);
    setStandard(student.standard);
    setBatch(student.batch);
    setParentName(student.parentName);
    setParentMobile(student.parentMobile);
    setAdmissionDate(student.admissionDate);
    setMonthlyFee(student.monthlyFee);
    setStatus(student.status);
    setIsModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !parentName.trim() || !parentMobile.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingStudent) {
      DataStore.updateStudent(editingStudent.id, {
        studentId,
        name,
        standard,
        batch,
        parentName,
        parentMobile,
        admissionDate,
        monthlyFee: Number(monthlyFee),
        status,
      });
    } else {
      DataStore.addStudent({
        studentId,
        name,
        standard,
        batch,
        parentName,
        parentMobile,
        admissionDate,
        monthlyFee: Number(monthlyFee),
        status,
      });
    }

    setIsModalOpen(false);
    loadData();
  };

  const handleToggleStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    DataStore.toggleStudentStatus(id);
    loadData();
  };

  // Filter Logic
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parentMobile.includes(searchQuery);

    const matchesStandard = selectedStandard === 'All' || s.standard === selectedStandard;
    const matchesBatch = selectedBatch === 'All' || s.batch === selectedBatch;
    const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus;

    return matchesSearch && matchesStandard && matchesBatch && matchesStatus;
  });

  return (
    <div className="flex-1 bg-slate-50 flex flex-col min-h-screen">
      <Header title="Student Management" subtitle="Add, view, and manage tuition students" />

      <main className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto w-full">
        {/* Top Control Bar: Search, Filters, Add Button */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/90 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name, ID or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Add Student Primary Action */}
            <button
              onClick={openAddModal}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md shadow-purple-600/30 flex items-center justify-center space-x-2 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-1 text-slate-400 text-xs font-medium mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            {/* Standard Filter */}
            <select
              value={selectedStandard}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
            >
              <option value="All">All Standards</option>
              {STANDARDS.map((std) => (
                <option key={std} value={std}>
                  {std}
                </option>
              ))}
            </select>

            {/* Batch Filter */}
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
            >
              <option value="All">All Batches</option>
              <option value="Morning Batch">Morning Batch</option>
              <option value="Evening Batch">Evening Batch</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
            >
              <option value="All">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Student Cards Grid / Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-2xl text-center border border-slate-200">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No students found</p>
              <p className="text-xs text-slate-400 mt-1">Try changing your search query or filters.</p>
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                onClick={() => router.push(`/students/${student.id}`)}
                className={`bg-white rounded-2xl border p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative group ${
                  student.status === 'INACTIVE' ? 'opacity-60 border-slate-200' : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                <div>
                  {/* Top Line: ID & Status */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
                      {student.studentId}
                    </span>
                    <button
                      onClick={(e) => handleToggleStatus(student.id, e)}
                      title="Click to toggle status"
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                        student.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {student.status === 'ACTIVE' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-3 h-3" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Student Name */}
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors">
                    {student.name}
                  </h3>

                  {/* Standard & Batch Tags */}
                  <div className="flex items-center space-x-2 mt-1 mb-3">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {student.standard}
                    </span>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {student.batch}
                    </span>
                  </div>

                  {/* Details List */}
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Parent:</span>
                      <span className="font-medium text-slate-800">{student.parentName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Mobile:</span>
                      <a
                        href={`tel:${student.parentMobile}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-purple-600 hover:underline flex items-center space-x-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{student.parentMobile}</span>
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Monthly Fee:</span>
                      <span className="font-bold text-slate-900">₹{student.monthlyFee.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(student);
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-purple-600 flex items-center space-x-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <span className="text-xs font-bold text-purple-600 flex items-center space-x-0.5 group-hover:translate-x-0.5 transition-transform">
                    <span>View Profile</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-purple-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-purple-300" />
                <h3 className="font-bold text-base">
                  {editingStudent ? 'Edit Student Details' : 'Add New Student'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-purple-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Student ID</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StudentStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Zoya Khan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Standard *</label>
                  <select
                    value={standard}
                    onChange={(e) => setStandard(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {STANDARDS.map((std) => (
                      <option key={std} value={std}>
                        {std}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Batch *</label>
                  <select
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Morning Batch">Morning Batch</option>
                    <option value="Evening Batch">Evening Batch</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Parent Name *</label>
                  <input
                    type="text"
                    placeholder="Parent / Guardian Name"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Parent Mobile *</label>
                  <input
                    type="tel"
                    placeholder="10 digit mobile"
                    value={parentMobile}
                    onChange={(e) => setParentMobile(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Admission Date</label>
                  <input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monthly Fee (₹)</label>
                  <input
                    type="number"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/30"
                >
                  {editingStudent ? 'Update Student' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
