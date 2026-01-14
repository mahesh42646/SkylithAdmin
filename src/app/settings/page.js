'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import Settings from '@/pages/Settings';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SettingsPage() {
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
      <Settings />
    </DashboardLayout>
  );
}

