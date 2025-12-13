import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface BookmarkButtonProps {
  venueId: string;
  venueName: string;
}

export default function BookmarkButton({ venueId, venueName }: BookmarkButtonProps) {
  const { user } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const checkBookmarked = async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('venue_id', venueId)
        .eq('user_id', user.id)
        .single();
      
      setBookmarked(!!data);
    };

    checkBookmarked();
  }, [user?.id, venueId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user?.id) {
      alert('Please sign in to save venues');
      return;
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    const newBookmarked = !bookmarked;
    setBookmarked(newBookmarked);

    if (newBookmarked) {
      await supabase.from('bookmarks').insert({
        venue_id: venueId,
        venue_name: venueName,
        user_id: user.id,
      });
    } else {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('venue_id', venueId)
        .eq('user_id', user.id);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-1 text-xs font-medium transition-all ${
        bookmarked ? 'text-yellow-600' : 'text-gray-600'
      } hover:scale-110 active:scale-95`}
      title={bookmarked ? 'Remove from saved' : 'Save venue'}
    >
      <Bookmark
        size={16}
        fill={bookmarked ? 'currentColor' : 'none'}
      />
      {bookmarked ? 'Saved' : 'Save'}
    </button>
  );
}

