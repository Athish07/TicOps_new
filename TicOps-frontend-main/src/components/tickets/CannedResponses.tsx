import { useState } from 'react';
import { Zap } from 'lucide-react';

const CANNED_RESPONSES = [
  { id: 'restart', label: 'Restart Device', text: 'Could you please try restarting your device and let me know if the issue persists?' },
  { id: 'clear-cache', label: 'Clear Cache', text: 'Please clear your browser cache and cookies, then try again. Steps: Settings → Privacy → Clear browsing data.' },
  { id: 'vpn-refresh', label: 'VPN Profile Refresh', text: 'Please remove your VPN profile and re-add it. Go to Settings → VPN → Remove → Re-add corporate VPN.' },
  { id: 'password-reset', label: 'Password Reset', text: 'Your password has been reset. Please check your email for the temporary password and change it on first login.' },
  { id: 'escalated', label: 'Escalated', text: 'I\'ve escalated this to the specialized team. They\'ll follow up within 2 business hours.' },
  { id: 'more-info', label: 'Need More Info', text: 'Could you provide more details or a screenshot so we can investigate further? This will help us resolve the issue faster.' },
  { id: 'resolved-check', label: 'Resolution Check', text: 'We\'ve applied a fix for this issue. Could you verify if everything is working correctly on your end now?' },
];

interface CannedResponsesProps {
  onSelect: (text: string) => void;
}

export default function CannedResponses({ onSelect }: CannedResponsesProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ey-gray-400 transition hover:bg-ey-gray-100 hover:text-ey-gray-700"
        title="Quick replies"
      >
        <Zap size={18} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-12 left-0 z-20 w-72 rounded-xl border border-ey-gray-200 bg-white shadow-lg">
            <div className="border-b border-ey-gray-100 px-3 py-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-ey-gray-500">Quick Replies</div>
            </div>
            <div className="max-h-60 overflow-y-auto p-1">
              {CANNED_RESPONSES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onSelect(item.text); setOpen(false); }}
                  className="block w-full rounded-lg px-3 py-2 text-left transition hover:bg-ey-gray-50"
                >
                  <div className="text-sm font-medium text-ey-gray-900">{item.label}</div>
                  <div className="mt-0.5 line-clamp-1 text-xs text-ey-gray-500">{item.text}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
