import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { ProgressBar } from './ProgressBar';

const iconBtn =
  'relative flex items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-30 disabled:cursor-not-allowed';

interface ControlButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  'aria-label': string;
  children: React.ReactNode;
}

function ControlButton({ onClick, disabled = false, className = '', children, ...rest }: ControlButtonProps): React.ReactElement {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: disabled ? 1 : 1.08 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onClick={onClick}
      disabled={disabled}
      className={`${iconBtn} ${className}`}
      aria-label={rest['aria-label']}
    >
      {children}
    </motion.button>
  );
}

export function PlayerControls(): React.ReactElement {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const stop = usePlayerStore((s) => s.stop);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrev = usePlayerStore((s) => s.playPrev);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const seek = usePlayerStore((s) => s.seek);

  const noSong = currentSong === null;
  const isMuted = volume === 0;

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setVolume(parseFloat(e.target.value));
  }

  function toggleMute(): void {
    setVolume(isMuted ? 0.8 : 0);
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-3 min-w-0">
        <motion.div
          key={currentSong?.id ?? 'empty'}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20"
        >
          {currentSong?.coverUrl ? (
            <img
              src={currentSong.coverUrl}
              alt={currentSong.title}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <span className="text-lg font-bold text-white">
              {currentSong ? currentSong.title.charAt(0).toUpperCase() : '♪'}
            </span>
          )}
        </motion.div>

        <div className="flex flex-col min-w-0">
          <motion.p
            key={currentSong?.id ?? 'title'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-semibold text-slate-100 truncate"
          >
            {currentSong?.title ?? 'No track selected'}
          </motion.p>
          <p className="text-xs text-slate-500 truncate">
            {currentSong?.artist ?? 'Load audio files to start'}
          </p>
        </div>
      </div>

      <ProgressBar currentTime={currentTime} duration={duration} onSeek={seek} />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ControlButton
            aria-label="Previous"
            onClick={playPrev}
            disabled={noSong}
            className="w-9 h-9 text-slate-400 hover:text-white hover:bg-white/10"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </ControlButton>

          <ControlButton
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={togglePlay}
            disabled={noSong}
            className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
          >
            <motion.div
              key={isPlaying ? 'pause' : 'play'}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              {isPlaying
                ? <Pause className="w-5 h-5 fill-white" />
                : <Play className="w-5 h-5 fill-white translate-x-0.5" />
              }
            </motion.div>
          </ControlButton>

          <ControlButton
            aria-label="Stop"
            onClick={stop}
            disabled={noSong}
            className="w-9 h-9 text-slate-400 hover:text-white hover:bg-white/10"
          >
            <Square className="w-4 h-4 fill-current" />
          </ControlButton>

          <ControlButton
            aria-label="Next"
            onClick={playNext}
            disabled={noSong}
            className="w-9 h-9 text-slate-400 hover:text-white hover:bg-white/10"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </ControlButton>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="text-slate-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
          >
            {isMuted
              ? <VolumeX className="w-4 h-4" />
              : <Volume2 className="w-4 h-4" />
            }
          </button>

          <div className="relative w-20 sm:w-28 h-5 flex items-center group">
            <div className="absolute inset-y-1/2 -translate-y-1/2 w-full h-1.5 rounded-full bg-white/10 overflow-hidden pointer-events-none">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              aria-label="Volume"
              className="relative w-full h-1.5 appearance-none bg-transparent cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:shadow-purple-500/50
                [&::-webkit-slider-thumb]:opacity-0
                [&::-webkit-slider-thumb]:group-hover:opacity-100
                [&::-webkit-slider-thumb]:transition-opacity
                [&::-moz-range-thumb]:w-3
                [&::-moz-range-thumb]:h-3
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-white
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:opacity-0
                [&::-moz-range-thumb]:group-hover:opacity-100
                focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
