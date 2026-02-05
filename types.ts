// Domain Entities

export enum WaveformType {
  SINE = 'sine',
  SQUARE = 'square',
  SAWTOOTH = 'sawtooth',
  TRIANGLE = 'triangle',
  NOISE = 'noise'
}

export interface SynthParams {
  waveform: WaveformType;
  frequencyStart: number;
  frequencyEnd: number;
  duration: number; // in seconds
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  volume: number; // 0-1
  filterType: 'lowpass' | 'highpass' | 'bandpass' | 'allpass';
  filterFreq: number;
  qFactor: number;
  // New Effects
  distortion: number; // 0-1
  delayTime: number; // 0-1
  delayFeedback: number; // 0-1
  reverb: number; // 0-1
}

export interface SoundEntity {
  id: string;
  name: string;
  description: string;
  params: SynthParams;
  timestamp: number;
  audioBuffer?: AudioBuffer; // Transient, not persisted usually, but kept for playback
  blobUrl?: string;
}

export interface SoundPreset {
  id: string;
  name: string;
  description: string;
  params: SynthParams;
}

// MVI / Architecture Types

export interface AppState {
  prompt: string;
  isGenerating: boolean;
  history: SoundEntity[];
  customPresets: SoundPreset[];
  selectedSoundId: string | null;
  isPlaying: boolean;
  error: string | null;
  analyzerData: Uint8Array | null;
}

export enum IntentType {
  UPDATE_PROMPT = 'UPDATE_PROMPT',
  GENERATE_SOUND = 'GENERATE_SOUND',
  GENERATION_SUCCESS = 'GENERATION_SUCCESS',
  GENERATION_FAILURE = 'GENERATION_FAILURE',
  SELECT_SOUND = 'SELECT_SOUND',
  PLAY_SOUND = 'PLAY_SOUND',
  STOP_SOUND = 'STOP_SOUND',
  UPDATE_ANALYZER = 'UPDATE_ANALYZER',
  DELETE_SOUND = 'DELETE_SOUND',
  LOAD_PRESET = 'LOAD_PRESET',
  SAVE_CUSTOM_PRESET = 'SAVE_CUSTOM_PRESET',
  DELETE_CUSTOM_PRESET = 'DELETE_CUSTOM_PRESET',
}

export type Action =
  | { type: IntentType.UPDATE_PROMPT; payload: string }
  | { type: IntentType.GENERATE_SOUND }
  | { type: IntentType.GENERATION_SUCCESS; payload: SoundEntity }
  | { type: IntentType.GENERATION_FAILURE; payload: string }
  | { type: IntentType.SELECT_SOUND; payload: string }
  | { type: IntentType.PLAY_SOUND; payload: string }
  | { type: IntentType.STOP_SOUND }
  | { type: IntentType.UPDATE_ANALYZER; payload: Uint8Array }
  | { type: IntentType.DELETE_SOUND; payload: string }
  | { type: IntentType.LOAD_PRESET; payload: SoundEntity }
  | { type: IntentType.SAVE_CUSTOM_PRESET; payload: SoundPreset }
  | { type: IntentType.DELETE_CUSTOM_PRESET; payload: string };