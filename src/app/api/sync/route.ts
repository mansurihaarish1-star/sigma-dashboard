import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { INITIAL_STUDENTS } from '@/lib/initialData';

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

// On Vercel, the project root is read-only, so write to os.tmpdir()
const isVercel = !!process.env.VERCEL;
const DATA_DIR = isVercel ? os.tmpdir() : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'sigma_store.json');

// Global in-memory cache for warm serverless instances
declare global {
  var __sigma_store__: AppStorageData | undefined;
}

const defaultEmptyState: AppStorageData = {
  students: INITIAL_STUDENTS,
  attendance: [],
  rewards: [],
  fees: [],
  awards: [],
  version: 10,
  lastUpdated: new Date().toISOString(),
};

function getStoredData(): AppStorageData {
  if (globalThis.__sigma_store__) {
    return globalThis.__sigma_store__;
  }

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      globalThis.__sigma_store__ = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn('Could not read storage file, initializing empty state:', err);
  }

  // Fallback to checking process.cwd() data file in local development
  try {
    const localFallback = path.join(process.cwd(), 'data', 'sigma_store.json');
    if (fs.existsSync(localFallback)) {
      const raw = fs.readFileSync(localFallback, 'utf-8');
      const parsed = JSON.parse(raw);
      globalThis.__sigma_store__ = parsed;
      return parsed;
    }
  } catch {}

  globalThis.__sigma_store__ = defaultEmptyState;
  return defaultEmptyState;
}

function saveStoredData(data: AppStorageData) {
  const updatedData: AppStorageData = {
    ...data,
    version: (data.version || 0) + 1,
    lastUpdated: new Date().toISOString(),
  };

  globalThis.__sigma_store__ = updatedData;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(updatedData, null, 2), 'utf-8');
  } catch (err) {
    // On read-only systems, in-memory globalThis still preserves the state
    console.warn('Could not persist to disk (using in-memory cache):', err);
  }

  return updatedData;
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
      // Merge students by ID rather than blindly replacing
      const existingStudents = current.students || [];
      const incomingStudents = body.data.students || [];
      
      const studentMap = new Map<string, any>();
      existingStudents.forEach((s: any) => studentMap.set(s.id, s));
      incomingStudents.forEach((s: any) => {
        const exist = studentMap.get(s.id);
        if (!exist) {
          studentMap.set(s.id, s);
        } else {
          // If incoming student has newer or valid details, update
          studentMap.set(s.id, { ...exist, ...s });
        }
      });

      nextData = {
        students: Array.from(studentMap.values()),
        attendance: body.data.attendance ?? current.attendance,
        rewards: body.data.rewards ?? current.rewards,
        fees: body.data.fees ?? current.fees,
        awards: body.data.awards ?? current.awards,
        version: Math.max(current.version || 0, body.data.version || 0),
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
