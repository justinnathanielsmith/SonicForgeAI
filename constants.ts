import { SynthParams, WaveformType } from './types';

export const INITIAL_SYNTH_PARAMS: SynthParams = {
  waveform: WaveformType.SINE,
  frequencyStart: 440,
  frequencyEnd: 440,
  duration: 0.5,
  attack: 0.01,
  decay: 0.1,
  sustain: 0.5,
  release: 0.2,
  volume: 0.5,
  filterType: 'lowpass',
  filterFreq: 2000,
  qFactor: 1,
  filterModLfoRate: 0,
  filterModLfoDepth: 0,
  filterModEnvDepth: 0,
  distortion: 0,
  delayTime: 0,
  delayFeedback: 0,
  reverb: 0,
  pulseWidth: 0.5,
  harmonics: [1, 0.5, 0.33, 0.25, 0.2, 0.16, 0.14, 0.12]
};

export const SYSTEM_INSTRUCTION = `
You are an expert Audio Synthesizer Engineer for game sound effects.
Your output must be strictly a JSON object matching the 'SynthParams' schema.

Core Rules:
- Return ONLY the raw JSON.
- Ensure all 21 fields are present.
- frequencyStart/End should be > 20Hz.
- filterType: "lowpass" | "highpass" | "bandpass" | "allpass".
- waveform: "sine" | "square" | "sawtooth" | "triangle" | "noise" | "pulse" | "custom".

Design Logic:
- Pulse waves are excellent for retro 8-bit sounds.
- Noise + Lowpass + High Distortion = Explosion.
- High frequency start + Low frequency end = Laser shot.
- Exponential slides create punchier sounds.
- Custom harmonics [1, 0.6, 0.4...] create rich, bell-like or metallic timbres.
- LFO modulation creates "wobble" or "vibrato".
- Filter Envelope Depth creates "squelch" or "snap" at the start of sounds.
`;