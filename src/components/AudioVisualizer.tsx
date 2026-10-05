import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { AudioController } from '../services/AudioController';

const BAR_COUNT = 80;
const BAR_GAP = 2;
const MIN_BAR_HEIGHT = 2;
const IDLE_AMPLITUDE = 3;
const IDLE_SPEED = 0.012;

function drawIdle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  tick: number,
): void {
  ctx.clearRect(0, 0, w, h);
  const barW = (w - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT;

  for (let i = 0; i < BAR_COUNT; i++) {
    const phase = (i / BAR_COUNT) * Math.PI * 4;
    const wave = Math.sin(phase + tick) * IDLE_AMPLITUDE;
    const barH = MIN_BAR_HEIGHT + Math.abs(wave);
    const x = i * (barW + BAR_GAP);
    const y = h - barH;

    ctx.fillStyle = 'rgba(139, 92, 246, 0.25)';
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, 2);
    ctx.fill();
  }
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: Uint8Array,
): void {
  ctx.clearRect(0, 0, w, h);
  const barW = (w - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT;

  const gradient = ctx.createLinearGradient(0, h, 0, 0);
  gradient.addColorStop(0, '#3b82f6');
  gradient.addColorStop(0.45, '#8b5cf6');
  gradient.addColorStop(1, '#ec4899');

  const glowGradient = ctx.createLinearGradient(0, h, 0, 0);
  glowGradient.addColorStop(0, 'rgba(59, 130, 246, 0.18)');
  glowGradient.addColorStop(0.45, 'rgba(139, 92, 246, 0.18)');
  glowGradient.addColorStop(1, 'rgba(236, 72, 153, 0.18)');

  const step = Math.floor(data.length / BAR_COUNT);

  for (let i = 0; i < BAR_COUNT; i++) {
    const sample = data[i * step] ?? 0;
    const normalized = sample / 255;
    const barH = Math.max(MIN_BAR_HEIGHT, normalized * h * 0.92);
    const x = i * (barW + BAR_GAP);
    const y = h - barH;

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.roundRect(x - 1, y - 2, barW + 2, barH + 2, 3);
    ctx.fill();

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, 2);
    ctx.fill();
  }
}

export function AudioVisualizer(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tickRef = useRef<number>(0);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentSong = usePlayerStore((s) => s.currentSong);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    });
    resizeObserver.observe(canvas);

    const { width, height } = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    let analyser: AnalyserNode | null = null;
    let data: Uint8Array<ArrayBuffer> | null = null;

    if (isPlaying) {
      analyser = AudioController.getInstance().getAnalyser();
      data = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    }

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const cssW = canvas.getBoundingClientRect().width;
      const cssH = canvas.getBoundingClientRect().height;

      if (isPlaying && analyser && data) {
        analyser.getByteFrequencyData(data);
        drawBars(ctx, cssW, cssH, data);
      } else {
        tickRef.current += IDLE_SPEED;
        drawIdle(ctx, cssW, cssH, tickRef.current);
      }
    };

    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
    };
  }, [isPlaying]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: '21/6' }}>
      {currentSong?.coverUrl && (
        <img
          src={currentSong.coverUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm scale-105"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      <canvas
        ref={canvasRef}
        className="relative w-full h-full"
        aria-label="Audio frequency visualizer"
        role="img"
      />

      <div className="absolute bottom-2 right-3 flex items-end gap-[2px] opacity-40">
        {Array.from({ length: 4 }, (_, i) => (
          <span
            key={i}
            className={`block w-[3px] rounded-full bg-purple-400 ${isPlaying ? 'animate-pulse' : ''}`}
            style={{ height: `${6 + i * 3}px`, animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
