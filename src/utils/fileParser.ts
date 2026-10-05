import { Track } from '../types/track';

export const parseAudioFile = (file: File): Promise<Track> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);

    audio.onloadedmetadata = () => {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const parts = fileNameWithoutExt.split(" - ");

      let artist = "Unknown Artist";
      let title = fileNameWithoutExt;

      if (parts.length > 1) {
        artist = parts[0].trim();
        title = parts.slice(1).join(" - ").trim();
      }

      resolve({
        id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title,
        artist,
        album: "Local Import",
        duration: audio.duration || 0,
        url,
        file
      });
    };

    audio.onerror = () => {
      resolve({
        id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: file.name,
        artist: "Unknown Artist",
        album: "Local Import",
        duration: 0,
        url,
        file
      });
    };
  });
};