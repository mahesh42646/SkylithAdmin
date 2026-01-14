'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main
        className="main-content"
        style={{
          paddingTop: '70px',
          minHeight: 'calc(100vh - 70px)'
        }}
      >
        {children}
        <footer
          className="text-center text-muted py-3"
          style={{ borderTop: '1px solid #E5E7EB', marginTop: '2rem' }}
        >
          <small>&copy; 2024 Admin Dashboard. All rights reserved.</small>
        </footer>
      </main>

      <style>{`
        .main-content {
          margin-left: 260px;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 991.98px) {
          .main-content {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
