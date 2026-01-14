'use client';

import { FaUsers, FaProjectDiagram, FaChartLine, FaCheckCircle } from 'react-icons/fa';
import StatCard from '@/components/common/StatCard';
import Chart from '@/components/common/Chart';
import { mockProjects, mockTasks, getAnalyticsData, getStats } from '@/utils/mockData';

export default function ManagementDashboard() {
  const stats = getStats('management');
  const analytics = getAnalyticsData();
  const activeProjects = mockProjects.filter(p => p.status === 'in_progress');

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
    <div className="container-fluid px-3 py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-2">Team Overview</h2>
        <p className="text-muted">Monitor team performance and project status.</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            icon={FaUsers}
            title="Team Members"
            value={stats.activeUsers}
            change="+2"
            changeType="positive"
            color="primary"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            icon={FaProjectDiagram}
            title="Active Projects"
            value={stats.activeProjects}
            change="+1"
            changeType="positive"
            color="success"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            icon={FaCheckCircle}
            title="Tasks Completed"
            value={stats.completedTasks}
            change="+12%"
            changeType="positive"
            color="warning"
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <StatCard
            icon={FaChartLine}
            title="Completion Rate"
            value="78%"
            change="+5%"
            changeType="positive"
            color="info"
          />
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-8">
          <Chart
            type="line"
            data={taskCompletionData}
            title="Task Completion Rate"
          />
        </div>
        <div className="col-12 col-lg-4">
          <div className="card">
            <div className="card-header bg-white">
              <h6 className="mb-0">Active Projects</h6>
            </div>
            <div className="card-body">
              {activeProjects.map(project => (
                <div key={project.id} className="mb-3 pb-3 border-bottom">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="mb-0">{project.title}</h6>
                    <span className={`badge bg-${project.priority === 'high' ? 'danger' : project.priority === 'medium' ? 'warning' : 'secondary'}`}>
                      {project.priority}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div
                        className="progress-bar bg-primary"
                        role="progressbar"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <small className="text-muted">Due: {new Date(project.deadline).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

