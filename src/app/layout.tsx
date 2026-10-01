import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { DesktopSidebar, MobileBottomNav } from '@/components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sigma Education - Tuition Student Management System',
  description: 'Simple, clean mobile-friendly tuition student management, attendance, reward points, and fee receipt app.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#7c3aed',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col md:flex-row`}>
        <AuthProvider>
          <DesktopSidebar />
          <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
            {children}
          </div>
          <MobileBottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
