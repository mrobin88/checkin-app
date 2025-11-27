import { useState } from 'react';
import { X, Send } from 'lucide-react';

interface ReplyModalProps {
  originalUser: string;
  venueName: string;
  onClose: () => void;
  onSend: (reply: string) => Promise<void>;
}

export default function ReplyModal({ originalUser, venueName, onClose, onSend }: ReplyModalProps) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || sending) return;

    setSending(true);
    try {
      await onSend(reply.trim());
      onClose();
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end justify-center z-50 animate-fadeIn p-4">
      <div className="bg-gradient-to-b from-[#c5ccd4] to-[#a8b4c0] rounded-t-2xl w-full max-w-lg p-4 animate-slideUp shadow-[0_-4px_20px_rgba(0,0,0,0.3)] border-t-2 border-white/30">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 
              className="text-lg font-bold text-gray-900" 
              style={{ textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}
            >
              Reply to @{originalUser}
            </h3>
            <p 
              className="text-xs text-gray-600"
              style={{ textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}
            >
              at {venueName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 p-1 active:scale-90 transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        {/* Reply Form */}
        <form onSubmit={handleSubmit}>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply..."
            className="w-full p-3 bg-white border border-gray-400 rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900"
            rows={4}
            maxLength={500}
            autoFocus
          />
          <p className="text-[10px] text-gray-600 mt-1 text-right" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}>
            {reply.length}/500
          </p>

          {/* Actions */}
          <div className="flex gap-3 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-gradient-to-b from-gray-200 to-gray-300 text-gray-800 font-bold rounded-lg shadow-md border border-gray-400 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all text-sm"
              style={{ textShadow: '0 1px 0 rgba(255,255,255,0.8)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reply.trim() || sending}
              className="flex-1 py-2.5 px-4 bg-gradient-to-b from-[#5ba4e5] to-[#3b7fc4] text-white font-bold rounded-lg shadow-md border border-[#2d5f9f] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
              style={{ textShadow: '0 -1px 0 rgba(0,0,0,0.3)' }}
            >
              {sending ? (
                'Sending...'
              ) : (
                <>
                  <Send size={14} />
                  Send Reply
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

