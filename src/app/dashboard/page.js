'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser, ROLES } from '@/utils/auth';
import AdminDashboard from '@/pages/AdminDashboard';
import ManagementDashboard from '@/pages/ManagementDashboard';
import TeamMemberDashboard from '@/pages/TeamMemberDashboard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(getCurrentUser());
    setLoading(false);
  }, [router]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return null;
  }

  const dashboardContent = 
    user.role === ROLES.ADMIN ? <AdminDashboard /> :
    user.role === ROLES.MANAGEMENT ? <ManagementDashboard /> :
    <TeamMemberDashboard />;

  return <DashboardLayout>{dashboardContent}</DashboardLayout>;
}

