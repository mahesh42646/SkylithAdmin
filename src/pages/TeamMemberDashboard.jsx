'use client';

import { FaTasks, FaCheckCircle, FaClock, FaCalendar } from 'react-icons/fa';
import StatCard from '@/components/common/StatCard';
import { mockTasks, getStats } from '@/utils/mockData';
import { getCurrentUser } from '@/utils/auth';

export default function TeamMemberDashboard() {
  const user = getCurrentUser();
  const stats = getStats('team_member');
  const myTasks = mockTasks.filter(t => t.assignee === user?.id);
  const upcomingTasks = myTasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'danger',
      medium: 'warning',
      low: 'secondary'
    };
    return colors[priority] || 'secondary';
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'success',
      in_progress: 'primary',
      pending: 'secondary'
    };
    return colors[status] || 'secondary';
  };

  return (
    <div className="container-fluid px-3 py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-2">My Dashboard</h2>
        <p className="text-muted">Track your tasks and upcoming deadlines.</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            icon={FaTasks}
            title="My Tasks"
            value={stats.myTasks || 0}
            color="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            icon={FaCheckCircle}
            title="Completed"
            value={stats.completedTasks || 0}
            color="success"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            icon={FaClock}
            title="In Progress"
            value={stats.inProgressTasks || 0}
            color="warning"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            icon={FaCalendar}
            title="Pending"
            value={stats.pendingTasks || 0}
            color="info"
          />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-8">
          <div className="card">
            <div className="card-header bg-white">
              <h5 className="mb-0">My Tasks</h5>
            </div>
            <div className="card-body">
              {myTasks.length === 0 ? (
                <p className="text-muted text-center py-4">No tasks assigned</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myTasks.map(task => (
                        <tr key={task.id}>
                          <td>{task.title}</td>
                          <td>
                            <span className={`badge bg-${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`badge bg-${getStatusColor(task.status)}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card">
            <div className="card-header bg-white">
              <h6 className="mb-0">Upcoming Deadlines</h6>
            </div>
            <div className="card-body">
              {upcomingTasks.length === 0 ? (
                <p className="text-muted small">No upcoming deadlines</p>
              ) : (
                upcomingTasks.map(task => (
                  <div key={task.id} className="mb-3 pb-3 border-bottom">
                    <h6 className="mb-1 small">{task.title}</h6>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className={`badge bg-${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <small className="text-muted">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

