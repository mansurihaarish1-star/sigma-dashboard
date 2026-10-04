export type StudentStatus = 'ACTIVE' | 'INACTIVE';

export const STANDARDS = [
  'Std 1',
  'Std 2',
  'Std 3',
  'Std 4',
  'Std 5',
  'Std 6',
  'Std 7',
  'Std 8',
  'Std 9',
  'Std 10',
  'Std 11',
  'Std 12',
] as const;

export type Standard = typeof STANDARDS[number] | string;

export interface Student {
  id: string;
  studentId: string; // e.g. SIG-001
  name: string;
  standard: Standard; // e.g. "Std 10"
  batch: string; // e.g. "Morning", "Evening"
  parentName: string;
  parentMobile: string;
  admissionDate: string; // YYYY-MM-DD
  monthlyFee: number;
  status: StudentStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LEAVE';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  batch: string;
  status: AttendanceStatus;
}

export interface RewardRecord {
  id: string;
  studentId: string;
  month: string; // YYYY-MM
  attendancePoints: number; // Max 150 (Classes Attended × 5)
  homeworkPoints: number;   // Max 100
  otherPoints: number;      // Max 50 (Mapped to Discipline for backward compatibility)
  disciplinePoints?: number;// Max 50 (Discipline)
  otherReason?: string;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Other';

export interface FeeReceipt {
  id: string;
  receiptNumber: string; // e.g. SIG-FEE-0001
  studentId: string;
  studentName: string;
  standard: string;
  period: string; // e.g. "September 2026"
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  remarks?: string;
}

export interface MonthlyAward {
  id: string;
  month: string; // YYYY-MM
  studentId: string;
  studentName: string;
  totalPoints: number;
  attendancePoints: number;
  homeworkPoints: number;
  otherPoints: number;
  disciplinePoints?: number;
  rewardAmount: number; // ₹300
  confirmed: boolean;
}

export interface StudentScoreSummary {
  student: Student;
  month: string;
  totalClassesConducted: number;
  classesPresent: number;
  classesAbsent: number;
  classesLeave: number;
  attendancePercentage: number;
  attendancePoints: number; // Max 150 (Classes Attended × 5)
  homeworkPoints: number;   // Max 100
  otherPoints: number;      // Max 50 (Discipline)
  disciplinePoints: number; // Max 50 (Discipline)
  otherReason?: string;
  totalPoints: number;      // Max 300 (attendancePoints + homeworkPoints + disciplinePoints)
  rank?: number;
}
