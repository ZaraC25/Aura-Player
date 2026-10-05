type PresetName = 'Flat' | 'Pop' | 'Rock' | 'Bass Boost';

const EQ_FREQUENCIES: readonly number[] = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

const EQ_PRESETS: Record<PresetName, readonly number[]> = {
  Flat:       [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
  Pop:        [-1,  2,  4,  5,  3, -1, -2, -2, -1, -1],
  Rock:       [ 5,  3, -1, -3,  1,  3,  5,  6,  6,  6],
  'Bass Boost':[ 7,  6,  5,  3,  1,  0,  0,  0,  0,  0],
};

export class AudioController {
  private static instance: AudioController;

  private readonly audioElement: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private filters: BiquadFilterNode[] = [];

  private constructor() {
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
  }

  static getInstance(): AudioController {
    if (!AudioController.instance) {
      AudioController.instance = new AudioController();
    }
    return AudioController.instance;
  }

  private initContext(): void {
    if (this.audioContext !== null) return;

    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    this.audioContext = new Ctx();

    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.8;

    this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);

    this.filters = EQ_FREQUENCIES.map((freq, index) => {
      const filter = this.audioContext!.createBiquadFilter();

      if (index === 0) {
        filter.type = 'lowshelf';
      } else if (index === EQ_FREQUENCIES.length - 1) {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
        filter.Q.value = 1.4;
      }

      filter.frequency.value = freq;
      filter.gain.value = 0;
      return filter;
    });

    let node: AudioNode = this.sourceNode;
    for (const filter of this.filters) {
      node.connect(filter);
      node = filter;
    }
    node.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);
  }

  private async resumeContext(): Promise<void> {
    if (this.audioContext !== null && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  load(url: string): void {
    this.initContext();
    this.audioElement.src = url;
    this.audioElement.load();
  }

  async play(): Promise<void> {
    this.initContext();
    await this.resumeContext();
    await this.audioElement.play();
  }

  pause(): void {
    this.audioElement.pause();
  }

  stop(): void {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
  }

  seek(time: number): void {
    if (Number.isFinite(time) && time >= 0) {
      this.audioElement.currentTime = time;
    }
  }

  setVolume(volume: number): void {
    this.audioElement.volume = Math.min(1, Math.max(0, volume));
  }

  getAnalyser(): AnalyserNode {
    this.initContext();
    return this.analyserNode!;
  }

  setEqualizerBand(index: number, value: number): void {
    if (index < 0 || index >= this.filters.length) return;
    this.filters[index].gain.value = value;
  }

  applyPreset(preset: string): void {
    const gains = EQ_PRESETS[preset as PresetName];
    if (gains === undefined) return;
    gains.forEach((gain, index) => {
      this.setEqualizerBand(index, gain);
    });
  }

  getCurrentTime(): number {
    return this.audioElement.currentTime;
  }

  getDuration(): number {
    return this.audioElement.duration || 0;
  }

  onTimeUpdate(callback: () => void): void {
    this.audioElement.addEventListener('timeupdate', callback);
  }

  onEnded(callback: () => void): void {
    this.audioElement.addEventListener('ended', callback);
  }
}
