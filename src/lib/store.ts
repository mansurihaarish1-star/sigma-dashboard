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

const LOCAL_STORAGE_KEY = 'sigma_education_app_data_v4';
const LAST_SYNC_KEY = 'sigma_education_last_sync_timestamp';
const SELECTED_MONTH_KEY = 'sigma_selected_month';

export const getCurrentMonthString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

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
  students: INITIAL_STUDENTS,
  attendance: INITIAL_ATTENDANCE,
  rewards: INITIAL_REWARDS,
  fees: INITIAL_FEE_RECEIPTS,
  awards: INITIAL_AWARDS,
  version: 10,
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

// Filter out any dummy sample students that were previously seeded
const DUMMY_NAMES = new Set(['Aarav Patel', 'Diya Sharma', 'Kabir Mehta', 'Test Student']);

const cleanAppStorage = (data: AppStorageData): AppStorageData => {
  if (!data || !Array.isArray(data.students)) return { ...data, students: [] };
  return {
    ...data,
    students: data.students.filter(
      s => s && s.id && !s.id.startsWith('std-seed') && !s.id.startsWith('std-test') && !DUMMY_NAMES.has(s.name)
    ),
  };
};

// Helper to safely load data
const getStoreData = (): AppStorageData => {
  if (typeof window === 'undefined') {
    return memoryData;
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      // Clear legacy storage keys
      try {
        localStorage.removeItem('sigma_education_app_data_fresh_v2');
        localStorage.removeItem('sigma_education_app_data_v3');
      } catch {}
      const initial: AppStorageData = {
        students: INITIAL_STUDENTS,
        attendance: INITIAL_ATTENDANCE,
        rewards: INITIAL_REWARDS,
        fees: INITIAL_FEE_RECEIPTS,
        awards: INITIAL_AWARDS,
        version: 10,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
      memoryData = initial;
      return initial;
    }
    const parsed = cleanAppStorage(JSON.parse(raw));
    if (!parsed.students || parsed.students.length === 0) {
      parsed.students = INITIAL_STUDENTS;
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      } catch {}
    }
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
    const cleanData = cleanAppStorage(data);
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'FULL_SYNC', data: cleanData }),
    });
    if (res.ok) {
      const result = await res.json();
      lastSyncTime = new Date();
      if (result.version) {
        memoryData.version = Math.max(memoryData.version || 0, result.version);
      }
      try {
        localStorage.setItem(LAST_SYNC_KEY, lastSyncTime.toISOString());
      } catch {}
    }
  } catch (err) {
    console.warn('Background sync push to server failed:', err);
  }
};

// Helper to save data locally and trigger background server sync
const saveStoreData = (data: AppStorageData) => {
  const cleaned = cleanAppStorage(data);
  cleaned.lastUpdated = new Date().toISOString();
  cleaned.version = (cleaned.version || 0) + 1;
  memoryData = cleaned;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleaned));
    } catch (err) {
      console.error('Failed to save to local storage:', err);
    }

    // Notify active components on this page
    window.dispatchEvent(new CustomEvent('sigma_store_changed', { detail: cleaned }));

    // Notify other tabs in same browser
    try {
      broadcastChannel?.postMessage({ type: 'STORE_UPDATED', data: cleaned });
    } catch {}

    // Send update to central server API for multi-user sync
    pushToServer(cleaned);
  }
};

// Intelligent two-way merge
const mergeData = (local: AppStorageData, server: AppStorageData): { merged: AppStorageData; localHasNewer: boolean } => {
  const localClean = cleanAppStorage(local);
  const serverClean = cleanAppStorage(server);

  const localStudents = localClean.students || [];
  const serverStudents = serverClean.students || [];

  const studentMap = new Map<string, Student>();
  let localHasNewer = false;

  // 1. Add all server students (only genuine ones)
  serverStudents.forEach((s) => studentMap.set(s.id, s));

  // 2. Merge local students (never delete student created locally)
  localStudents.forEach((localStd) => {
    const serverStd = studentMap.get(localStd.id);
    if (!serverStd) {
      studentMap.set(localStd.id, localStd);
      localHasNewer = true;
    } else {
      const localTime = new Date(localStd.updatedAt || localStd.createdAt || 0).getTime();
      const serverTime = new Date(serverStd.updatedAt || serverStd.createdAt || 0).getTime();
      if (localTime >= serverTime) {
        studentMap.set(localStd.id, localStd);
      }
    }
  });

  const mergedStudents = Array.from(studentMap.values());

  const merged: AppStorageData = {
    students: mergedStudents,
    attendance: serverClean.attendance && serverClean.attendance.length > 0 ? serverClean.attendance : (localClean.attendance || []),
    rewards: serverClean.rewards && serverClean.rewards.length > 0 ? serverClean.rewards : (localClean.rewards || []),
    fees: serverClean.fees && serverClean.fees.length > 0 ? serverClean.fees : (localClean.fees || []),
    awards: serverClean.awards && serverClean.awards.length > 0 ? serverClean.awards : (localClean.awards || []),
    version: Math.max(local.version || 0, server.version || 0) + (localHasNewer ? 1 : 0),
    lastUpdated: new Date().toISOString(),
  };

  return { merged, localHasNewer };
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

        const { merged, localHasNewer } = mergeData(local, serverData);

        const localJson = JSON.stringify(local);
        const mergedJson = JSON.stringify(merged);

        if (localJson !== mergedJson) {
          memoryData = merged;
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent('sigma_store_changed', { detail: merged }));
        }

        if (localHasNewer) {
          await pushToServer(merged);
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
    if (typeof window !== 'undefined') {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_STUDENT', id }),
      }).catch(console.warn);
    }
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
    const disc = record.disciplinePoints !== undefined ? record.disciplinePoints : (record.otherPoints ?? 0);
    const updatedRecord: RewardRecord = {
      ...record,
      otherPoints: disc,
      disciplinePoints: disc,
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
    
    // Attendance percentage is kept strictly for informational display
    const attendancePercentage = totalClassesConducted > 0 
      ? Math.round((classesPresent / totalClassesConducted) * 100) 
      : 0;

    // RULE: Attendance Points = Classes Attended (Present) × 5
    // 1 attended class = 5 pts, 30 attended classes = 150 pts (Max 150)
    // Absent: +0 pts, Leave: +0 pts (no deduction)
    // Not calculated using percentage or proportional formulas
    const attendancePoints = Math.min(150, Math.max(0, classesPresent * 5));

    const rewardRec = data.rewards.find(r => r.studentId === student.id && r.month === month);
    const homeworkPoints = rewardRec ? Math.min(100, Math.max(0, rewardRec.homeworkPoints)) : 0;
    const rawDisc = rewardRec?.disciplinePoints !== undefined 
      ? rewardRec.disciplinePoints 
      : (rewardRec?.otherPoints ?? 0);
    const disciplinePoints = Math.min(50, Math.max(0, rawDisc));
    const otherPoints = disciplinePoints;
    const otherReason = rewardRec?.otherReason || '';

    // Total Reward Points = Attendance Points + Homework Points + Discipline Points (Max 300)
    const totalPoints = Math.min(300, attendancePoints + homeworkPoints + disciplinePoints);

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
      disciplinePoints,
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
      if (b.disciplinePoints !== a.disciplinePoints) return b.disciplinePoints - a.disciplinePoints;
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
          prev.disciplinePoints === item.disciplinePoints;
        
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
      s.disciplinePoints === leaderboard[0].disciplinePoints
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
      otherPoints: winner.disciplinePoints,
      disciplinePoints: winner.disciplinePoints,
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
  },

  // --- SELECTED MONTH PERSISTENCE ---
  getSelectedMonth: (): string => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(SELECTED_MONTH_KEY);
        if (saved && /^\d{4}-\d{2}$/.test(saved)) {
          return saved;
        }
      } catch {}
    }
    return getCurrentMonthString();
  },

  setSelectedMonth: (month: string): void => {
    if (typeof window !== 'undefined' && month) {
      try {
        localStorage.setItem(SELECTED_MONTH_KEY, month);
        window.dispatchEvent(new CustomEvent('sigma_month_changed', { detail: month }));
      } catch {}
    }
  }
};

// Automatic background sync initialization in browser
if (typeof window !== 'undefined') {
  setTimeout(() => {
    DataStore.syncWithServer();
  }, 100);

  window.addEventListener('focus', () => {
    DataStore.syncWithServer();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      DataStore.syncWithServer();
    }
  });

  setInterval(() => {
    DataStore.syncWithServer();
  }, 5000);
}
