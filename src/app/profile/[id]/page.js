'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/utils/auth';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import Settings from '@/pages/Settings';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Notification from '@/components/common/Notification';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const router = useRouter();
  const params = useParams();
  const userId = params?.id;
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Check if user can edit this profile
    const isOwnProfile = userId === currentUser?._id || userId === currentUser?.id;
    const canEditOthers = hasPermission(currentUser, PERMISSIONS.EDIT_USERS);

    if (!isOwnProfile && !canEditOthers) {
      setNotification({
        message: 'You do not have permission to edit this profile',
        type: 'permission'
      });
      setTimeout(() => {
        router.push('/users');
      }, 2000);
      return;
    }

    setLoading(false);
  }, [router, userId, currentUser]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container-fluid px-3 py-4">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Settings editingUserId={userId} />
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </DashboardLayout>
  );
}

