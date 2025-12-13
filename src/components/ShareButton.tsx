import { Share2, Link, Check } from 'lucide-react';
import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title,
      text,
      url: url || window.location.href,
    };

    // Try native share API first (works on mobile)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
        return;
      } catch (err) {
        // User cancelled, do nothing
        if ((err as Error).name === 'AbortError') return;
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(url || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 font-medium transition-colors"
    >
      {copied ? (
        <>
          <Check size={14} className="text-green-600" />
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          {'share' in navigator ? <Share2 size={14} /> : <Link size={14} />}
          Share
        </>
      )}
    </button>
  );
}

