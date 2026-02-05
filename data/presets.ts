import { SynthParams, WaveformType } from '../types';

export interface SoundPreset {
  id: string;
  name: string;
  description: string;
  params: SynthParams;
}

export const SOUND_PRESETS: SoundPreset[] = [
  {
    id: 'preset-laser-classic',
    name: 'Classic Laser',
    description: 'A retro sci-fi laser blast',
    params: {
      waveform: WaveformType.SAWTOOTH,
      frequencyStart: 1800,
      frequencyEnd: 200,
      duration: 0.15,
      attack: 0,
      decay: 0.1,
      sustain: 0.1,
      release: 0.05,
      volume: 0.6,
      filterType: 'lowpass',
      filterFreq: 4000,
      qFactor: 1,
      distortion: 0.1,
      delayTime: 0,
      delayFeedback: 0,
      reverb: 0.1
    }
  },
  {
    id: 'preset-jump-8bit',
    name: '8-Bit Jump',
    description: 'Classic platformer jump sound',
    params: {
      waveform: WaveformType.SQUARE,
      frequencyStart: 150,
      frequencyEnd: 800,
      duration: 0.2,
      attack: 0.01,
      decay: 0.15,
      sustain: 0,
      release: 0.05,
      volume: 0.5,
      filterType: 'lowpass',
      filterFreq: 2000,
      qFactor: 1,
      distortion: 0,
      delayTime: 0,
      delayFeedback: 0,
      reverb: 0
    }
  },
  {
    id: 'preset-explosion-heavy',
    name: 'Heavy Explosion',
    description: 'Deep, noisy explosion',
    params: {
      waveform: WaveformType.NOISE,
      frequencyStart: 100,
      frequencyEnd: 40,
      duration: 1.2,
      attack: 0.02,
      decay: 0.8,
      sustain: 0.1,
      release: 0.4,
      volume: 0.8,
      filterType: 'lowpass',
      filterFreq: 350,
      qFactor: 4,
      distortion: 0.8,
      delayTime: 0,
      delayFeedback: 0,
      reverb: 0.4
    }
  },
  {
    id: 'preset-cyber-echo',
    name: 'Cyber Echo',
    description: 'Glitchy tech notification',
    params: {
      waveform: WaveformType.TRIANGLE,
      frequencyStart: 2000,
      frequencyEnd: 1500,
      duration: 0.1,
      attack: 0,
      decay: 0.05,
      sustain: 0.1,
      release: 0.1,
      volume: 0.5,
      filterType: 'highpass',
      filterFreq: 1200,
      qFactor: 2,
      distortion: 0.4,
      delayTime: 0.25,
      delayFeedback: 0.5,
      reverb: 0.2
    }
  },
  {
    id: 'preset-cave-drip',
    name: 'Cave Drip',
    description: 'Atmospheric droplet with reverb',
    params: {
      waveform: WaveformType.SINE,
      frequencyStart: 1200,
      frequencyEnd: 1000,
      duration: 0.05,
      attack: 0.005,
      decay: 0.03,
      sustain: 0,
      release: 0.02,
      volume: 0.4,
      filterType: 'lowpass',
      filterFreq: 3000,
      qFactor: 1,
      distortion: 0,
      delayTime: 0,
      delayFeedback: 0,
      reverb: 0.9
    }
  }
];