import { SynthParams, WaveformType } from '../types';

// Singleton context (lazy initialized)
let audioCtx: AudioContext | null = null;

export const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx!;
};

const createDistortionCurve = (amount: number) => {
  const k = amount * 100;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
};

const createImpulseResponse = (context: BaseAudioContext, duration: number, decay: number) => {
  const sampleRate = context.sampleRate;
  const length = sampleRate * duration;
  const impulse = context.createBuffer(2, length, sampleRate);
  for (let i = 0; i < 2; i++) {
    const channelData = impulse.getChannelData(i);
    for (let j = 0; j < length; j++) {
      channelData[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, decay);
    }
  }
  return impulse;
};

export const generateSoundBuffer = async (params: SynthParams): Promise<AudioBuffer> => {
  const ctx = getAudioContext();
  const sampleRate = ctx.sampleRate;
  
  const tailDuration = params.delayTime > 0 ? params.delayTime * 5 : 0;
  const totalDuration = Math.max(0.1, params.duration + params.release + tailDuration + (params.reverb > 0 ? 2 : 0));
  const frameCount = sampleRate * totalDuration;
  
  const offlineCtx = new OfflineAudioContext(1, Math.ceil(frameCount), sampleRate);
  
  const masterGain = offlineCtx.createGain();
  masterGain.connect(offlineCtx.destination);

  let currentLink: AudioNode = masterGain;

  // Reverb
  if (params.reverb > 0) {
    const reverbNode = offlineCtx.createConvolver();
    reverbNode.buffer = createImpulseResponse(offlineCtx, 2.5, 3);
    const reverbWet = offlineCtx.createGain();
    reverbWet.gain.value = params.reverb * 0.5;
    
    reverbWet.connect(masterGain);
    reverbNode.connect(reverbWet);
    currentLink = reverbNode; 
  }

  // Delay
  let delayInput: AudioNode | null = null;
  if (params.delayTime > 0) {
    const delayNode = offlineCtx.createDelay(1.0);
    delayNode.delayTime.value = params.delayTime;
    const feedbackGain = offlineCtx.createGain();
    feedbackGain.gain.value = Math.min(0.9, params.delayFeedback);
    
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    
    const delayWet = offlineCtx.createGain();
    delayWet.gain.value = 0.3;
    delayNode.connect(delayWet);
    delayWet.connect(masterGain);

    delayInput = delayNode;
  }

  // Distortion
  let distortionNode: WaveShaperNode | null = null;
  if (params.distortion > 0) {
    distortionNode = offlineCtx.createWaveShaper();
    distortionNode.curve = createDistortionCurve(params.distortion);
    distortionNode.oversample = '4x';
  }

  // Filter
  const filter = offlineCtx.createBiquadFilter();
  filter.type = (params.filterType || 'lowpass') as BiquadFilterType;
  filter.frequency.setValueAtTime(params.filterFreq, 0);
  filter.Q.value = params.qFactor || 1;

  // Filter Modulation
  if (params.filterModLfoDepth > 0 && params.filterModLfoRate > 0) {
    const lfo = offlineCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(params.filterModLfoRate, 0);
    const lfoGain = offlineCtx.createGain();
    lfoGain.gain.setValueAtTime(params.filterModLfoDepth, 0);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(0);
    lfo.stop(totalDuration);
  }

  if (params.filterModEnvDepth > 0) {
    const attack = Math.max(0, params.attack);
    const decay = Math.max(0, params.decay);
    const sustain = Math.max(0, params.sustain);
    const startVal = params.filterFreq;
    const peakVal = Math.min(22000, startVal + params.filterModEnvDepth);
    const sustainVal = Math.min(22000, startVal + (params.filterModEnvDepth * sustain));

    filter.frequency.setValueAtTime(startVal, 0);
    filter.frequency.exponentialRampToValueAtTime(peakVal, attack || 0.001);
    filter.frequency.exponentialRampToValueAtTime(sustainVal, attack + decay || 0.002);
    filter.frequency.setValueAtTime(sustainVal, params.duration);
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, startVal), params.duration + params.release);
  }

  // Connection logic
  let sourceOut: AudioNode = filter;
  if (distortionNode) {
    filter.connect(distortionNode);
    sourceOut = distortionNode;
  }

  sourceOut.connect(masterGain);
  if (delayInput) sourceOut.connect(delayInput);
  if (params.reverb > 0) sourceOut.connect(currentLink);

  let source: AudioScheduledSourceNode;

  if (params.waveform === WaveformType.NOISE) {
    const bufferSize = Math.ceil(sampleRate * (params.duration + params.release));
    const buffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noiseSource = offlineCtx.createBufferSource();
    noiseSource.buffer = buffer;
    source = noiseSource;
    source.connect(filter);
  } else if (params.waveform === WaveformType.PULSE) {
    // Variable Pulse Wave simulated by two saw waves
    // pulse width is determined by phase offset
    const osc1 = offlineCtx.createOscillator();
    const osc2 = offlineCtx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    
    const inverter = offlineCtx.createGain();
    inverter.gain.value = -1;
    
    const pulseGain = offlineCtx.createGain();
    pulseGain.gain.value = 0.5; // Gain correction

    osc1.connect(pulseGain);
    osc2.connect(inverter);
    inverter.connect(pulseGain);
    pulseGain.connect(filter);

    const freqStart = params.frequencyStart;
    const freqEnd = params.frequencyEnd;
    
    osc1.frequency.setValueAtTime(freqStart, 0);
    osc2.frequency.setValueAtTime(freqStart, 0);
    
    if (Math.abs(freqStart - freqEnd) > 1) {
      osc1.frequency.exponentialRampToValueAtTime(freqEnd, params.duration);
      osc2.frequency.exponentialRampToValueAtTime(freqEnd, params.duration);
    } else {
      osc1.frequency.setValueAtTime(freqEnd, params.duration);
      osc2.frequency.setValueAtTime(freqEnd, params.duration);
    }

    // Set Pulse Width via constant phase offset
    // Web Audio doesn't have a built-in PWM easily, but we can delay one of the oscillators
    const delay = offlineCtx.createDelay(0.1);
    const period = 1 / freqStart;
    delay.delayTime.setValueAtTime(period * (params.pulseWidth || 0.5), 0);
    
    // In actual implementation for variable freq, we'd need more logic, 
    // but for simple pulses, this offset works.
    osc2.disconnect(inverter);
    osc2.connect(delay);
    delay.connect(inverter);

    source = osc1; // Primary trigger
    osc1.start(0);
    osc2.start(0);
    osc1.stop(params.duration + params.release);
    osc2.stop(params.duration + params.release);
  } else {
    const osc = offlineCtx.createOscillator();
    if (params.waveform === WaveformType.CUSTOM && params.harmonics && params.harmonics.length > 0) {
      const real = new Float32Array(params.harmonics.length + 1);
      const imag = new Float32Array(params.harmonics.length + 1);
      params.harmonics.forEach((amp, i) => {
        imag[i + 1] = amp; // Sine components
      });
      const wave = offlineCtx.createPeriodicWave(real, imag);
      osc.setPeriodicWave(wave);
    } else {
      osc.type = (params.waveform || 'sine') as OscillatorType;
    }
    
    osc.frequency.setValueAtTime(params.frequencyStart, 0);
    const endFreq = Math.max(0.001, params.frequencyEnd);
    if (Math.abs(params.frequencyStart - endFreq) > 1) {
       osc.frequency.exponentialRampToValueAtTime(endFreq, params.duration);
    } else {
       osc.frequency.setValueAtTime(endFreq, params.duration);
    }

    source = osc;
    source.connect(filter);
    source.start(0);
    source.stop(params.duration + params.release);
  }

  // Envelope (ADSR)
  const vol = params.volume ?? 0.5;
  const attack = Math.max(0, params.attack);
  const decay = Math.max(0, params.decay);
  const sustain = Math.max(0, params.sustain);
  const release = Math.max(0, params.release);

  masterGain.gain.setValueAtTime(0, 0);
  masterGain.gain.linearRampToValueAtTime(vol, attack || 0.001);
  masterGain.gain.linearRampToValueAtTime(sustain * vol, attack + decay || 0.002);
  masterGain.gain.setValueAtTime(sustain * vol, params.duration);
  masterGain.gain.linearRampToValueAtTime(0, params.duration + release);

  return await offlineCtx.startRendering();
};

export const playBuffer = (
  buffer: AudioBuffer, 
  volume: number = 0.7, 
  offset: number = 0,
  onEnded?: () => void
): { source: AudioBufferSourceNode, analyser: AnalyserNode, gainNode: GainNode } => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
      ctx.resume();
  }
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  
  const gainNode = ctx.createGain();
  gainNode.gain.value = volume;

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  
  source.connect(gainNode);
  gainNode.connect(analyser);
  analyser.connect(ctx.destination);
  
  source.onended = () => {
    if (onEnded) onEnded();
  };
  
  source.start(0, offset);
  
  return { source, analyser, gainNode };
};