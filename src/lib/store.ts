import { 
  Student, 
  AttendanceRecord, 
  RewardRecord, 
  FeeReceipt, 
  MonthlyAward, 
  StudentScoreSummary 
} from './types';
import { 
  INITIAL_STUDENTS, 
  INITIAL_ATTENDANCE, 
  INITIAL_REWARDS, 
  INITIAL_FEE_RECEIPTS, 
  INITIAL_AWARDS 
} from './initialData';

const LOCAL_STORAGE_KEY = 'sigma_education_app_data_fresh_v2';
const LAST_SYNC_KEY = 'sigma_education_last_sync_timestamp';

interface AppStorageData {
  students: Student[];
  attendance: AttendanceRecord[];
  rewards: RewardRecord[];
  fees: FeeReceipt[];
  awards: MonthlyAward[];
  version?: number;
  lastUpdated?: string;
}

// Initial in-memory state
let memoryData: AppStorageData = {
  students: [],
  attendance: [],
  rewards: [],
  fees: [],
  awards: [],
  version: 0,
};

let isSyncing = false;
let lastSyncTime: Date | null = null;
let broadcastChannel: BroadcastChannel | null = null;

// Multi-tab sync channel
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('sigma_data_sync_channel');
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'STORE_UPDATED' && event.data?.data) {
        memoryData = event.data.data;
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(memoryData));
        } catch {}
        window.dispatchEvent(new CustomEvent('sigma_store_changed', { detail: memoryData }));
      }
    };
  } catch (e) {
    console.warn('BroadcastChannel initialization skipped:', e);
  }
}

// Helper to safely load data
const getStoreData = (): AppStorageData => {
  if (typeof window === 'undefined') {
    return memoryData;
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(memoryData));
      return memoryData;
    }
    const parsed = JSON.parse(raw);
    memoryData = parsed;
    return parsed;
  } catch (err) {
    console.error('Failed to load local storage data:', err);
    return memoryData;
  }
};

// Push local changes to the server API
const pushToServer = async (data: AppStorageData) => {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'FULL_SYNC', data }),
    });
    if (res.ok) {
      const result = await res.json();
      lastSyncTime = new Date();
      if (result.version) {
        memoryData.version = result.version;
      }
      try {
        localStorage.setItem(LAST_SYNC_KEY, lastSyncTime.toISOString());
      } catch {}
    }
  } catch (err) {
    console.warn('Background sync push to server failed (offline or server starting):', err);
  }
};

// Helper to save data locally and trigger background server sync
const saveStoreData = (data: AppStorageData) => {
  data.lastUpdated = new Date().toISOString();
  memoryData = data;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save to local storage:', err);
    }

    // Notify active components on this page
    window.dispatchEvent(new CustomEvent('sigma_store_changed', { detail: data }));

    // Notify other tabs in same browser
    try {
      broadcastChannel?.postMessage({ type: 'STORE_UPDATED', data });
    } catch {}

    // Send update to central server API for multi-user sync
    pushToServer(data);
  }
};

export const DataStore = {
  // --- SERVER SYNC METHODS ---
  syncWithServer: async (): Promise<boolean> => {
    if (typeof window === 'undefined' || isSyncing) return false;
    isSyncing = true;
    try {
      const res = await fetch('/api/sync', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error('Sync fetch failed');

      const result = await res.json();
      if (result.success && result.data) {
        const serverData: AppStorageData = result.data;
        const local = getStoreData();

        // If server data exists and is different from local, update
        const serverHasData = (serverData.students && serverData.students.length > 0) || (serverData.attendance && serverData.attendance.length > 0);
        const localIsEmpty = (!local.students || local.students.length === 0);

        if (serverHasData || localIsEmpty || (serverData.version && serverData.version > (local.version || 0))) {
          memoryData = serverData;
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serverData));
          lastSyncTime = new Date();
          localStorage.setItem(LAST_SYNC_KEY, lastSyncTime.toISOString());
          window.dispatchEvent(new CustomEvent('sigma_store_changed', { detail: serverData }));
          return true;
        } else if (local.students && local.students.length > 0 && !serverHasData) {
          // Push local data to seed empty server
          await pushToServer(local);
        }
      }
      lastSyncTime = new Date();
      return true;
    } catch (err) {
      console.warn('Sync with server error (using local cache):', err);
      return false;
    } finally {
      isSyncing = false;
    }
  },

  getLastSyncTime: (): Date | null => {
    if (!lastSyncTime && typeof window !== 'undefined') {
      const saved = localStorage.getItem(LAST_SYNC_KEY);
      if (saved) lastSyncTime = new Date(saved);
    }
    return lastSyncTime;
  },

  // --- STUDENTS ---
  getStudents: (): Student[] => {
    return getStoreData().students;
  },

  getStudentById: (id: string): Student | undefined => {
    const data = getStoreData();
    return data.students.find(s => s.id === id || s.studentId === id);
  },

  addStudent: (student: Omit<Student, 'id'>): Student => {
    const data = getStoreData();
    const newStudent: Student = {
      ...student,
      id: `std-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    data.students.push(newStudent);
    saveStoreData(data);
    return newStudent;
  },

  updateStudent: (id: string, updates: Partial<Student>): Student | null => {
    const data = getStoreData();
    const index = data.students.findIndex(s => s.id === id);
    if (index === -1) return null;
    data.students[index] = {
      ...data.students[index],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    saveStoreData(data);
    return data.students[index];
  },

  toggleStudentStatus: (id: string): Student | null => {
    const data = getStoreData();
    const student = data.students.find(s => s.id === id);
    if (!student) return null;
    const newStatus = student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return DataStore.updateStudent(id, { status: newStatus });
  },

  deleteStudent: (id: string): boolean => {
    const data = getStoreData();
    const initialLen = data.students.length;
    data.students = data.students.filter(s => s.id !== id);
    saveStoreData(data);
    return data.students.length < initialLen;
  },

  generateNextStudentId: (): string => {
    const students = getStoreData().students;
    const ids = students
      .map(s => parseInt(s.studentId.replace('SIG-', ''), 10))
      .filter(num => !isNaN(num));
    const max = ids.length > 0 ? Math.max(...ids) : 0;
    const nextNum = max + 1;
    return `SIG-${nextNum.toString().padStart(3, '0')}`;
  },

  // --- ATTENDANCE ---
  getAttendanceByDateAndBatch: (date: string, batch?: string): AttendanceRecord[] => {
    const data = getStoreData();
    return data.attendance.filter(r => r.date === date && (!batch || batch === 'All' || r.batch === batch));
  },

  getStudentAttendanceSummary: (studentId: string, monthPrefix?: string) => {
    const data = getStoreData();
    const records = data.attendance.filter(r => {
      if (r.studentId !== studentId) return false;
      if (monthPrefix && !r.date.startsWith(monthPrefix)) return false;
      return true;
    });

    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const leave = records.filter(r => r.status === 'LEAVE').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, leave, percentage };
  },

  saveAttendanceRecords: (records: AttendanceRecord[]) => {
    const data = getStoreData();
    records.forEach(newRec => {
      const idx = data.attendance.findIndex(
        r => r.studentId === newRec.studentId && r.date === newRec.date
      );
      if (idx !== -1) {
        data.attendance[idx] = newRec;
      } else {
        data.attendance.push(newRec);
      }
    });
    saveStoreData(data);
  },

  // --- REWARDS & LEADERBOARD ---
  getRewardRecord: (studentId: string, month: string): RewardRecord | undefined => {
    const data = getStoreData();
    return data.rewards.find(r => r.studentId === studentId && r.month === month);
  },

  saveRewardRecord: (record: Omit<RewardRecord, 'id'>): RewardRecord => {
    const data = getStoreData();
    const idx = data.rewards.findIndex(
      r => r.studentId === record.studentId && r.month === record.month
    );
    const updatedRecord: RewardRecord = {
      ...record,
      id: idx !== -1 ? data.rewards[idx].id : `rew-${Date.now()}`
    };

    if (idx !== -1) {
      data.rewards[idx] = updatedRecord;
    } else {
      data.rewards.push(updatedRecord);
    }
    saveStoreData(data);
    return updatedRecord;
  },

  calculateStudentScoreForMonth: (student: Student, month: string): StudentScoreSummary => {
    const data = getStoreData();
    
    // Attendance records for student in this month (YYYY-MM)
    const monthRecords = data.attendance.filter(
      r => r.studentId === student.id && r.date.startsWith(month)
    );
    
    const batchClassesDates = new Set(
      data.attendance
        .filter(r => r.date.startsWith(month) && (r.batch === student.batch || r.batch === 'All'))
        .map(r => r.date)
    );
    const totalClassesConducted = Math.max(batchClassesDates.size, monthRecords.length);

    const classesPresent = monthRecords.filter(r => r.status === 'PRESENT').length;
    const classesAbsent = monthRecords.filter(r => r.status === 'ABSENT').length;
    const classesLeave = monthRecords.filter(r => r.status === 'LEAVE').length;
    const attendancePercentage = totalClassesConducted > 0 
      ? Math.round((classesPresent / totalClassesConducted) * 100) 
      : 0;

    let attendancePoints = 0;
    if (totalClassesConducted > 0) {
      attendancePoints = Math.min(150, Math.round((classesPresent / totalClassesConducted) * 150));
    } else if (classesPresent > 0) {
      attendancePoints = Math.min(150, classesPresent * 6);
    }

    const rewardRec = data.rewards.find(r => r.studentId === student.id && r.month === month);
    const homeworkPoints = rewardRec ? Math.min(100, Math.max(0, rewardRec.homeworkPoints)) : 0;
    const otherPoints = rewardRec ? Math.min(50, Math.max(0, rewardRec.otherPoints)) : 0;
    const otherReason = rewardRec?.otherReason || '';

    const totalPoints = Math.min(300, attendancePoints + homeworkPoints + otherPoints);

    return {
      student,
      month,
      totalClassesConducted,
      classesPresent,
      classesAbsent,
      classesLeave,
      attendancePercentage,
      attendancePoints,
      homeworkPoints,
      otherPoints,
      otherReason,
      totalPoints
    };
  },

  getMonthlyLeaderboard: (month: string): StudentScoreSummary[] => {
    const data = getStoreData();
    const activeStudents = data.students.filter(s => s.status === 'ACTIVE');

    const summaries = activeStudents.map(s => DataStore.calculateStudentScoreForMonth(s, month));

    summaries.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.attendancePoints !== a.attendancePoints) return b.attendancePoints - a.attendancePoints;
      if (b.homeworkPoints !== a.homeworkPoints) return b.homeworkPoints - a.homeworkPoints;
      if (b.otherPoints !== a.otherPoints) return b.otherPoints - a.otherPoints;
      return a.student.name.localeCompare(b.student.name);
    });

    let currentRank = 1;
    summaries.forEach((item, index) => {
      if (index > 0) {
        const prev = summaries[index - 1];
        const isExactTie = 
          prev.totalPoints === item.totalPoints &&
          prev.attendancePoints === item.attendancePoints &&
          prev.homeworkPoints === item.homeworkPoints &&
          prev.otherPoints === item.otherPoints;
        
        if (!isExactTie) {
          currentRank = index + 1;
        }
      }
      item.rank = currentRank;
    });

    return summaries;
  },

  getSigmaStarWinner: (month: string): { winners: StudentScoreSummary[]; confirmedAward?: MonthlyAward } => {
    const leaderboard = DataStore.getMonthlyLeaderboard(month);
    if (leaderboard.length === 0) return { winners: [] };

    const topScore = leaderboard[0].totalPoints;
    const topWinners = leaderboard.filter(s => 
      s.totalPoints === topScore &&
      s.attendancePoints === leaderboard[0].attendancePoints &&
      s.homeworkPoints === leaderboard[0].homeworkPoints &&
      s.otherPoints === leaderboard[0].otherPoints
    );

    const data = getStoreData();
    const confirmedAward = data.awards.find(a => a.month === month);

    return { winners: topWinners, confirmedAward };
  },

  confirmSigmaStar: (month: string, winner: StudentScoreSummary): MonthlyAward => {
    const data = getStoreData();
    const idx = data.awards.findIndex(a => a.month === month);
    const newAward: MonthlyAward = {
      id: idx !== -1 ? data.awards[idx].id : `award-${Date.now()}`,
      month,
      studentId: winner.student.id,
      studentName: winner.student.name,
      totalPoints: winner.totalPoints,
      attendancePoints: winner.attendancePoints,
      homeworkPoints: winner.homeworkPoints,
      otherPoints: winner.otherPoints,
      rewardAmount: 300,
      confirmed: true
    };

    if (idx !== -1) {
      data.awards[idx] = newAward;
    } else {
      data.awards.push(newAward);
    }
    saveStoreData(data);
    return newAward;
  },

  // --- FEE RECEIPTS ---
  getFeeReceipts: (): FeeReceipt[] => {
    return getStoreData().fees.sort(
      (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
  },

  getFeeReceiptsByStudent: (studentId: string): FeeReceipt[] => {
    return DataStore.getFeeReceipts().filter(f => f.studentId === studentId);
  },

  generateReceiptNumber: (): string => {
    const fees = getStoreData().fees;
    const numbers = fees
      .map(f => parseInt(f.receiptNumber.replace('SIG-FEE-', ''), 10))
      .filter(n => !isNaN(n));
    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    const next = max + 1;
    return `SIG-FEE-${next.toString().padStart(4, '0')}`;
  },

  addFeeReceipt: (receipt: Omit<FeeReceipt, 'id' | 'receiptNumber'>): FeeReceipt => {
    const data = getStoreData();
    const receiptNumber = DataStore.generateReceiptNumber();
    const newFee: FeeReceipt = {
      ...receipt,
      id: `fee-${Date.now()}`,
      receiptNumber
    };
    data.fees.push(newFee);
    saveStoreData(data);
    return newFee;
  },

  // --- RESET ALL DATA ---
  resetToInitialData: () => {
    const emptyState: AppStorageData = {
      students: [],
      attendance: [],
      rewards: [],
      fees: [],
      awards: [],
      version: 0,
    };
    saveStoreData(emptyState);
    if (typeof window !== 'undefined') {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET' }),
      }).catch(console.warn);
    }
    return emptyState;
  }
};

// Automatic background sync initialization in browser
if (typeof window !== 'undefined') {
  // Sync on startup
  setTimeout(() => {
    DataStore.syncWithServer();
  }, 100);

  // Sync on window focus / tab visibility
  window.addEventListener('focus', () => {
    DataStore.syncWithServer();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      DataStore.syncWithServer();
    }
  });

  // Background polling every 4 seconds to sync any edits made by other users
  setInterval(() => {
    DataStore.syncWithServer();
  }, 4000);
}
