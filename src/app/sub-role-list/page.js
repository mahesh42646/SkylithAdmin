'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/utils/auth';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import SubRoleList from '@/pages/SubRoleList';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SubRoleListPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    const user = getCurrentUser();
    if (!hasPermission(user, PERMISSIONS.VIEW_USERS)) {
      router.push('/dashboard');
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <DashboardLayout>
      <SubRoleList />
    </DashboardLayout>
  );
}

