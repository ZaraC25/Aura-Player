export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  fileUrl: string;
  coverUrl: string;
}

export interface PlaylistState {
  songs: Song[];
  currentSongId: string | null;
  isPlaying: boolean;
  currentIndex: number;
}
