import { useState } from 'react';
import type { ChatAttachment, ChatMessage } from '../../types';
import MediaPreviewModal from './MediaPreviewModal';

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  animate?: boolean;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(type: string) {
  return type.startsWith('image/');
}

function AttachmentCard({ attachment, onClick }: { attachment: ChatAttachment; onClick: () => void }) {
  if (isImage(attachment.type)) {
    return (
      <button type="button" onClick={onClick} className="block overflow-hidden rounded-lg text-left transition hover:opacity-80">
        <img src={attachment.url} alt={attachment.name} className="max-h-48 max-w-full rounded-lg object-cover" />
        <span className="mt-1 block truncate text-xs opacity-70">{attachment.name}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg border border-current/10 bg-current/5 px-3 py-2 text-left text-sm transition hover:bg-current/10"
    >
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{attachment.name}</div>
        <div className="text-xs opacity-60">{formatFileSize(attachment.size)}</div>
      </div>
    </button>
  );
}

export default function ChatBubble({ message, isOwn, animate }: ChatBubbleProps) {
  const roleLabel = message.senderRole === 'REQUESTOR' ? 'Requester' : 'Support';
  const [previewAttachment, setPreviewAttachment] = useState<ChatAttachment | null>(null);

  return (
    <>
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${animate ? 'animate-chat-in' : ''}`}>
      <div className={`chat-bubble ${isOwn ? 'chat-bubble-own' : 'chat-bubble-other'}`}>
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${isOwn ? 'bg-white/20 text-white' : 'bg-ey-yellow text-ey-black'}`}>
            {message.senderName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-semibold">{message.senderName}</span>
            <span className={`ml-2 text-xs ${isOwn ? 'text-white/60' : 'text-ey-gray-400'}`}>{roleLabel}</span>
          </div>
        </div>

        {/* Message text */}
        {message.text && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>}

        {/* Attachments */}
        {message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((att) => (
              <AttachmentCard key={att.id} attachment={att} onClick={() => setPreviewAttachment(att)} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className={`mt-2 text-right text-[11px] ${isOwn ? 'text-white/50' : 'text-ey-gray-400'}`}>
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>

    {previewAttachment && (
      <MediaPreviewModal attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    )}
    </>
  );
}
