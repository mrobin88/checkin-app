import { useState } from 'react';
import { X, Building2, Mail, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ClaimBusinessModalProps {
  venueId: string;
  venueName: string;
  onClose: () => void;
}

export default function ClaimBusinessModal({ venueId, venueName, onClose }: ClaimBusinessModalProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSending(true);

    try {
      // Save claim to database
      await supabase.from('venue_claims').insert({
        venue_id: venueId,
        venue_name: venueName,
        user_id: user.id,
        user_email: user.email,
        claim_message: message,
        status: 'pending',
      });

      // In production, you'd trigger an email here via Edge Function
      // For now, we'll just show success
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting claim:', error);
      alert('Failed to submit claim. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Claim Submitted!</h3>
            <p className="text-gray-600 mb-4">
              We'll review your claim and get back to you at <strong>{user?.email}</strong> within 1-2 business days.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Building2 size={28} />
              <h2 className="text-xl font-bold">Claim Business</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
              <X size={24} />
            </button>
          </div>
          <p className="text-blue-100 text-sm">Own or manage this venue?</p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Venue</label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-900">{venueName}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Your Email</label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-700">{user?.email || 'Please sign in'}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Tell us about your relationship to this business
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="I am the owner/manager of this business..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              rows={4}
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>What happens next?</strong>
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
              <li>We'll verify your claim</li>
              <li>You'll get management access to this venue</li>
              <li>Add photos, deals, and respond to check-ins</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!user || sending}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 disabled:opacity-50"
            >
              <Send size={18} />
              {sending ? 'Sending...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

