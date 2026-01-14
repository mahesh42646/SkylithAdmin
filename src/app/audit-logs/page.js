'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/utils/auth';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DataTable from '@/components/common/DataTable';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    const user = getCurrentUser();
    if (!hasPermission(user, PERMISSIONS.VIEW_AUDIT_LOGS)) {
      router.push('/dashboard');
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const logs = [
    { id: 1, action: 'User Created', user: 'John Doe', timestamp: '2024-01-15 10:30:00', ip: '192.168.1.1' },
    { id: 2, action: 'User Updated', user: 'Jane Smith', timestamp: '2024-01-15 11:15:00', ip: '192.168.1.2' },
    { id: 3, action: 'Project Deleted', user: 'Admin', timestamp: '2024-01-15 12:00:00', ip: '192.168.1.1' },
    { id: 4, action: 'Settings Changed', user: 'Admin', timestamp: '2024-01-15 13:45:00', ip: '192.168.1.1' }
  ];

  const columns = [
    { key: 'action', label: 'Action' },
    { key: 'user', label: 'User' },
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'ip', label: 'IP Address' }
  ];

  return (
    <DashboardLayout>
      <div className="container-fluid px-3 py-4">
        <div className="mb-4">
          <h2 className="fw-bold mb-2">Audit Logs</h2>
          <p className="text-muted">System activity and audit trail</p>
        </div>
        <DataTable columns={columns} data={logs} searchable={true} pagination={true} />
      </div>
    </DashboardLayout>
  );
}

