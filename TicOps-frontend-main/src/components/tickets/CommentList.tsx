import type { TicketComment, User } from '../../types';
import { formatDate } from '../../lib/utils';

interface CommentListProps {
  comments: TicketComment[];
  users: User[];
}

export default function CommentList({ comments, users }: CommentListProps) {
  const findAuthor = (id?: number) => users.find((user) => user.id === id)?.name || 'System';

  return (
    <div className="card p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-ey-gray-900">Comments</h3>
      <div className="mt-5 space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-ey-gray-500">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-xl border border-ey-gray-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-ey-gray-900">{findAuthor(comment.createdBy)}</div>
                <div className="text-xs text-ey-gray-500">{formatDate(comment.createdAt)}</div>
              </div>
              <div className="mt-3 text-sm text-ey-gray-700">{comment.commentText}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
