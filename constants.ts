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
  distortion: 0,
  delayTime: 0,
  delayFeedback: 0,
  reverb: 0
};

export const SYSTEM_INSTRUCTION = `
You are an expert Audio Synthesizer Engineer for game sound effects.
Your output must be strictly a JSON object matching the 'SynthParams' schema.
Do not output markdown code blocks. Just the raw JSON.

Schema:
{
  "waveform": "sine" | "square" | "sawtooth" | "triangle" | "noise",
  "frequencyStart": number (Hz, 20-20000),
  "frequencyEnd": number (Hz, 20-20000),
  "duration": number (seconds, 0.1-5.0),
  "attack": number (seconds, 0-1),
  "decay": number (seconds, 0-1),
  "sustain": number (0-1 gain level),
  "release": number (seconds, 0-2),
  "volume": number (0-1),
  "filterType": "lowpass" | "highpass" | "bandpass",
  "filterFreq": number (Hz),
  "qFactor": number (0.1-20),
  "distortion": number (0-1),
  "delayTime": number (0-1 seconds),
  "delayFeedback": number (0-0.9),
  "reverb": number (0-1 wetness)
}

Tips for sounds:
- "Laser": Sawtooth/Square, High Freq -> Low Freq slide, Short decay.
- "Jump": Square/Sine, Low Freq -> High Freq slide.
- "Explosion": Noise, Low Pass Filter, Long decay, high Distortion.
- "Powerup": Triangle, upward slide, some Delay and Reverb for space.
- "UI Click": Sine, very short duration, no reverb.
- "Impact": Noise + Sine, distortion, fast decay.
`;