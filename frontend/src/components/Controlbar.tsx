import { Mic, MicOff, Video, VideoOff, MonitorUp, MonitorStop, PhoneOff } from 'lucide-react';

interface ControlBarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
}

interface ControlBtnProps {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  icon: React.ElementType;
  label: string;
}

const ControlBtn = ({ onClick, active = false, danger = false, icon: Icon, label }: ControlBtnProps) => (
  <div className="flex flex-col items-center gap-2">
    <button
      onClick={onClick}
      title={label}
      className={`
        w-12 h-12 rounded-full flex items-center justify-center
        transition-all duration-150 focus:outline-none
        focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950
        ${danger
          ? 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500 shadow-lg shadow-red-900/30'
          : active
          ? 'bg-zinc-600 hover:bg-zinc-500 text-white focus:ring-zinc-400'
          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white focus:ring-zinc-600'
        }
      `}
    >
      <Icon size={19} />
    </button>
    <span className="text-zinc-500 text-[10px] font-medium tracking-wide select-none">{label}</span>
  </div>
);

export const ControlBar = ({
  isMuted,
  isVideoOff,
  isScreenSharing,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
}: ControlBarProps) => (
  <div className="flex items-end justify-center gap-5 py-5 px-8 bg-zinc-950 border-t border-zinc-800/70">
    <ControlBtn
      onClick={onToggleMute}
      active={isMuted}
      icon={isMuted ? MicOff : Mic}
      label={isMuted ? 'Unmute' : 'Mute'}
    />
    <ControlBtn
      onClick={onToggleVideo}
      active={isVideoOff}
      icon={isVideoOff ? VideoOff : Video}
      label={isVideoOff ? 'Start Cam' : 'Stop Cam'}
    />
    <ControlBtn
      onClick={onToggleScreenShare}
      active={isScreenSharing}
      icon={isScreenSharing ? MonitorStop : MonitorUp}
      label={isScreenSharing ? 'Stop Share' : 'Share'}
    />

    {/* Divider */}
    <div className="w-px h-10 bg-zinc-800 self-center mx-1" />

    <ControlBtn
      onClick={onEndCall}
      danger
      icon={PhoneOff}
      label="End Call"
    />
  </div>
);