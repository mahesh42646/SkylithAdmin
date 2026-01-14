'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import AttendanceManagement from '@/pages/AttendanceManagement';

export default function AttendancePage() {
  return (
    <DashboardLayout>
      <AttendanceManagement />
    </DashboardLayout>
  );
}
