'use client';

import { cn, formatRelativeTime } from '@/lib/utils';
import { Avatar } from '@/components/ui';

interface Activity {
  id: string;
  type: 'task_completed' | 'suite_cleaned' | 'note_created' | 'employee_clocked_in' | 'task_assigned';
  message: string;
  user: {
    name: string;
    avatar?: string;
  };
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface ActivityFeedProps {
  activities: Activity[];
  limit?: number;
  className?: string;
}

const activityIcons: Record<Activity['type'], { icon: React.ReactNode; bgColor: string }> = {
  task_completed: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    bgColor: 'bg-emerald-500',
  },
  suite_cleaned: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    bgColor: 'bg-blue-500',
  },
  note_created: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    bgColor: 'bg-purple-500',
  },
  employee_clocked_in: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bgColor: 'bg-amber-500',
  },
  task_assigned: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    bgColor: 'bg-indigo-500',
  },
};

export function ActivityFeed({ activities, limit = 10, className }: ActivityFeedProps) {
  const displayActivities = limit ? activities.slice(0, limit) : activities;

  if (displayActivities.length === 0) {
    return (
      <div className={cn('text-center py-8 text-[var(--text-muted)]', className)}>
        No recent activity
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {displayActivities.map((activity, index) => {
        const { icon, bgColor } = activityIcons[activity.type];
        
        return (
          <div key={activity.id} className="flex gap-3">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white', bgColor)}>
                {icon}
              </div>
              {index < displayActivities.length - 1 && (
                <div className="w-0.5 flex-1 bg-[var(--border-light)] my-2" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-[var(--text-primary)]">{activity.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar name={activity.user.name} src={activity.user.avatar} size="xs" />
                    <span className="text-xs text-[var(--text-muted)]">{activity.user.name}</span>
                  </div>
                </div>
                <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

