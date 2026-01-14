'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { mockProjects } from '@/utils/mockData';
import DataTable from '@/components/common/DataTable';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ProjectsPage() {
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

  const columns = [
    { key: 'title', label: 'Project' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`badge bg-${value === 'completed' ? 'success' : value === 'in_progress' ? 'primary' : 'secondary'}`}>
          {value.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (value) => (
        <div>
          <div className="d-flex justify-content-between small mb-1">
            <span>{value}%</span>
          </div>
          <div className="progress" style={{ height: '6px' }}>
            <div
              className="progress-bar bg-primary"
              role="progressbar"
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (value) => (
        <span className={`badge bg-${value === 'high' ? 'danger' : value === 'medium' ? 'warning' : 'secondary'}`}>
          {value}
        </span>
      )
    },
    {
      key: 'deadline',
      label: 'Deadline',
      render: (value) => new Date(value).toLocaleDateString()
    }
  ];

  return (
    <DashboardLayout>
      <div className="container-fluid px-3 py-4">
        <div className="mb-4">
          <h2 className="fw-bold mb-2">Projects</h2>
          <p className="text-muted">Manage and track all projects</p>
        </div>
        <DataTable columns={columns} data={mockProjects} searchable={true} pagination={true} />
      </div>
    </DashboardLayout>
  );
}

