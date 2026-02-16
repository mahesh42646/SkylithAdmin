'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/utils/auth';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CalendarSetup from '@/pages/CalendarSetup';

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

  const user = getCurrentUser();
  const canManage = user && hasPermission(user, PERMISSIONS.MANAGE_CALENDAR);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <DashboardLayout>
      <CalendarSetup />
    </DashboardLayout>
  );
}

