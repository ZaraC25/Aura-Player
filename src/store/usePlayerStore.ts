import { create } from 'zustand';
import { Song } from '../types';
import { DoublyLinkedList } from '../data-structures/DoublyLinkedList';
import { AudioController } from '../services/AudioController';

const audio = AudioController.getInstance();

interface PlayerState {
  playlist: DoublyLinkedList<Song>;
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  currentTime: number;
  duration: number;
}

interface PlayerActions {
  addSongFirst: (song: Song) => void;
  addSongLast: (song: Song) => void;
  addSongAt: (index: number, song: Song) => void;
  removeSong: (id: string) => void;
  reorder: (fromIndex: number, toIndex: number) => void;
  loadImported: (songs: Song[]) => void;
  playNext: () => void;
  playPrev: () => void;
  setCurrentSong: (song: Song) => void;
  togglePlay: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  seek: (time: number) => void;
  syncTime: () => void;
}

export type PlayerStore = PlayerState & PlayerActions;

export const usePlayerStore = create<PlayerStore>((set, get) => {
  audio.onTimeUpdate(() => get().syncTime());
  audio.onEnded(() => get().playNext());

  return {
    playlist: new DoublyLinkedList<Song>(),
    currentSong: null,
    isPlaying: false,
    volume: 1,
    progress: 0,
    currentTime: 0,
    duration: 0,

    addSongFirst: (song: Song) => {
      const { playlist, currentSong } = get();
      playlist.addFirst(song);
      const first = playlist.getCurrent();
      if (!currentSong && first) {
        audio.load(first.fileUrl);
        set({ playlist, currentSong: first, duration: first.duration });
      } else {
        set({ playlist });
      }
    },

    addSongLast: (song: Song) => {
      const { playlist, currentSong } = get();
      playlist.addLast(song);
      if (!currentSong) {
        const current = playlist.getCurrent();
        if (current) {
          audio.load(current.fileUrl);
          set({ playlist, currentSong: current, duration: current.duration });
          return;
        }
      }
      set({ playlist });
    },

    addSongAt: (index: number, song: Song) => {
      const { playlist, currentSong } = get();
      playlist.addAt(index, song);
      if (!currentSong) {
        const current = playlist.getCurrent();
        if (current) {
          audio.load(current.fileUrl);
          set({ playlist, currentSong: current, duration: current.duration });
          return;
        }
      }
      set({ playlist });
    },

    removeSong: (id: string) => {
      const { playlist, currentSong } = get();
      const wasCurrentSong = currentSong?.id === id;
      playlist.remove(id);
      const next = playlist.getCurrent();
      if (wasCurrentSong) {
        audio.stop();
        if (next) {
          audio.load(next.fileUrl);
        }
        set({ playlist, currentSong: next, isPlaying: false, progress: 0, currentTime: 0 });
      } else {
        set({ playlist });
      }
    },

    reorder: (fromIndex: number, toIndex: number) => {
      const { playlist, currentSong } = get();
      const songs = playlist.toArray();
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= songs.length ||
        toIndex >= songs.length
      ) return;

      const reordered = [...songs];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);

      const next = new DoublyLinkedList<Song>();
      reordered.forEach((s) => next.addLast(s));

      if (currentSong) {
        let cursor = next.getCurrent();
        while (cursor !== null && cursor.id !== currentSong.id) {
          cursor = next.next();
        }
      }

      set({ playlist: next });
    },

    loadImported: (songs: Song[]) => {
      const next = new DoublyLinkedList<Song>();
      songs.forEach((s) => next.addLast(s));
      audio.stop();
      set({
        playlist: next,
        currentSong: null,
        isPlaying: false,
        progress: 0,
        currentTime: 0,
        duration: 0,
      });
    },

    playNext: () => {
      const { playlist } = get();
      const next = playlist.next();
      if (next) {
        audio.load(next.fileUrl);
        audio.play();
        set({ currentSong: next, isPlaying: true, progress: 0, currentTime: 0, duration: next.duration });
      } else {
        audio.stop();
        set({ isPlaying: false, progress: 0, currentTime: 0 });
      }
    },

    playPrev: () => {
      const { playlist } = get();
      const prev = playlist.prev();
      if (prev) {
        audio.load(prev.fileUrl);
        audio.play();
        set({ currentSong: prev, isPlaying: true, progress: 0, currentTime: 0, duration: prev.duration });
      }
    },

    setCurrentSong: (song: Song) => {
      audio.load(song.fileUrl);
      audio.play();
      set({ currentSong: song, isPlaying: true, progress: 0, currentTime: 0, duration: song.duration });
    },

    togglePlay: () => {
      const { isPlaying, currentSong } = get();
      if (!currentSong) return;
      if (isPlaying) {
        audio.pause();
        set({ isPlaying: false });
      } else {
        audio.play();
        set({ isPlaying: true });
      }
    },

    stop: () => {
      audio.stop();
      set({ isPlaying: false, progress: 0, currentTime: 0 });
    },

    setVolume: (volume: number) => {
      const clamped = Math.min(1, Math.max(0, volume));
      audio.setVolume(clamped);
      set({ volume: clamped });
    },

    seek: (time: number) => {
      const { duration } = get();
      audio.seek(time);
      const progress = duration > 0 ? time / duration : 0;
      set({ currentTime: time, progress });
    },

    setProgress: (progress: number) => {
      const clamped = Math.min(1, Math.max(0, progress));
      const { duration } = get();
      const time = clamped * duration;
      audio.seek(time);
      set({ progress: clamped, currentTime: time });
    },

    syncTime: () => {
      const currentTime = audio.getCurrentTime();
      const duration = audio.getDuration();
      const progress = duration > 0 ? currentTime / duration : 0;
      set({ currentTime, duration, progress });
    },
  };
});
