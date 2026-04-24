import { useState } from 'react';
import { Star } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { useToast } from '../../context/ToastContext';

interface SatisfactionRatingProps {
  ticketId: number;
  existingRating?: number;
  existingComment?: string;
  onSubmit: () => void;
}

export default function SatisfactionRating({ ticketId, existingRating, existingComment, onSubmit }: SatisfactionRatingProps) {
  const { addToast } = useToast();
  const [rating, setRating] = useState(existingRating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existingComment ?? '');
  const [submitting, setSubmitting] = useState(false);
  const submitted = !!existingRating;

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    await ticketService.submitRating(ticketId, rating, comment.trim() || undefined);
    addToast('Thanks for your feedback!');
    onSubmit();
    setSubmitting(false);
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="card p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-ey-gray-900">
        {submitted ? 'Your Feedback' : 'How was your experience?'}
      </h3>
      <p className="mt-1 text-sm text-ey-gray-500">
        {submitted ? 'Thank you for rating this ticket.' : 'Rate the support you received for this ticket.'}
      </p>

      <div className="mt-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={submitted}
            onMouseEnter={() => !submitted && setHover(star)}
            onMouseLeave={() => !submitted && setHover(0)}
            onClick={() => !submitted && setRating(star)}
            className="transition disabled:cursor-default"
          >
            <Star
              size={28}
              className={`transition ${
                star <= (hover || rating)
                  ? 'fill-ey-yellow text-ey-yellow'
                  : 'text-ey-gray-300'
              }`}
            />
          </button>
        ))}
        {(hover || rating) > 0 && (
          <span className="ml-2 text-sm font-medium text-ey-gray-600">{labels[hover || rating]}</span>
        )}
      </div>

      {!submitted && (
        <>
          <textarea
            className="input mt-3 min-h-16"
            placeholder="Optional — tell us more about your experience"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            type="button"
            className="btn-primary mt-3"
            disabled={submitting || rating === 0}
            onClick={handleSubmit}
          >
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </>
      )}

      {submitted && existingComment && (
        <p className="mt-3 text-sm italic text-ey-gray-500">"{existingComment}"</p>
      )}
    </div>
  );
}
