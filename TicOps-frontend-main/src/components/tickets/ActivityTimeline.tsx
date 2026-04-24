import type { TicketActivity, User } from '../../types';
import { formatDate } from '../../lib/utils';

interface ActivityTimelineProps {
  activities: TicketActivity[];
  users: User[];
}

export default function ActivityTimeline({ activities, users }: ActivityTimelineProps) {
  const getActor = (id?: number) => users.find((user) => user.id === id)?.name || 'System';

  return (
    <div className="card p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-ey-gray-900">Activity Timeline</h3>
      <div className="mt-5 space-y-5">
        {activities.length === 0 ? (
          <p className="text-sm text-ey-gray-500">No activity available yet.</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="relative pl-6">
              <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-ey-yellow" />
              <div className="rounded-xl border border-ey-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-ey-gray-900">{activity.activityType.replaceAll('_', ' ')}</div>
                  <div className="text-xs text-ey-gray-500">{formatDate(activity.createdAt)}</div>
                </div>
                <div className="mt-1 text-sm text-ey-gray-500">By {getActor(activity.changedBy)}</div>
                {activity.oldValue || activity.newValue ? (
                  <div className="mt-3 text-sm text-ey-gray-700">
                    {activity.oldValue ? <span className="font-medium">{activity.oldValue}</span> : null}
                    {activity.oldValue || activity.newValue ? ' → ' : null}
                    {activity.newValue ? <span className="font-medium">{activity.newValue}</span> : null}
                  </div>
                ) : null}
                {activity.commentText ? <div className="mt-3 text-sm text-ey-gray-700">{activity.commentText}</div> : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
