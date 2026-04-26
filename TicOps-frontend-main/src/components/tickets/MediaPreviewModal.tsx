import { useEffect } from 'react';
import type { ChatAttachment } from '../../types';

interface MediaPreviewModalProps {
  attachment: ChatAttachment;
  onClose: () => void;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPreviewModal({ attachment, onClose }: MediaPreviewModalProps) {
  const isImage = attachment.type.startsWith('image/');
  const isPdf = attachment.type === 'application/pdf';

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className="media-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="media-modal-content relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ey-gray-200 px-5 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ey-gray-900">{attachment.name}</p>
            <p className="text-xs text-ey-gray-500">{formatFileSize(attachment.size)}</p>
          </div>
          <div className="ml-4 flex items-center gap-2">
            <a
              href={attachment.url}
              download={attachment.name}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ey-gray-500 transition hover:bg-ey-gray-100 hover:text-ey-gray-800"
              title="Download"
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </a>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ey-gray-500 transition hover:bg-ey-gray-100 hover:text-ey-gray-800"
              title="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex items-center justify-center overflow-auto bg-ey-gray-50 p-4" style={{ maxHeight: 'calc(90vh - 60px)' }}>
          {isImage ? (
            <img
              src={attachment.url}
              alt={attachment.name}
              className="max-h-[80vh] max-w-full rounded-lg object-contain"
            />
          ) : isPdf ? (
            <iframe
              src={attachment.url}
              title={attachment.name}
              className="h-[80vh] w-full rounded-lg border-0"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 py-12">
              <svg className="h-16 w-16 text-ey-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-sm font-medium text-ey-gray-600">Preview not available for this file type</p>
              <a
                href={attachment.url}
                download={attachment.name}
                className="btn-primary text-sm"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
