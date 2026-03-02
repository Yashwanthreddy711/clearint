import { MicOff } from 'lucide-react';

interface VideoCardProps {
  videoRef?: React.RefObject<HTMLVideoElement>;
  label: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isMain?: boolean;
  onClick?: () => void;
  className?: string;
}

export const VideoCard = ({
  videoRef,
  label,
  isMuted = false,
  isVideoOff = false,
  isMain = false,
  onClick,
  className = '',
}: VideoCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`relative bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center group transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-zinc-600 hover:shadow-lg hover:shadow-black/40' : ''
      } ${className}`}
    >
      {/* Video element always rendered so ref stays attached */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        controls={false}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoOff ? 'opacity-0 absolute inset-0' : 'opacity-100'}`}
      />

      {/* Avatar fallback when video off */}
      {isVideoOff && (
        <div className="flex flex-col items-center gap-3 z-10">
          <div
            className={`rounded-full bg-zinc-700 flex items-center justify-center font-bold text-zinc-300 select-none ${
              isMain ? 'w-24 h-24 text-3xl' : 'w-10 h-10 text-base'
            }`}
          >
            {label[0]?.toUpperCase()}
          </div>
          {isMain && (
            <p className="text-zinc-500 text-xs">Camera is off</p>
          )}
        </div>
      )}

      {/* Bottom-left name badge */}
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1.5 z-20">
        {isMuted && <MicOff size={11} className="text-red-400" />}
        <span className="text-white text-xs font-medium leading-none">{label}</span>
      </div>

      {/* Click hint for PiP */}
      {onClick && (
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10">
          <span className="text-white text-[11px] bg-black/60 px-2.5 py-1 rounded-full font-medium">
            Expand
          </span>
        </div>
      )}
    </div>
  );
};