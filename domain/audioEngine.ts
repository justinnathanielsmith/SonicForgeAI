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
  
  // Calculate total duration including release and potential delay tails
  const tailDuration = params.delayTime > 0 ? params.delayTime * 5 : 0;
  const totalDuration = Math.max(0.1, params.duration + params.release + tailDuration + (params.reverb > 0 ? 2 : 0));
  const frameCount = sampleRate * totalDuration;
  
  const offlineCtx = new OfflineAudioContext(1, Math.ceil(frameCount), sampleRate);
  
  // Chain: Source -> Filter -> Distortion -> Delay -> Reverb -> MasterGain -> Destination

  const masterGain = offlineCtx.createGain();
  masterGain.connect(offlineCtx.destination);

  let currentLink: AudioNode = masterGain;

  // Reverb
  if (params.reverb > 0) {
    const reverbNode = offlineCtx.createConvolver();
    reverbNode.buffer = createImpulseResponse(offlineCtx, 2.5, 3);
    const reverbWet = offlineCtx.createGain();
    reverbWet.gain.value = params.reverb * 0.5;
    
    // Parallel reverb path
    reverbWet.connect(masterGain);
    reverbNode.connect(reverbWet);
    currentLink = reverbNode; 
    // We'll connect the previous stage to both masterGain (dry) and reverbNode (wet)
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
    delayWet.gain.value = 0.3; // subtle delay wetness
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
  filter.frequency.value = params.filterFreq || 2000;
  filter.Q.value = params.qFactor || 1;

  // Connection logic
  let sourceOut: AudioNode = filter;
  if (distortionNode) {
    filter.connect(distortionNode);
    sourceOut = distortionNode;
  }

  sourceOut.connect(masterGain); // Dry
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
  } else {
    const osc = offlineCtx.createOscillator();
    osc.type = (params.waveform || 'sine') as OscillatorType;
    
    osc.frequency.setValueAtTime(params.frequencyStart, 0);
    const endFreq = Math.max(0.001, params.frequencyEnd);
    if (Math.abs(params.frequencyStart - endFreq) > 1) {
       osc.frequency.exponentialRampToValueAtTime(endFreq, params.duration);
    } else {
       osc.frequency.setValueAtTime(endFreq, params.duration);
    }

    source = osc;
    source.connect(filter);
  }

  // Envelope (ADSR)
  const vol = params.volume ?? 0.5;
  const attack = Math.max(0, params.attack);
  const decay = Math.max(0, params.decay);
  const sustain = Math.max(0, params.sustain);
  const release = Math.max(0, params.release);

  masterGain.gain.setValueAtTime(0, 0);
  masterGain.gain.linearRampToValueAtTime(vol, attack);
  masterGain.gain.linearRampToValueAtTime(sustain * vol, attack + decay);
  masterGain.gain.setValueAtTime(sustain * vol, params.duration);
  masterGain.gain.linearRampToValueAtTime(0, params.duration + release);

  source.start(0);
  source.stop(params.duration + release);

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