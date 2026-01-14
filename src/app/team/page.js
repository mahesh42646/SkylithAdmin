'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import api from '@/utils/api';
import DataTable from '@/components/common/DataTable';
import UserAvatar from '@/components/common/UserAvatar';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function TeamPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers({ limit: 100 });
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value, row) => (
        <div className="d-flex align-items-center gap-2">
          <UserAvatar user={row} size={32} />
          <span>{value}</span>
        </div>
      )
    },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`badge bg-${value === 'active' ? 'success' : 'secondary'}`}>
          {value}
        </span>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="container-fluid px-3 py-4">
        <div className="mb-4">
          <h2 className="fw-bold mb-2">Team Management</h2>
          <p className="text-muted">View and manage your team members</p>
        </div>
        <DataTable columns={columns} data={users} searchable={true} pagination={true} />
      </div>
    </DashboardLayout>
  );
}

