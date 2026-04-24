import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import TicketForm from '../../components/tickets/TicketForm';
import { categoryService } from '../../services/categoryService';
import { ticketService } from '../../services/ticketService';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import type { Category, CreateTicketPayload, User } from '../../types';

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([categoryService.getCategories(), userService.getUsers()]).then(([categoryData, userData]) => {
      setCategories(categoryData);
      setUsers(userData);
    });
  }, []);

  const handleSubmit = async (payload: CreateTicketPayload) => {
    setSubmitting(true);
    try {
      const ticket = await ticketService.createTicket(payload);
      addToast(`Ticket ${ticket.ticketNumber} created successfully`);
      navigate(`/tickets/${ticket.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Ticket"
        description="Capture a new issue from web intake or email and route it to the appropriate team."
      />
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-sm text-amber-800">
          <strong>Before you submit —</strong> have you checked the{' '}
          <Link to="/kb" className="font-semibold underline hover:text-amber-900">Knowledge Base</Link>?
          Many common issues already have a quick fix.
        </p>
      </div>
      <TicketForm categories={categories} users={users} onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
