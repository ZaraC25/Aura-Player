import { Song } from '../types';

interface ExportedSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl: string;
}

interface PlaylistExport {
  version: 1;
  exportedAt: string;
  songs: ExportedSong[];
}

export function exportToJson(songs: Song[]): void {
  const payload: PlaylistExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    songs: songs.map(({ id, title, artist, album, duration, coverUrl }) => ({
      id,
      title,
      artist,
      album,
      duration,
      coverUrl,
    })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `playlist-${Date.now()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function importFromJson(jsonString: string): Song[] {
  const parsed: unknown = JSON.parse(jsonString);

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('songs' in parsed) ||
    !Array.isArray((parsed as PlaylistExport).songs)
  ) {
    throw new Error('Invalid playlist file format');
  }

  const { songs } = parsed as PlaylistExport;

  return songs.map((s) => ({
    id: typeof s.id === 'string' && s.id.length > 0 ? s.id : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: typeof s.title === 'string' ? s.title : 'Untitled',
    artist: typeof s.artist === 'string' ? s.artist : 'Unknown Artist',
    album: typeof s.album === 'string' ? s.album : 'Unknown Album',
    duration: typeof s.duration === 'number' ? s.duration : 0,
    fileUrl: '',
    coverUrl: typeof s.coverUrl === 'string' ? s.coverUrl : '',
  }));
}
