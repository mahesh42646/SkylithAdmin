'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import MailManagement from '@/pages/MailManagement';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function MailPage() {
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
      <MailManagement />
    </DashboardLayout>
  );
}
