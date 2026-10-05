export interface EqualizerBand {
  frequency: number;
  gain: number;
}

export type EqualizerPresetName = 'flat' | 'bassBoost' | 'pop' | 'rock' | 'vocal';

export interface EqualizerPreset {
  name: EqualizerPresetName;
  label: string;
  gains: number[];
}