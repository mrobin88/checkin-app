import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if user has dismissed the prompt recently
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Don't show again for 7 days after dismissal
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after a delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS guide after a delay if on iOS Safari and not installed
    if (iOS && !standalone) {
      const isInSafari =
        navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('CriOS');
      if (isInSafari) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 5000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isStandalone || !showPrompt) return null;

  // iOS Guide
  if (isIOS && showIOSGuide) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-slide-up">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Install CheckIn</h3>
              <button
                onClick={handleDismiss}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Install CheckIn on your iPhone for the best experience!
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Share size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">1. Tap the Share button</p>
                  <p className="text-sm text-gray-500">At the bottom of Safari</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Plus size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">2. Tap "Add to Home Screen"</p>
                  <p className="text-sm text-gray-500">Scroll down to find it</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Smartphone size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">3. Done!</p>
                  <p className="text-sm text-gray-500">CheckIn will be on your home screen</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border-t border-gray-200 p-4">
            <button
              onClick={handleDismiss}
              className="w-full py-3 text-gray-600 font-medium"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Install banner
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="bg-gradient-to-r from-[#5ba4e5] to-[#3b7fc4] rounded-2xl shadow-2xl p-4 max-w-md mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-3xl">📍</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white">Install CheckIn</h3>
            <p className="text-sm text-white/80">
              Add to home screen for the full experience
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="p-2 text-white/60 hover:text-white transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          {isIOS ? (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-blue-600 font-bold rounded-xl shadow-lg"
            >
              <Download size={18} />
              How to Install
            </button>
          ) : deferredPrompt ? (
            <button
              onClick={handleInstall}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-blue-600 font-bold rounded-xl shadow-lg"
            >
              <Download size={18} />
              Install Now
            </button>
          ) : (
            <button
              onClick={handleDismiss}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/20 text-white font-bold rounded-xl"
            >
              Continue in Browser
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Mini install button for header
export function InstallButton() {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
    }
    setDeferredPrompt(null);
  };

  if (!canInstall) return null;

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-b from-white to-gray-100 text-gray-800 font-bold rounded-lg shadow border border-gray-300 text-sm"
    >
      <Download size={14} />
      Install
    </button>
  );
}

