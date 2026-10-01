'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { DataStore } from '@/lib/store';
import { Student, FeeReceipt, PaymentMethod } from '@/lib/types';
import { 
  Receipt, 
  Plus, 
  Search, 
  Printer, 
  Eye, 
  X, 
  CheckCircle2, 
  GraduationCap, 
  IndianRupee, 
  Calendar,
  CreditCard
} from 'lucide-react';

function FeeReceiptsContent() {
  const searchParams = useSearchParams();
  const [feeList, setFeeList] = useState<FeeReceipt[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Recording Payment
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [period, setPeriod] = useState('September 2026');
  const [amount, setAmount] = useState<number>(2500);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [remarks, setRemarks] = useState('');

  // Modal State for Viewing / Printing Receipt
  const [selectedReceipt, setSelectedReceipt] = useState<FeeReceipt | null>(null);

  const loadData = () => {
    const fees = DataStore.getFeeReceipts();
    setFeeList(fees);
    const stds = DataStore.getStudents().filter(s => s.status === 'ACTIVE');
    setStudents(stds);

    if (stds.length > 0 && !selectedStudentId) {
      setSelectedStudentId(stds[0].id);
      setAmount(stds[0].monthlyFee);
    }
  };

  useEffect(() => {
    loadData();

    // Check if query params ask to open create modal or view specific receipt
    const actionParam = searchParams?.get('action');
    const viewParam = searchParams?.get('view');
    const stdIdParam = searchParams?.get('studentId');

    if (actionParam === 'create') {
      if (stdIdParam) setSelectedStudentId(stdIdParam);
      setIsRecordModalOpen(true);
    } else if (viewParam) {
      const rec = DataStore.getFeeReceipts().find(f => f.id === viewParam);
      if (rec) setSelectedReceipt(rec);
    }
  }, [searchParams]);

  const handleStudentSelect = (id: string) => {
    setSelectedStudentId(id);
    const std = students.find(s => s.id === id);
    if (std) {
      setAmount(std.monthlyFee);
    }
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) {
      alert('Please select a valid student');
      return;
    }

    const newReceipt = DataStore.addFeeReceipt({
      studentId: student.id,
      studentName: student.name,
      standard: student.standard,
      period,
      amount: Number(amount),
      paymentDate,
      paymentMethod,
      remarks,
    });

    setIsRecordModalOpen(false);
    loadData();
    // Open receipt modal directly after recording!
    setSelectedReceipt(newReceipt);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredFees = feeList.filter(f => 
    f.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.period.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 bg-slate-50 flex flex-col min-h-screen">
      <Header title="Fee Receipts" subtitle="Record fee payments & print official receipts" />

      <main className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto w-full print:hidden">
        {/* Top Control Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search receipt by student name or receipt #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Record Payment Button */}
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-purple-600/30 flex items-center justify-center space-x-2 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Fee Receipt</span>
          </button>
        </div>

        {/* Fee Receipts Table */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between text-xs font-bold">
            <span>Fee Receipt Register</span>
            <span>{filteredFees.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Standard</th>
                  <th className="py-3 px-4">Fee Period</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredFees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No fee receipts found.
                    </td>
                  </tr>
                ) : (
                  filteredFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                        {fee.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {fee.studentName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {fee.standard}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">
                        {fee.period}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">
                        ₹{fee.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {fee.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {fee.paymentDate}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedReceipt(fee)}
                          className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors inline-flex items-center space-x-1"
                          title="View & Print Receipt"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="font-bold text-[11px]">View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Record Fee Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-purple-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-purple-300" />
                <h3 className="font-bold text-base">Record Fee Payment</h3>
              </div>
              <button onClick={() => setIsRecordModalOpen(false)} className="text-purple-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              {/* Select Student */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Student *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {students.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.name} ({std.studentId} - {std.standard})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Fee Period */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fee Period *</label>
                  <input
                    type="text"
                    placeholder="e.g. September 2026"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                  />
                </div>

                {/* Amount Paid */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Payment Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Date *</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Paid full monthly tuition fee"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/30"
                >
                  Save &amp; Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🧾 VIEW & PRINTABLE RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:m-0 print:p-0">
            {/* Modal Actions Bar (Hidden during print) */}
            <div className="bg-purple-900 text-white px-5 py-3 flex items-center justify-between print:hidden">
              <span className="font-bold text-xs uppercase tracking-wider">Fee Receipt Preview</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="bg-amber-400 hover:bg-amber-300 text-purple-950 text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Download PDF</span>
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1 text-purple-200 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE RECEIPT CONTENT CONTAINER */}
            <div className="p-6 sm:p-8 space-y-6 text-slate-900 print:p-8 print:w-full">
              {/* Header */}
              <div className="text-center border-b-2 border-purple-900 pb-5">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-900 text-white font-bold mb-2">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-black text-purple-950 tracking-tight">SIGMA EDUCATION</h1>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-0.5">Official Fee Payment Receipt</p>
              </div>

              {/* Receipt No & Date */}
              <div className="flex items-center justify-between text-xs bg-purple-50 p-3 rounded-xl border border-purple-100 font-medium">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Receipt Number</span>
                  <span className="font-mono font-extrabold text-purple-900 text-sm">{selectedReceipt.receiptNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Payment Date</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.paymentDate}</span>
                </div>
              </div>

              {/* Student & Fee Details Table */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Student Name:</span>
                  <span className="font-extrabold text-slate-900">{selectedReceipt.studentName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Student ID:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedReceipt.studentId}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Standard:</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.standard}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Fee Period:</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.period}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Payment Method:</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.paymentMethod}</span>
                </div>

                {/* Amount Paid Box */}
                <div className="mt-4 p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-purple-300">Amount Paid</span>
                  <span className="text-xl font-extrabold text-amber-300">₹{selectedReceipt.amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Thank you Footer */}
              <div className="text-center pt-4 border-t border-slate-200 text-xs">
                <p className="font-bold text-purple-900">Thank you for choosing Sigma Education.</p>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">System Generated Receipt &bull; Sigma Education Admin</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeeReceiptsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading fee receipts...</div>}>
      <FeeReceiptsContent />
    </Suspense>
  );
}

