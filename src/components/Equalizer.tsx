import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { AudioController } from '../services/AudioController';

interface Band {
  label: string;
  index: number;
}

const BANDS: Band[] = [
  { label: 'Bass',     index: 0 },
  { label: 'Low-Mid',  index: 2 },
  { label: 'Mid',      index: 4 },
  { label: 'High-Mid', index: 6 },
  { label: 'Treble',   index: 9 },
];

type PresetName = 'Flat' | 'Pop' | 'Rock' | 'Bass Boost';

const PRESETS: Record<PresetName, number[]> = {
  Flat:         [ 0,  0,  0,  0,  0],
  Pop:          [-1,  4,  3, -2, -1],
  Rock:         [ 5, -1,  1,  5,  6],
  'Bass Boost': [ 7,  5,  1,  0,  0],
};

const BAND_INDICES = BANDS.map((b) => b.index);

function formatGain(gain: number): string {
  if (gain === 0) return '0';
  return gain > 0 ? `+${gain}` : `${gain}`;
}

function gainToPercent(gain: number): number {
  return ((gain + 12) / 24) * 100;
}

export function Equalizer(): React.ReactElement {
  const [gains, setGains] = useState<number[]>([0, 0, 0, 0, 0]);
  const [activePreset, setActivePreset] = useState<PresetName | null>('Flat');

  const audio = AudioController.getInstance();

  const applyGains = useCallback((nextGains: number[]) => {
    nextGains.forEach((gain, i) => {
      audio.setEqualizerBand(BAND_INDICES[i], gain);
    });
    setGains(nextGains);
  }, [audio]);

  function handleBandChange(bandIdx: number, value: number): void {
    const next = [...gains];
    next[bandIdx] = value;
    audio.setEqualizerBand(BAND_INDICES[bandIdx], value);
    setGains(next);
    setActivePreset(null);
  }

  function handlePreset(preset: PresetName): void {
    setActivePreset(preset);
    audio.applyPreset(preset);
    applyGains(PRESETS[preset]);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-purple-400" strokeWidth={2} />
          <span className="text-sm font-semibold text-slate-200">Equalizer</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {(Object.keys(PRESETS) as PresetName[]).map((preset) => (
            <motion.button
              key={preset}
              whileTap={{ scale: 0.92 }}
              onClick={() => handlePreset(preset)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                activePreset === preset
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'glass-card text-slate-400 hover:text-slate-200'
              }`}
            >
              {preset}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {BANDS.map((band, i) => {
          const gain = gains[i];
          const fillPct = gainToPercent(gain);
          const isBoost = gain > 0;
          const isCut = gain < 0;

          return (
            <div key={band.label} className="flex flex-col items-center gap-2">
              <span
                className={`text-[11px] font-mono tabular-nums transition-colors ${
                  isBoost ? 'text-purple-300' : isCut ? 'text-blue-300' : 'text-slate-500'
                }`}
              >
                {formatGain(gain)}
                <span className="text-[9px] text-slate-600">dB</span>
              </span>

              <div className="relative flex justify-center" style={{ height: '96px' }}>
                <div className="absolute inset-x-0 top-0 bottom-0 flex justify-center">
                  <div className="w-[3px] h-full rounded-full bg-white/5" />
                </div>

                <div
                  className="absolute left-1/2 -translate-x-1/2 w-[3px] rounded-full transition-none"
                  style={{
                    background: isBoost
                      ? 'linear-gradient(to top, #8b5cf6, #ec4899)'
                      : isCut
                      ? 'linear-gradient(to bottom, #3b82f6, #06b6d4)'
                      : 'transparent',
                    height: `${Math.abs(gain / 12) * 44}px`,
                    bottom: gain >= 0 ? '50%' : 'auto',
                    top: gain < 0 ? '50%' : 'auto',
                  }}
                />

                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={gain}
                  aria-label={`${band.label} equalizer band`}
                  onChange={(e) => handleBandChange(i, Number(e.target.value))}
                  className="relative cursor-pointer appearance-none bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded
                    [writing-mode:vertical-lr] [direction:rtl]
                    [&::-webkit-slider-runnable-track]:w-[3px]
                    [&::-webkit-slider-runnable-track]:rounded-full
                    [&::-webkit-slider-runnable-track]:bg-transparent
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:shadow-md
                    [&::-webkit-slider-thumb]:shadow-purple-500/50
                    [&::-webkit-slider-thumb]:cursor-grab
                    [&::-webkit-slider-thumb]:active:cursor-grabbing
                    [&::-webkit-slider-thumb]:transition-transform
                    [&::-webkit-slider-thumb]:hover:scale-110
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-white
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:cursor-grab"
                  style={{ height: '96px', width: '16px' }}
                />
              </div>

              <div className="w-full h-1 rounded-full overflow-hidden bg-white/5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  animate={{ width: `${fillPct}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </div>

              <span className="text-[10px] text-slate-600 font-medium text-center leading-tight">
                {band.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
