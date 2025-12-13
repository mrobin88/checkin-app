import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface LikeButtonProps {
  messageId: string;
  initialLikeCount?: number;
}

export default function LikeButton({ messageId, initialLikeCount = 0 }: LikeButtonProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Check if user has liked this
    const checkLiked = async () => {
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .single();
      
      setLiked(!!data);
    };

    // Get like count
    const getLikeCount = async () => {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('message_id', messageId);
      
      setLikeCount(count || 0);
    };

    checkLiked();
    getLikeCount();

    // Subscribe to like changes
    const subscription = supabase
      .channel(`likes-${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `message_id=eq.${messageId}`,
        },
        () => {
          getLikeCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, messageId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user?.id) {
      alert('Please sign in to like check-ins');
      return;
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (newLiked) {
      // Add like
      await supabase.from('likes').insert({
        message_id: messageId,
        user_id: user.id,
      });
    } else {
      // Remove like
      await supabase
        .from('likes')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id);
    }
  };

  return (
    <button
      onClick={handleLike}
      className={`flex items-center gap-1 text-xs font-medium transition-all ${
        liked ? 'text-red-500' : 'text-gray-600'
      } hover:scale-110 active:scale-95`}
    >
      <Heart
        size={16}
        className={`transition-all ${isAnimating ? 'scale-125' : ''}`}
        fill={liked ? 'currentColor' : 'none'}
      />
      {likeCount > 0 && <span>{likeCount}</span>}
    </button>
  );
}

