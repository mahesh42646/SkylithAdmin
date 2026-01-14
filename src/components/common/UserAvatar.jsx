'use client';

export default function UserAvatar({ user, size = 40 }) {
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getColor = (name) => {
    const colors = [
      '#5B21B6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
      '#3B82F6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div
      className="rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold"
      style={{
        width: size,
        height: size,
        backgroundColor: getColor(user?.name),
        fontSize: size * 0.4
      }}
    >
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className="rounded-circle"
          style={{ width: size, height: size, objectFit: 'cover' }}
        />
      ) : (
        getInitials(user?.name)
      )}
    </div>
  );
}

