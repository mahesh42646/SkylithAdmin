'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Chart from '@/components/common/Chart';
import { getAnalyticsData } from '@/utils/mockData';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ReportsPage() {
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

  const analytics = getAnalyticsData();

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

  return (
    <DashboardLayout>
      <div className="container-fluid px-3 py-4">
        <div className="mb-4">
          <h2 className="fw-bold mb-2">Reports</h2>
          <p className="text-muted">View detailed reports and analytics</p>
        </div>
        <div className="row g-3">
          <div className="col-12">
            <Chart type="line" data={taskCompletionData} title="Task Completion Report" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

