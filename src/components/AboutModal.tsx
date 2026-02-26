import { X } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export default function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gradient-to-b from-white to-gray-100 rounded-3xl w-full max-w-sm max-h-[85vh] overflow-y-auto shadow-2xl border-2 border-gray-300/80 p-6 animate-slideUp">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            About CheckIn
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>
            This app is <strong>for fun</strong>—a small place to share check-ins and spots with people nearby. Please don’t use it for anything malicious or to harass anyone.
          </p>
          <p>
            Data you enter is stored. If you want something changed or removed—or your data deleted—reach out and we’ll sort it. Contact: <a href="https://github.com/mrobin88" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">github.com/mrobin88</a> (@mrobin88).
          </p>
          <div className="pt-2 border-t border-gray-200 space-y-2">
            <p className="text-gray-600 italic">
              We wanted this to feel like an old iPhone app—simple, a bit nostalgic, and focused on a small community. Not a big tech product, just a place where people can use it and it grows a little community on its own.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-b from-[#6d84a3] to-[#4d6580] text-white font-semibold text-sm shadow border border-gray-500/30 active:scale-[0.98] transition-transform"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
