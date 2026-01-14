'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function CalendarPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <DashboardLayout>
      <div className="container-fluid px-3 py-4">
        <div className="mb-4">
          <h2 className="fw-bold mb-2">Calendar</h2>
          <p className="text-muted">View your schedule and upcoming events</p>
        </div>
        <div className="card">
          <div className="card-body text-center py-5">
            <p className="text-muted">Calendar view coming soon...</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

