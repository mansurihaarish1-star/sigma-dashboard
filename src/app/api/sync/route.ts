import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Shared data store structure
interface AppStorageData {
  students: any[];
  attendance: any[];
  rewards: any[];
  fees: any[];
  awards: any[];
  version?: number;
  lastUpdated?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'sigma_store.json');

// Ensure data folder and file exist
function getStoredData(): AppStorageData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const defaultState: AppStorageData = {
        students: [
          {
            id: 'std-seed-1',
            studentId: 'SIG-001',
            name: 'Aarav Patel',
            standard: 'Std 10',
            batch: 'Morning Batch',
            parentName: 'Rajesh Patel',
            parentMobile: '9876543210',
            admissionDate: '2026-06-01',
            monthlyFee: 2500,
            status: 'ACTIVE',
            createdAt: '2026-06-01',
            updatedAt: '2026-06-01'
          },
          {
            id: 'std-seed-2',
            studentId: 'SIG-002',
            name: 'Diya Sharma',
            standard: 'Std 12',
            batch: 'Evening Batch',
            parentName: 'Sunita Sharma',
            parentMobile: '9822334455',
            admissionDate: '2026-06-05',
            monthlyFee: 3000,
            status: 'ACTIVE',
            createdAt: '2026-06-05',
            updatedAt: '2026-06-05'
          }
        ],
        attendance: [],
        rewards: [],
        fees: [],
        awards: [],
        version: 1,
        lastUpdated: new Date().toISOString(),
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultState, null, 2), 'utf-8');
      return defaultState;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading storage file:', err);
    return {
      students: [],
      attendance: [],
      rewards: [],
      fees: [],
      awards: [],
      version: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

function saveStoredData(data: AppStorageData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const updatedData = {
      ...data,
      version: (data.version || 0) + 1,
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(updatedData, null, 2), 'utf-8');
    return updatedData;
  } catch (err) {
    console.error('Error writing storage file:', err);
    throw err;
  }
}

export async function GET() {
  const data = getStoredData();
  return NextResponse.json({
    success: true,
    data,
    version: data.version || 1,
    lastUpdated: data.lastUpdated || new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = getStoredData();

    let nextData: AppStorageData;

    if (body.action === 'FULL_SYNC' && body.data) {
      // Direct full sync payload
      nextData = {
        students: body.data.students ?? current.students,
        attendance: body.data.attendance ?? current.attendance,
        rewards: body.data.rewards ?? current.rewards,
        fees: body.data.fees ?? current.fees,
        awards: body.data.awards ?? current.awards,
      };
    } else if (body.action === 'UPDATE_STUDENT' && body.student) {
      const student = body.student;
      const index = current.students.findIndex((s: any) => s.id === student.id);
      let updatedStudents = [...current.students];
      if (index !== -1) {
        updatedStudents[index] = {
          ...updatedStudents[index],
          ...student,
          updatedAt: new Date().toISOString().split('T')[0]
        };
      } else {
        updatedStudents.push({
          ...student,
          updatedAt: new Date().toISOString().split('T')[0]
        });
      }
      nextData = { ...current, students: updatedStudents };
    } else if (body.action === 'ADD_STUDENT' && body.student) {
      const student = body.student;
      const exists = current.students.some((s: any) => s.id === student.id || s.studentId === student.studentId);
      let updatedStudents = [...current.students];
      if (exists) {
        const idx = updatedStudents.findIndex((s: any) => s.id === student.id || s.studentId === student.studentId);
        updatedStudents[idx] = { ...updatedStudents[idx], ...student };
      } else {
        updatedStudents.push(student);
      }
      nextData = { ...current, students: updatedStudents };
    } else if (body.action === 'DELETE_STUDENT' && body.id) {
      nextData = {
        ...current,
        students: current.students.filter((s: any) => s.id !== body.id)
      };
    } else if (body.action === 'RESET') {
      nextData = {
        students: [],
        attendance: [],
        rewards: [],
        fees: [],
        awards: [],
      };
    } else if (body.data) {
      // Default to merging provided data
      nextData = {
        students: body.data.students || current.students,
        attendance: body.data.attendance || current.attendance,
        rewards: body.data.rewards || current.rewards,
        fees: body.data.fees || current.fees,
        awards: body.data.awards || current.awards,
      };
    } else {
      nextData = current;
    }

    const saved = saveStoredData(nextData);

    return NextResponse.json({
      success: true,
      data: saved,
      version: saved.version,
      lastUpdated: saved.lastUpdated,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('API Sync POST error:', err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to sync data',
    }, { status: 500 });
  }
}
