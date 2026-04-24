import type { Category, TicketFiltersState, User } from '../../types';

interface TicketFiltersProps {
  filters: TicketFiltersState;
  onChange: (updates: Partial<TicketFiltersState>) => void;
  categories: Category[];
  users: User[];
}

export default function TicketFilters({ filters, onChange, categories, users }: TicketFiltersProps) {
  return (
    <div className="card mb-4 p-3 sm:mb-6 sm:p-4">
      <div className="grid gap-3 grid-cols-2 sm:gap-4 xl:grid-cols-7">
        <div className="col-span-2 xl:col-span-2">
          <label className="label">Search</label>
          <input
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="input"
            placeholder="Ticket, requester, subject"
          />
        </div>

        <div>
          <label className="label">Status</label>
          <select value={filters.status} onChange={(e) => onChange({ status: e.target.value })} className="input">
            <option value="">All</option>
            {['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED', 'REOPENED'].map((status) => (
              <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Priority</label>
          <select value={filters.priority} onChange={(e) => onChange({ priority: e.target.value })} className="input">
            <option value="">All</option>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Category</label>
          <select value={filters.categoryId} onChange={(e) => onChange({ categoryId: e.target.value })} className="input">
            <option value="">All</option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>{category.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Owner</label>
          <select value={filters.assignedTo} onChange={(e) => onChange({ assignedTo: e.target.value })} className="input">
            <option value="">All</option>
            {users.map((user) => (
              <option key={user.id} value={String(user.id)}>{user.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Source</label>
          <select value={filters.source} onChange={(e) => onChange({ source: e.target.value })} className="input">
            <option value="">All</option>
            <option value="EMAIL">EMAIL</option>
            <option value="WEB">WEB</option>
          </select>
        </div>
      </div>
    </div>
  );
}
