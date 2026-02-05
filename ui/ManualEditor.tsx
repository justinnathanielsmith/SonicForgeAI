import React from 'react';
import { SynthParams, WaveformType } from '../types';
import { Info, Activity, Wind, Zap, Layers, Volume2, Repeat, Settings2, Dices } from 'lucide-react';

interface ManualEditorProps {
  params: SynthParams;
  onChange: (params: SynthParams) => void;
}

const ManualEditor: React.FC<ManualEditorProps> = ({ params, onChange }) => {
  const handleChange = (key: keyof SynthParams, value: any) => {
    onChange({ ...params, [key]: value });
  };

  const handleRandomize = () => {
    const waveforms = Object.values(WaveformType);
    const filterTypes: Array<'lowpass' | 'highpass' | 'bandpass' | 'allpass'> = ['lowpass', 'highpass', 'bandpass', 'allpass'];
    
    const randomized: SynthParams = {
      waveform: waveforms[Math.floor(Math.random() * waveforms.length)],
      frequencyStart: 40 + Math.random() * 2500,
      frequencyEnd: 20 + Math.random() * 3000,
      duration: 0.1 + Math.random() * 1.2,
      attack: Math.random() * 0.25,
      decay: Math.random() * 0.4,
      sustain: Math.random(),
      release: Math.random() * 0.6,
      volume: 0.5 + Math.random() * 0.3,
      filterType: filterTypes[Math.floor(Math.random() * filterTypes.length)],
      filterFreq: 100 + Math.random() * 6000,
      qFactor: 0.5 + Math.random() * 12,
      filterModLfoRate: Math.random() * 14,
      filterModLfoDepth: Math.random() < 0.3 ? 0 : Math.random() * 2500,
      filterModEnvDepth: Math.random() < 0.3 ? 0 : Math.random() * 3500,
      distortion: Math.random() < 0.4 ? 0 : Math.random() * 0.7,
      delayTime: Math.random() < 0.7 ? 0 : 0.1 + Math.random() * 0.4,
      delayFeedback: Math.random() * 0.6,
      reverb: Math.random() < 0.6 ? 0 : Math.random() * 0.5,
      pulseWidth: 0.1 + Math.random() * 0.8,
      harmonics: Array.from({ length: 8 }, () => Math.random() ** 2) // Weighted towards lower amplitudes for cleaner sound
    };
    
    onChange(randomized);
  };

  const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-1 align-middle">
      <Info className="w-3 h-3 text-zinc-600 cursor-help" />
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-3 w-64 -translate-x-1/2 bg-black border border-zinc-700 p-3 text-[9px] text-zinc-100 opacity-0 transition-opacity group-hover:opacity-100 z-50 uppercase tracking-widest leading-relaxed shadow-[8px_8px_0px_#000]">
        <div className="border-b border-zinc-800 pb-1 mb-2 font-bold text-[#00e5ff]">PARAMETER_INTEL</div>
        {text}
        <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-black"></div>
      </div>
    </div>
  );

  const ControlGroup = ({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="bg-[#1f1f23] p-4 border-l-4 border-[#00e5ff] relative flex flex-col gap-4">
      <div className="absolute -top-2 left-4 bg-[#00e5ff] text-black text-[8px] px-2 py-0.5 font-bold uppercase tracking-widest flex items-center gap-1 shadow-[2px_2px_0px_0px_#000]">
        {icon}
        {label}
      </div>
      <div className="space-y-4 pt-2">{children}</div>
    </div>
  );

  const Slider = ({ label, value, min, max, step, tooltip, onChange: onValChange }: any) => (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono text-zinc-400 uppercase">
        <span>
          {label}
          <Tooltip text={tooltip} />
        </span>
        <span className="text-[#00e5ff]">{typeof value === 'number' ? value.toFixed(2) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onValChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );

  const AdsrVisual = ({ a, d, s, r }: { a: number, d: number, s: number, r: number }) => {
    const total = (a + d + r + 1) || 1; 
    const aw = (a / total) * 100;
    const dw = (d / total) * 100;
    const rw = (r / total) * 100;
    const sw = (1 / total) * 100;
    const sh = s * 100;

    return (
      <div className="h-10 w-full bg-black border border-zinc-800 relative mt-2 mb-2 overflow-hidden">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <path
            d={`M 0 100 L ${aw} 0 L ${aw + dw} ${100 - sh} L ${aw + dw + sw} ${100 - sh} L 100 100`}
            fill="none"
            stroke="#00ff66"
            strokeWidth="4"
          />
        </svg>
        <div className="absolute inset-0 flex justify-between px-1 opacity-20 pointer-events-none items-end pb-1">
           <span className="text-[6px] text-white">A</span>
           <span className="text-[6px] text-white">D</span>
           <span className="text-[6px] text-white">S</span>
           <span className="text-[6px] text-white">R</span>
        </div>
      </div>
    );
  };

  const WaveformIcon = ({ type }: { type: WaveformType }) => {
    const iconProps = { className: "w-4 h-4 text-[#00e5ff]" };
    switch (type) {
      case WaveformType.SINE: return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...iconProps}><path d="M2 12c4-8 8-8 12 0s8 8 12 0" /></svg>;
      case WaveformType.SQUARE: return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...iconProps}><path d="M2 16h4V8h8v8h4V8h4" /></svg>;
      case WaveformType.SAWTOOTH: return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...iconProps}><path d="M2 16l8-8v8l8-8v8l4-4" /></svg>;
      case WaveformType.TRIANGLE: return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...iconProps}><path d="M2 16l5-8 5 8 5-8 5 8" /></svg>;
      case WaveformType.NOISE: return <Activity {...iconProps} />;
      case WaveformType.PULSE: return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...iconProps}><path d="M2 16h3V8h6v8h3V8h8v8" /></svg>;
      case WaveformType.CUSTOM: return <Settings2 {...iconProps} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#0a0a0c] p-3 border-2 border-[#2a2a32] shadow-[2px_2px_0px_#000]">
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Settings2 className="w-3 h-3 text-[#00e5ff]" /> PARAMETER_ARRAY
        </div>
        <button 
          onClick={handleRandomize}
          className="bg-zinc-800 hover:bg-[#00ff66] text-zinc-400 hover:text-black px-4 py-1 text-[9px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 border-2 border-black active:translate-x-[1px] active:translate-y-[1px]"
        >
          <Dices className="w-3 h-3" /> RANDOMIZE_DATA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-2 border-[#2a2a32] bg-[#141418] shadow-[4px_4px_0px_0px_#000]">
        <ControlGroup label="OSCILLATOR" icon={<Zap className="w-2 h-2" />}>
          <div className="space-y-1">
            <div className="text-[10px] text-zinc-500 uppercase flex items-center justify-between">
              <span>WAVE_TYPE</span>
              <WaveformIcon type={params.waveform} />
            </div>
            <select
              value={params.waveform}
              onChange={(e) => handleChange('waveform', e.target.value)}
              className="w-full bg-[#0a0a0c] border-2 border-[#2a2a32] text-[10px] text-[#00e5ff] p-2 uppercase outline-none focus:border-[#00e5ff] font-mono cursor-pointer"
            >
              {Object.values(WaveformType).map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          
          {params.waveform === WaveformType.PULSE && (
            <Slider 
              label="PULSE_WIDTH" 
              value={params.pulseWidth || 0.5} 
              min={0.01} max={0.99} step={0.01} 
              tooltip="Ratio of pulse duration to cycle duration. 0.5 is a square wave. Lower/higher values create thinner, reedy timbres common in NES/GameBoy music."
              onChange={(v: number) => handleChange('pulseWidth', v)} 
            />
          )}

          {params.waveform === WaveformType.CUSTOM && (
            <div className="space-y-4">
              <div className="text-[9px] text-zinc-600 uppercase font-mono tracking-tighter">Harmonic Synthesis (8-stage) <Tooltip text="Additive synthesis. Each slider controls the volume of an overtone. 1 is the fundamental pitch, 2 is double the freq, etc. Creates metallic or bell-like textures." /></div>
              <div className="flex gap-1 h-12 items-end">
                {(params.harmonics || [1,0,0,0,0,0,0,0]).slice(0, 8).map((h, i) => (
                  <div key={i} className="flex-1 bg-zinc-900 group relative cursor-pointer" style={{height: `${h * 100}%`}}>
                    <input 
                      type="range" 
                      min="0" max="1" step="0.01" 
                      value={h}
                      className="absolute inset-0 opacity-0 cursor-ns-resize"
                      onChange={(e) => {
                        const newHarmonics = [...(params.harmonics || [1,0,0,0,0,0,0,0])];
                        newHarmonics[i] = parseFloat(e.target.value);
                        handleChange('harmonics', newHarmonics);
                      }}
                    />
                    <div className={`w-full h-full bg-[#00ff66] opacity-40 group-hover:opacity-100 transition-opacity`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <Slider 
            label="F_START" 
            value={params.frequencyStart} 
            min={20} max={5000} step={1} 
            tooltip="Initial frequency in Hz. Use low (50-200) for bass/kicks, mid (400-1000) for tones, and high (2000+) for whistles or sharp glass impacts."
            onChange={(v: number) => handleChange('frequencyStart', v)} 
          />
          <Slider 
            label="F_END" 
            value={params.frequencyEnd} 
            min={20} max={5000} step={1} 
            tooltip="Final frequency. If different from F_START, the pitch will slide over the duration. Falling pitch (high start, low end) is perfect for lasers and impacts."
            onChange={(v: number) => handleChange('frequencyEnd', v)} 
          />
        </ControlGroup>

        <ControlGroup label="ENVELOPE" icon={<Layers className="w-2 h-2" />}>
          <AdsrVisual a={params.attack} d={params.decay} s={params.sustain} r={params.release} />
          <div className="grid grid-cols-2 gap-4">
            <Slider 
              label="ATTACK" 
              value={params.attack} 
              min={0} max={1} step={0.01} 
              tooltip="Time to reach peak volume. 0s for sharp clicks, hits, or percussion. >0.1s for soft swells, ambient textures, or pads."
              onChange={(v: number) => handleChange('attack', v)} 
            />
            <Slider 
              label="DECAY" 
              value={params.decay} 
              min={0} max={1} step={0.01} 
              tooltip="Time to fall from peak to sustain level. Short decay creates punchy, plucky transients."
              onChange={(v: number) => handleChange('decay', v)} 
            />
            <Slider 
              label="SUSTAIN" 
              value={params.sustain} 
              min={0} max={1} step={0.01} 
              tooltip="Volume level held while the duration is active. 0 for percussive hits; 1 for constant level tones."
              onChange={(v: number) => handleChange('sustain', v)} 
            />
            <Slider 
              label="RELEASE" 
              value={params.release} 
              min={0} max={2} step={0.01} 
              tooltip="Time to fade out after the duration ends. High release creates airy tails or ghostly echoes."
              onChange={(v: number) => handleChange('release', v)} 
            />
          </div>
        </ControlGroup>

        <ControlGroup label="MODULATION" icon={<Repeat className="w-2 h-2" />}>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="text-[9px] text-[#00e5ff] font-bold uppercase tracking-widest opacity-80 border-b border-zinc-800 pb-1">LFO_UNIT</div>
              <Slider 
                label="LFO_RATE" 
                value={params.filterModLfoRate} 
                min={0} max={20} step={0.1} 
                tooltip="Frequency of the Low Frequency Oscillator. 3-8Hz creates a natural-sounding vibrato or tremolo."
                onChange={(v: number) => handleChange('filterModLfoRate', v)} 
              />
              <Slider 
                label="LFO_DEPTH" 
                value={params.filterModLfoDepth} 
                min={0} max={5000} step={1} 
                tooltip="How much the LFO sweeps the filter cutoff. High depth creates rhythmic 'wah-wah' or 'dubstep' wobbles."
                onChange={(v: number) => handleChange('filterModLfoDepth', v)} 
              />
            </div>
            
            <div className="space-y-3">
              <div className="text-[9px] text-[#00e5ff] font-bold uppercase tracking-widest opacity-80 border-b border-zinc-800 pb-1">ENVELOPE_FOLLOW</div>
              <Slider 
                label="ENV_DEPTH" 
                value={params.filterModEnvDepth} 
                min={0} max={5000} step={1} 
                tooltip="How much the volume envelope moves the filter cutoff. Essential for 'squelchy' synth basics or 'snappy' transients."
                onChange={(v: number) => handleChange('filterModEnvDepth', v)} 
              />
            </div>
          </div>
        </ControlGroup>

        <ControlGroup label="FILTER" icon={<Volume2 className="w-2 h-2" />}>
          <div className="space-y-1">
            <div className="text-[10px] text-zinc-500 uppercase">FILT_TYPE <Tooltip text="Lowpass: Cuts highs (muffled). Highpass: Cuts lows (thin). Bandpass: Keeps a narrow range (nasal/telephone). Allpass: Phase shift only." /></div>
            <select
              value={params.filterType}
              onChange={(e) => handleChange('filterType', e.target.value)}
              className="w-full bg-[#0a0a0c] border-2 border-[#2a2a32] text-[10px] text-[#00e5ff] p-2 uppercase outline-none focus:border-[#00e5ff] font-mono cursor-pointer"
            >
              <option value="lowpass">lowpass</option>
              <option value="highpass">highpass</option>
              <option value="bandpass">bandpass</option>
              <option value="allpass">allpass</option>
            </select>
          </div>
          <Slider 
            label="CUTOFF" 
            value={params.filterFreq} 
            min={20} max={10000} step={1} 
            tooltip="The frequency where the filter begins its cut. Lower values make sounds darker and softer."
            onChange={(v: number) => handleChange('filterFreq', v)} 
          />
          <Slider 
            label="RES" 
            value={params.qFactor} 
            min={0.1} max={20} step={0.1} 
            tooltip="Resonance boost at the cutoff. High values add a whistling, metallic, or 'liquid' ringing effect."
            onChange={(v: number) => handleChange('qFactor', v)} 
          />
        </ControlGroup>

        <div className="md:col-span-2">
          <ControlGroup label="FX_UNIT" icon={<Wind className="w-2 h-2" />}>
            <Slider 
              label="DRIVE" 
              value={params.distortion} 
              min={0} max={1} step={0.01} 
              tooltip="Saturation and clipping. Adds grit, harmonic richness, and 'weight'. Essential for powerful explosions or aggressive leads."
              onChange={(v: number) => handleChange('distortion', v)} 
            />
            <div className="grid grid-cols-3 gap-4">
              <Slider 
                label="D_TIME" 
                value={params.delayTime} 
                min={0} max={1} step={0.01} 
                tooltip="Gap between echoes. 0.05-0.15s for slapback; 0.3-0.6s for rhythmic cavernous echoes."
                onChange={(v: number) => handleChange('delayTime', v)} 
              />
              <Slider 
                label="D_FEED" 
                value={params.delayFeedback} 
                min={0} max={0.9} step={0.01} 
                tooltip="The number of echo repetitions. 0 is a single echo; 0.9 is near-infinite feedback."
                onChange={(v: number) => handleChange('delayFeedback', v)} 
              />
              <Slider 
                label="VERB" 
                value={params.reverb} 
                min={0} max={1} step={0.01} 
                tooltip="Wetness of the algorithmic reverb. Adds space, depth, and scale to a sound."
                onChange={(v: number) => handleChange('reverb', v)} 
              />
            </div>
          </ControlGroup>
        </div>
      </div>
    </div>
  );
};

export default ManualEditor;