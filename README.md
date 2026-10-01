# 🎓 Sigma Education - Tuition Management System

A simple, clean, mobile-first web application built with **Next.js 15 + React + TypeScript + Tailwind CSS** for managing tuition students, attendance, reward points, monthly leaderboard awards, and printable fee receipts.

---

## 🚀 Key Features

1. **Admin Authentication**
   - Clean admin login (`admin@sigma.com` / `password123`).
   - Secure persistent auth state.

2. **Student Management**
   - Add, edit, deactivate, filter by standard/batch, and search students.
   - Comprehensive **Student Profile** view with full history (info, attendance rate, reward points, fee history).

3. **Attendance System**
   - Select Date & Batch.
   - Interactive 🟢 Present, 🔴 Absent, 🟡 Leave controls.
   - Quick **"Mark All Present"** button.

4. **300-Point Reward System**
   - **Attendance (150 Points)**: Calculated automatically based on actual conducted classes.
   - **Homework (100 Points)**: Manual admin entry (+5 per assignment completed).
   - **Other / Participation (50 Points)**: Manual admin entry with custom reason (+5, +10).
   - Dynamic score display (e.g. `245 / 300`).

5. **Monthly Leaderboard & 🏆 Sigma Star of the Month**
   - Dynamic monthly ranking table.
   - **Transparent Tie-Breaker Logic**:
     1. Total Points
     2. Attendance Points
     3. Homework Points
     4. Other Points
     5. Joint Sigma Stars if completely tied.
   - Prominent **🏆 SIGMA STAR OF THE MONTH** hero card with student name, score (`285 / 300`), reward (`₹300`), and Admin confirmation.

6. **Fee Receipts & PDF Print**
   - Record fee payments with auto-generated receipt numbers (`SIG-FEE-0001`).
   - Official **View Receipt & Print / Download PDF** with printable CSS layout.
   - Includes header *SIGMA EDUCATION* and footer *Thank you for choosing Sigma Education.*

7. **Simple Dashboard**
   - Real-time summary cards: Total Active Students, Today's Attendance %, Monthly Sigma Star Winner, Recent Fee Receipts, Top 5 Leaderboard.
   - Quick action buttons (➕ Add Student, 📅 Mark Attendance, ⭐ Add Reward Points, 🧾 Create Fee Receipt).

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Violet / Purple Accent Theme)
- **Icons**: Lucide React
- **Database / ORM**: Prisma ORM (SQLite for zero-config local run, PostgreSQL / Supabase ready for Vercel)

---

## 💻 Local Quickstart

### 1. Clone / Navigate to Directory
```bash
cd C:\Users\haarish\.gemini\antigravity\scratch\sigma-education
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Prisma Database (Optional)
```bash
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Default Admin Credentials:
- **Email**: `admin@sigma.com`
- **Password**: `password123`

---

## ☁️ Vercel Deployment Instructions

### Option 1: Deploy via Vercel CLI
```bash
npx vercel
```

### Option 2: Deploy via GitHub + Vercel Web Console
1. Push this project to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Sigma Education"
   git remote add origin https://github.com/your-username/sigma-education.git
   git push -u origin main
   ```
2. Log into [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your `sigma-education` GitHub repository.
4. Add Environment Variables:
   - `DATABASE_URL`: Your Supabase / PostgreSQL database connection URL.
   - `NEXTAUTH_SECRET`: `sigma-education-super-secret-key-2026`
5. Click **Deploy**. Vercel will automatically build and provide a live URL!

---

## 📁 Database Schema (`prisma/schema.prisma`)

Required tables included in schema:
- `Admin`
- `Student`
- `Attendance`
- `RewardPoint`
- `FeePayment`
- `MonthlyAward`

---

&copy; 2026 Sigma Education. All rights reserved.
