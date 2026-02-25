import { PhoneOff, X } from 'lucide-react';

interface EndCallModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const EndCallModal = ({ onConfirm, onCancel }: EndCallModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <style>{`
      @keyframes fadeScale {
        from { opacity: 0; transform: scale(0.94); }
        to   { opacity: 1; transform: scale(1); }
      }
      .end-call-dialog { animation: fadeScale 0.18s ease forwards; }
    `}</style>

    <div className="end-call-dialog bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 w-[340px]">
      <div className="flex items-start justify-between mb-5">
        <div className="w-11 h-11 rounded-full bg-red-500/15 border border-red-500/20 flex items-center justify-center">
          <PhoneOff size={18} className="text-red-400" />
        </div>
        <button
          onClick={onCancel}
          className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800 -mt-0.5"
        >
          <X size={16} />
        </button>
      </div>

      <h3 className="text-white font-semibold text-base mb-1.5">Leave this session?</h3>
      <p className="text-zinc-400 text-sm leading-relaxed mb-6">
        The interview will end for both participants. You won't be able to rejoin.
      </p>

      <div className="flex gap-2.5">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors border border-zinc-700"
        >
          Stay in call
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors shadow-lg shadow-red-900/20"
        >
          Leave
        </button>
      </div>
    </div>
  </div>
);