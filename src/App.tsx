import React, { useRef } from 'react';
import { UploadCloud, Music2 } from 'lucide-react';
import { usePlayerStore } from './store/usePlayerStore';
import { PlayerControls } from './components/PlayerControls';
import { AudioVisualizer } from './components/AudioVisualizer';
import { Equalizer } from './components/Equalizer';
import { Playlist } from './components/Playlist';
import { Song } from './types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function fileToSong(file: File): Song {
  return {
    id: generateId(),
    title: file.name.replace(/\.[^.]+$/, ''),
    artist: 'Unknown Artist',
    album: 'Unknown Album',
    duration: 0,
    fileUrl: URL.createObjectURL(file),
    coverUrl: '',
  };
}

export default function App(): React.ReactElement {
  const addSongLast = usePlayerStore((s) => s.addSongLast);
  const isDragging = useRef(false);
  const [dragOver, setDragOver] = React.useState(false);

  function handleFiles(files: FileList | File[]): void {
    Array.from(files)
      .filter((f) => f.type.startsWith('audio/'))
      .forEach((f) => addSongLast(fileToSong(f)));
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    isDragging.current = false;
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    if (!isDragging.current) {
      isDragging.current = true;
      setDragOver(true);
    }
  }

  function handleDragLeave(): void {
    isDragging.current = false;
    setDragOver(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  }

  return (
    <div
      className="bg-app min-h-screen text-slate-100"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {dragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="glass-panel gradient-border flex flex-col items-center gap-4 px-16 py-12">
            <UploadCloud className="w-12 h-12 text-blue-400" strokeWidth={1.5} />
            <p className="gradient-text text-xl font-semibold">Drop audio files to add them</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-6 flex flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center glow-purple shrink-0">
              <Music2 className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold gradient-text leading-none">Aura Player</h1>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                Web Audio · Doubly Linked List
              </p>
            </div>
          </div>

          <label className="btn-primary cursor-pointer px-4 py-2 text-sm font-medium flex items-center gap-2 shrink-0">
            <UploadCloud className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">Load Files</span>
            <span className="sm:hidden">Load</span>
            <input
              type="file"
              multiple
              accept="audio/*"
              className="hidden"
              onChange={handleInputChange}
            />
          </label>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 flex flex-col gap-6">
            <div className="glass-panel p-4">
              <AudioVisualizer />
            </div>

            <div className="glass-panel p-4">
              <Equalizer />
            </div>
          </section>

          <section className="lg:col-span-5 min-h-0">
            <div className="glass-panel h-full flex flex-col">
              <Playlist />
            </div>
          </section>
        </main>
      </div>

      <footer
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/5"
        style={{
          background: 'rgba(10, 8, 28, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <PlayerControls />
        </div>
      </footer>
    </div>
  );
}
