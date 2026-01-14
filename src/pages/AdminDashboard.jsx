'use client';

import { useState, useEffect } from 'react';
import { FaUsers, FaProjectDiagram, FaTasks, FaDollarSign } from 'react-icons/fa';
import StatCard from '@/components/common/StatCard';
import Chart from '@/components/common/Chart';
import DataTable from '@/components/common/DataTable';
import api from '@/utils/api';
import { getAnalyticsData } from '@/utils/mockData';
import UserAvatar from '@/components/common/UserAvatar';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    revenue: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const analytics = getAnalyticsData();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, usersResponse] = await Promise.all([
        api.getStats(),
        api.getUsers({ limit: 5 })
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
      if (usersResponse.success) {
        setRecentUsers(usersResponse.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const userActivityData = {
    labels: analytics.userActivity.labels,
    datasets: [
      {
        label: 'User Activity',
        data: analytics.userActivity.data,
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

  const recentUsersColumns = [
    { key: 'name', label: 'Name', render: (value, row) => (
      <div className="d-flex align-items-center gap-2">
        <UserAvatar user={row} size={32} />
        <span>{value}</span>
      </div>
    )},
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (value) => (
      <span className={`badge bg-${value === 'admin' ? 'danger' : value === 'management' ? 'warning' : 'primary'}`}>
        {value}
      </span>
    )},
    { key: 'status', label: 'Status', render: (value) => (
      <span className={`badge bg-${value === 'active' ? 'success' : 'secondary'}`}>
        {value}
      </span>
    )}
  ];

  if (loading) {
    return (
      <div className="container-fluid px-3 py-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-2">Dashboard Overview</h2>
        <p className="text-muted">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            icon={FaUsers}
            title="Total Employees"
            value={stats.totalUsers}
            change="+12%"
            changeType="positive"
            color="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            icon={FaProjectDiagram}
            title="Active Projects"
            value={stats.activeProjects}
            change="+5%"
            changeType="positive"
            color="success"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            icon={FaDollarSign}
            title="Revenue"
            value={`$${(stats.revenue / 1000).toFixed(0)}K`}
            change="+8%"
            changeType="positive"
            color="warning"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            icon={FaTasks}
            title="Tasks Completed"
            value={stats.tasksCompleted}
            change="+15%"
            changeType="positive"
            color="info"
          />
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-8">
          <Chart
            type="line"
            data={userActivityData}
            title="User Activity (Last 7 Days)"
          />
        </div>
        <div className="col-12 col-lg-4">
          <Chart
            type="doughnut"
            data={projectStatusData}
            title="Project Status"
          />
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="mb-0">Recent Users</h5>
            </div>
            <div className="card-body">
              <DataTable
                columns={recentUsersColumns}
                data={recentUsers}
                searchable={false}
                pagination={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

