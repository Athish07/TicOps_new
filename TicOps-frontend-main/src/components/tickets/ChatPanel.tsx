import { useEffect, useRef } from 'react';
import type { ChatAttachment, ChatMessage, UserRole } from '../../types';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: number;
  onSend: (text: string, attachments: ChatAttachment[]) => void;
  sending?: boolean;
  userRole?: UserRole;
}

export default function ChatPanel({ messages, currentUserId, onSend, sending, userRole }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <div className="card flex flex-col overflow-hidden" style={{ height: '520px' }}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-ey-gray-200 bg-ey-gray-50 px-4 py-3">
        <svg className="h-5 w-5 text-ey-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
        <h3 className="text-sm font-semibold text-ey-gray-800">Conversation</h3>
        <span className="ml-auto text-xs text-ey-gray-400">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <svg className="mb-3 h-10 w-10 text-ey-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <p className="text-sm font-medium text-ey-gray-400">No messages yet</p>
            <p className="mt-1 text-xs text-ey-gray-400">Start the conversation by sending a message below.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} isOwn={msg.senderId === currentUserId} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} disabled={sending} userRole={userRole} />
    </div>
  );
}
