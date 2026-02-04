import { SynthParams, WaveformType } from '../types';

// Singleton context (lazy initialized)
let audioCtx: AudioContext | null = null;

export const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx!;
};

export const generateSoundBuffer = async (params: SynthParams): Promise<AudioBuffer> => {
  const ctx = getAudioContext();
  const sampleRate = ctx.sampleRate;
  
  // Calculate total duration including release
  const totalDuration = params.duration + params.release;
  const frameCount = sampleRate * totalDuration;
  
  // Create an offline context to render the sound as fast as possible (faster than real-time)
  const offlineCtx = new OfflineAudioContext(1, frameCount, sampleRate);
  
  // Master Gain for Envelope
  const masterGain = offlineCtx.createGain();
  masterGain.connect(offlineCtx.destination);
  
  // Filter
  const filter = offlineCtx.createBiquadFilter();
  filter.type = params.filterType as BiquadFilterType;
  filter.frequency.value = params.filterFreq;
  filter.Q.value = params.qFactor;
  filter.connect(masterGain);

  let source: AudioScheduledSourceNode;

  if (params.waveform === WaveformType.NOISE) {
    // Generate Noise Buffer
    const bufferSize = sampleRate * totalDuration;
    const buffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noiseSource = offlineCtx.createBufferSource();
    noiseSource.buffer = buffer;
    source = noiseSource;
    source.connect(filter);
  } else {
    // Standard Oscillator
    const osc = offlineCtx.createOscillator();
    osc.type = params.waveform;
    
    // Frequency Slide (Ramp)
    osc.frequency.setValueAtTime(params.frequencyStart, 0);
    // Exponential ramp sounds more natural for slides, linear for subtle shifts
    // Prevent 0Hz error for exponential ramp
    const endFreq = Math.max(0.001, params.frequencyEnd);
    if (Math.abs(params.frequencyStart - endFreq) > 10) {
       osc.frequency.exponentialRampToValueAtTime(endFreq, params.duration);
    } else {
       osc.frequency.setValueAtTime(endFreq, 0);
    }

    source = osc;
    source.connect(filter);
  }

  // Envelope (ADSR)
  // Attack
  masterGain.gain.setValueAtTime(0, 0);
  masterGain.gain.linearRampToValueAtTime(params.volume, params.attack);
  // Decay
  masterGain.gain.linearRampToValueAtTime(params.sustain * params.volume, params.attack + params.decay);
  // Sustain (held until duration)
  masterGain.gain.setValueAtTime(params.sustain * params.volume, params.duration);
  // Release
  masterGain.gain.linearRampToValueAtTime(0, totalDuration);

  source.start(0);
  source.stop(totalDuration);

  // Render
  return await offlineCtx.startRendering();
};

// Playback Helper
export const playBuffer = (buffer: AudioBuffer, onEnded?: () => void): { source: AudioBufferSourceNode, analyser: AnalyserNode } => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
      ctx.resume();
  }
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  
  source.connect(analyser);
  analyser.connect(ctx.destination);
  
  source.onended = () => {
    if (onEnded) onEnded();
  };
  
  source.start();
  return { source, analyser };
};
