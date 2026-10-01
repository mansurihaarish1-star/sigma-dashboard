import { Student, AttendanceRecord, RewardRecord, FeeReceipt, MonthlyAward } from './types';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-1',
    studentId: 'SIG-001',
    name: 'Abdullah Qureshi',
    standard: 'Std 10',
    batch: 'Evening Batch',
    parentName: 'obaidullah qureshi',
    parentMobile: '9313447991',
    admissionDate: '2026-05-01',
    monthlyFee: 2500,
    status: 'ACTIVE',
    createdAt: '2026-05-01',
    updatedAt: '2026-10-01'
  },
  {
    id: 'std-1790842668652',
    studentId: 'SIG-002',
    name: 'mohammad shaikh',
    standard: 'Std 10',
    batch: 'Evening Batch',
    parentName: 'soheb shaikh',
    parentMobile: '9773472488',
    admissionDate: '2026-05-01',
    monthlyFee: 2500,
    status: 'ACTIVE',
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01'
  },
  {
    id: 'std-1790842772104',
    studentId: 'SIG-003',
    name: 'Arsh qureshi',
    standard: 'Std 10',
    batch: 'Evening Batch',
    parentName: 'Xuz',
    parentMobile: '1234567898',
    admissionDate: '2026-05-01',
    monthlyFee: 2500,
    status: 'ACTIVE',
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01'
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_REWARDS: RewardRecord[] = [];

export const INITIAL_FEE_RECEIPTS: FeeReceipt[] = [];

export const INITIAL_AWARDS: MonthlyAward[] = [];
