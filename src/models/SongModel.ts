import { Song } from '../types';

export class SongModel implements Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  fileUrl: string;
  coverUrl: string;

  constructor(data: Song) {
    this.id = data.id;
    this.title = data.title;
    this.artist = data.artist;
    this.album = data.album;
    this.duration = data.duration;
    this.fileUrl = data.fileUrl;
    this.coverUrl = data.coverUrl;
  }
}
