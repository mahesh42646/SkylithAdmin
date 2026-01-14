'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Chart({ type, data, options, title }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: !!title,
        text: title
      }
    },
    ...options
  };

  const chartData = {
    ...data,
    datasets: data.datasets ? data.datasets.map(dataset => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || 'rgba(91, 33, 182, 0.1)',
      borderColor: dataset.borderColor || '#5B21B6',
      borderWidth: 2
    })) : []
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={chartData} options={defaultOptions} />;
      case 'bar':
        return <Bar data={chartData} options={defaultOptions} />;
      case 'pie':
        return <Pie data={chartData} options={defaultOptions} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={defaultOptions} />;
      default:
        return <Line data={chartData} options={defaultOptions} />;
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        {title && <h6 className="card-title mb-3">{title}</h6>}
        <div style={{ height: '300px', position: 'relative' }}>
          {renderChart()}
        </div>
      </div>
    </div>
  );
}

