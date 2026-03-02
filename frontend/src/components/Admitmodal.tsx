import { User, UserCheck, UserX } from 'lucide-react';

interface AdmitModalProps {
  username: string;
  onAdmit: () => void;
  onDeny: () => void;
}

export const AdmitModal = ({ username, onAdmit, onDeny }: AdmitModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
    <style>{`
      @keyframes admitPop {
        from { opacity: 0; transform: scale(0.92) translateY(8px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
      .admit-card {
        animation: admitPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
    `}</style>
    <div className="admit-card pointer-events-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl shadow-black/70 p-5 w-80">
      {/* Pulse ring */}
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-full bg-zinc-700 flex items-center justify-center">
            <User size={18} className="text-zinc-300" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full border-2 border-zinc-900" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-zinc-400 text-[11px] font-medium uppercase tracking-wider mb-0.5">
            Waiting to join
          </p>
          <p className="text-white font-semibold text-sm truncate">{username}</p>
          <p className="text-zinc-500 text-xs mt-0.5">wants to join the interview</p>
        </div>
      </div>

      <div className="flex gap-2.5 mt-4">
        <button
          onClick={onDeny}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors border border-zinc-700"
        >
          <UserX size={14} />
          Deny
        </button>
        <button
          onClick={onAdmit}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-900/30"
        >
          <UserCheck size={14} />
          Admit
        </button>
      </div>
    </div>
  </div>
);