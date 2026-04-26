import { useCallback, useRef, useState } from 'react';
import type { ChatAttachment, UserRole } from '../../types';
import CannedResponses from './CannedResponses';

interface ChatInputProps {
  onSend: (text: string, attachments: ChatAttachment[]) => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
  userRole?: UserRole;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
];

function fileToAttachment(file: File): Promise<ChatAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: reader.result as string,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ChatInput({ onSend, onTypingChange, disabled, userRole }: ChatInputProps) {
  const [text, setText] = useState('');
  const [pendingFiles, setPendingFiles] = useState<ChatAttachment[]>([]);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const handleTextChange = (value: string) => {
    setText(value);

    // Notify typing state
    if (onTypingChange) {
      onTypingChange(value.length > 0);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (value.length > 0) {
        typingTimeoutRef.current = setTimeout(() => onTypingChange(false), 2000);
      }
    }

    // Auto-resize textarea
    requestAnimationFrame(autoResize);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setError('');
    const incoming: ChatAttachment[] = [];

    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`Unsupported file type: ${file.name}`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large (max 10 MB): ${file.name}`);
        continue;
      }
      incoming.push(await fileToAttachment(file));
    }

    setPendingFiles((prev) => [...prev, ...incoming]);
  };

  const removeFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSend = () => {
    if (!text.trim() && pendingFiles.length === 0) return;
    onSend(text.trim(), pendingFiles);
    setText('');
    setPendingFiles([]);
    setError('');
    onTypingChange?.(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-ey-gray-200 bg-white p-3">
      {/* File preview strip */}
      {pendingFiles.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pendingFiles.map((file) => (
            <div key={file.id} className="relative flex items-center gap-1.5 rounded-lg bg-ey-gray-100 px-2.5 py-1.5 text-xs text-ey-gray-700">
              {file.type.startsWith('image/') ? (
                <img src={file.url} alt={file.name} className="h-8 w-8 rounded object-cover" />
              ) : (
                <svg className="h-4 w-4 shrink-0 text-ey-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              )}
              <span className="max-w-[120px] truncate">{file.name}</span>
              <button type="button" onClick={() => removeFile(file.id)} className="ml-1 rounded-full p-0.5 text-ey-gray-400 hover:bg-ey-gray-200 hover:text-ey-gray-700">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <div className="mb-2 text-xs text-rose-600">{error}</div>}

      <div className="flex items-end gap-2">
        {/* File upload button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ey-gray-400 transition hover:bg-ey-gray-100 hover:text-ey-gray-700 disabled:opacity-50"
          title="Attach file or image"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
          </svg>
        </button>

        {/* Canned responses — staff only */}
        {userRole && userRole !== 'REQUESTOR' && (
          <CannedResponses onSelect={(t) => setText((prev) => prev ? `${prev}\n${t}` : t)} />
        )}

        <input
          ref={fileRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Text input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type a message…"
          className="input max-h-40 min-h-[40px] flex-1 resize-none !rounded-xl !py-2.5 transition-all"
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || (!text.trim() && pendingFiles.length === 0)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ey-yellow text-ey-black transition hover:bg-brand-400 disabled:opacity-40"
          title="Send message"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
