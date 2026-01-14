'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/utils/auth';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Chart from '@/components/common/Chart';
import { getAnalyticsData } from '@/utils/mockData';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    const user = getCurrentUser();
    if (!hasPermission(user, PERMISSIONS.VIEW_ANALYTICS)) {
      router.push('/dashboard');
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const analytics = getAnalyticsData();

  const revenueData = {
    labels: analytics.revenue.labels,
    datasets: [
      {
        label: 'Revenue',
        data: analytics.revenue.data,
        backgroundColor: 'rgba(91, 33, 182, 0.2)',
        borderColor: '#5B21B6',
        borderWidth: 2
      }
    ]
  };

  const taskCompletionData = {
    labels: analytics.taskCompletion.labels,
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: analytics.taskCompletion.data,
        borderColor: '#5B21B6',
        backgroundColor: 'rgba(91, 33, 182, 0.1)'
      }
    ]
  };

  const projectStatusData = {
    labels: analytics.projectStatus.labels,
    datasets: [
      {
        data: analytics.projectStatus.data,
        backgroundColor: ['#10B981', '#8B5CF6', '#F59E0B']
      }
    ]
  };

  return (
    <DashboardLayout>
      <div className="container-fluid px-3 py-4">
        <div className="mb-4">
          <h2 className="fw-bold mb-2">Analytics & Reports</h2>
          <p className="text-muted">Comprehensive analytics and insights</p>
        </div>

        <div className="row g-3">
          <div className="col-12 col-lg-8">
            <Chart type="bar" data={revenueData} title="Revenue by Quarter" />
          </div>
          <div className="col-12 col-lg-4">
            <Chart type="doughnut" data={projectStatusData} title="Project Status Distribution" />
          </div>
          <div className="col-12">
            <Chart type="line" data={taskCompletionData} title="Task Completion Trend" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

