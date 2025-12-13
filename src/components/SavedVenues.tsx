import { useState, useEffect } from 'react';
import { Bookmark, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SavedVenue {
  id: string;
  venue_id: string;
  venue_name: string;
  created_at: string;
}

interface SavedVenuesProps {
  onClose: () => void;
  onVenueClick?: (venueId: string, venueName: string) => void;
}

export default function SavedVenues({ onClose, onVenueClick }: SavedVenuesProps) {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<SavedVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;

    const loadBookmarks = async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setBookmarks(data || []);
      setLoading(false);
    };

    loadBookmarks();
  }, [user?.id]);

  const handleDelete = async (bookmarkId: string) => {
    setDeleting(prev => new Set(prev).add(bookmarkId));
    
    await supabase.from('bookmarks').delete().eq('id', bookmarkId);
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    
    setDeleting(prev => {
      const next = new Set(prev);
      next.delete(bookmarkId);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 bg-[#c5ccd4] z-50 flex flex-col">
      <header className="bg-gradient-to-b from-[#6d84a3] to-[#4d6580] border-b-2 border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="text-white font-medium text-sm">
            ← Back
          </button>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Bookmark size={20} />
            Saved Venues
          </h1>
          <div className="w-14" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-gray-500" />
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Bookmark size={48} className="text-gray-400 mb-3" />
            <p className="text-gray-700 font-bold">No saved venues yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Tap the bookmark icon on venues to save them
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map(bookmark => {
              const isDeleting = deleting.has(bookmark.id);
              return (
                <div
                  key={bookmark.id}
                  className="bg-white rounded-xl shadow border border-gray-300 overflow-hidden"
                >
                  <button
                    onClick={() => onVenueClick?.(bookmark.venue_id, bookmark.venue_name)}
                    className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-gradient-to-b from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bookmark size={20} className="text-yellow-600" fill="currentColor" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{bookmark.venue_name}</p>
                      <p className="text-xs text-gray-500">
                        Saved {new Date(bookmark.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(bookmark.id);
                      }}
                      disabled={isDeleting}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      {isDeleting ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

