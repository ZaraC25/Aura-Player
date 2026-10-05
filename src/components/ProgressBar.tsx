import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { formatTime } from '../utils/formatTime';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export function ProgressBar({ currentTime, duration, onSeek }: ProgressBarProps): React.ReactElement {
  const trackRef = useRef<HTMLDivElement>(null);

  const getTimeFromEvent = useCallback(
    (clientX: number): number => {
      const el = trackRef.current;
      if (!el || duration === 0) return 0;
      const { left, width } = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - left) / width));
      return ratio * duration;
    },
    [duration],
  );

  function handleClick(e: React.MouseEvent<HTMLDivElement>): void {
    onSeek(getTimeFromEvent(e.clientX));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    const step = 5;
    if (e.key === 'ArrowRight') onSeek(Math.min(duration, currentTime + step));
    if (e.key === 'ArrowLeft') onSeek(Math.max(0, currentTime - step));
  }

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="flex flex-col gap-1.5 w-full select-none">
      <div
        ref={trackRef}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        tabIndex={0}
        className="relative h-1.5 w-full cursor-pointer rounded-full bg-white/10 group focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
          style={{ width: `${progress * 100}%` }}
          layout
          transition={{ type: 'tween', duration: 0.1 }}
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-md shadow-purple-500/40 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${progress * 100}%` }}
        />
      </div>

      <div className="flex justify-between text-xs font-mono text-slate-500">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
