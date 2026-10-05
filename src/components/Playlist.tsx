import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Download,
  GripVertical,
  Hash,
  ListEnd,
  ListStart,
  Music2,
  Play,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Song } from '../types';
import { formatTime } from '../utils/formatTime';
import { exportToJson, importFromJson } from '../utils/playlistExporter';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function fileToSong(file: File): Song {
  return {
    id: generateId(),
    title: file.name.replace(/\.[^/.]+$/, ''),
    artist: 'Unknown Artist',
    album: 'Unknown Album',
    duration: 0,
    fileUrl: URL.createObjectURL(file),
    coverUrl: '',
  };
}

interface AddButtonProps {
  label: string;
  icon: React.ReactNode;
  accentClass: string;
  onChange: (file: File) => void;
}

function AddButton({ label, icon, accentClass, onChange }: AddButtonProps): React.ReactElement {
  return (
    <label className="glass-card cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors">
      <span className={accentClass}>{icon}</span>
      {label}
      <input
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onChange(file);
            e.target.value = '';
          }
        }}
      />
    </label>
  );
}

interface SortableRowProps {
  song: Song;
  index: number;
  isActive: boolean;
  isDragging: boolean;
  onPlay: (song: Song) => void;
  onRemove: (id: string) => void;
}

function SortableRow({ song, index, isActive, isDragging, onPlay, onRemove }: SortableRowProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: song.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 border transition-colors ${
        isActive
          ? 'bg-gradient-to-r from-blue-600/25 to-purple-600/25 border-purple-500/30'
          : 'hover:bg-white/5 border-transparent'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="shrink-0 text-slate-700 hover:text-slate-400 cursor-grab active:cursor-grabbing focus:outline-none touch-none"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => onPlay(song)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left focus:outline-none"
      >
        <div
          className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-mono ${
            isActive
              ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
              : 'bg-white/5 text-slate-500'
          }`}
        >
          {isActive ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            >
              <Play className="w-3 h-3 fill-white" />
            </motion.div>
          ) : (
            <span>{index + 1}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate leading-tight ${isActive ? 'text-purple-200' : 'text-slate-200'}`}>
            {song.title}
          </p>
          <p className="text-xs text-slate-500 truncate">{song.artist}</p>
        </div>
      </button>

      <div className="flex items-center gap-2 shrink-0">
        {song.duration > 0 && (
          <span className="text-xs font-mono text-slate-600 group-hover:hidden">
            {formatTime(song.duration)}
          </span>
        )}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onRemove(song.id)}
          aria-label={`Remove ${song.title}`}
          className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </div>
  );
}

interface DragOverlayRowProps {
  song: Song;
}

function DragOverlayRow({ song }: DragOverlayRowProps): React.ReactElement {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-purple-500/50 bg-slate-900/90 backdrop-blur-sm shadow-xl shadow-purple-500/20">
      <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <div className="w-7 h-7 shrink-0 rounded-lg bg-white/5 flex items-center justify-center">
        <Music2 className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{song.title}</p>
        <p className="text-xs text-slate-500 truncate">{song.artist}</p>
      </div>
    </div>
  );
}

export function Playlist(): React.ReactElement {
  const playlist = usePlayerStore((s) => s.playlist);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const addSongFirst = usePlayerStore((s) => s.addSongFirst);
  const addSongLast = usePlayerStore((s) => s.addSongLast);
  const addSongAt = usePlayerStore((s) => s.addSongAt);
  const removeSong = usePlayerStore((s) => s.removeSong);
  const setCurrentSong = usePlayerStore((s) => s.setCurrentSong);
  const reorder = usePlayerStore((s) => s.reorder);
  const loadImported = usePlayerStore((s) => s.loadImported);

  const [insertIndex, setInsertIndex] = useState<string>('0');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const songs = playlist.toArray();
  const activeSong = activeDragId !== null ? songs.find((s) => s.id === activeDragId) ?? null : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragStart(event: DragStartEvent): void {
    setActiveDragId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent): void {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = songs.findIndex((s) => s.id === active.id);
    const toIndex = songs.findIndex((s) => s.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      reorder(fromIndex, toIndex);
    }
  }

  function handleAddAt(file: File): void {
    const index = Math.min(Math.max(0, parseInt(insertIndex, 10) || 0), songs.length);
    addSongAt(index, fileToSong(file));
  }

  function handleInsertIndexChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const raw = e.target.value;
    if (raw === '' || /^\d+$/.test(raw)) setInsertIndex(raw);
  }

  function handleExport(): void {
    exportToJson(songs);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = importFromJson(String(ev.target?.result ?? ''));
        loadImported(imported);
      } catch {
        // silently ignore malformed files
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Queue</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {songs.length === 0
              ? 'Empty — add audio files below'
              : `${songs.length} track${songs.length === 1 ? '' : 's'}`}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleExport}
            disabled={songs.length === 0}
            aria-label="Export playlist as JSON"
            className="glass-card flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export
          </motion.button>

          <label className="glass-card cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors">
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            Import
            <input
              ref={importRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportFile}
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 pb-3 shrink-0 border-b border-white/5">
        <AddButton
          label="Add First"
          icon={<ListStart className="w-3.5 h-3.5" />}
          accentClass="text-blue-400"
          onChange={(f) => addSongFirst(fileToSong(f))}
        />
        <AddButton
          label="Add Last"
          icon={<ListEnd className="w-3.5 h-3.5" />}
          accentClass="text-purple-400"
          onChange={(f) => addSongLast(fileToSong(f))}
        />
        <div className="flex items-center gap-1.5">
          <div className="glass-card flex items-center gap-1.5 px-2 py-1.5 rounded-lg">
            <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              inputMode="numeric"
              value={insertIndex}
              onChange={handleInsertIndexChange}
              aria-label="Insert position"
              className="w-8 bg-transparent text-xs text-center text-slate-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 rounded"
            />
          </div>
          <AddButton
            label="Add At"
            icon={<Plus className="w-3.5 h-3.5" />}
            accentClass="text-pink-400"
            onChange={handleAddAt}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
        <AnimatePresence initial={false}>
          {songs.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-3 py-16 text-slate-600"
            >
              <Music2 className="w-10 h-10 opacity-30" strokeWidth={1} />
              <p className="text-sm">No tracks yet</p>
            </motion.div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={songs.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {songs.map((song, index) => (
                  <SortableRow
                    key={song.id}
                    song={song}
                    index={index}
                    isActive={currentSong?.id === song.id}
                    isDragging={activeDragId === song.id}
                    onPlay={setCurrentSong}
                    onRemove={removeSong}
                  />
                ))}
              </SortableContext>

              <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
                {activeSong !== null ? <DragOverlayRow song={activeSong} /> : null}
              </DragOverlay>
            </DndContext>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
