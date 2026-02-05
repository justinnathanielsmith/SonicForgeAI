import React from 'react';
import { SynthParams, WaveformType } from '../types';
import { Info, Activity, Wind, Zap, Layers, Volume2 } from 'lucide-react';

interface ManualEditorProps {
  params: SynthParams;
  onChange: (params: SynthParams) => void;
}

const ManualEditor: React.FC<ManualEditorProps> = ({ params, onChange }) => {
  const handleChange = (key: keyof SynthParams, value: any) => {
    onChange({ ...params, [key]: value });
  };

  const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-1 align-middle">
      <Info className="w-3 h-3 text-zinc-600 cursor-help" />
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 bg-black border border-zinc-700 p-2 text-[8px] text-white opacity-0 transition-opacity group-hover:opacity-100 z-50 uppercase tracking-widest leading-relaxed shadow-xl">
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
    // Total width 100%
    // A, D, R are relative to some max, S is height
    const total = (a + d + r + 1) || 1; // 1 for sustain length
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
      default: return null;
    }
  };

  return (
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
        <Slider 
          label="F_START" 
          value={params.frequencyStart} 
          min={20} max={5000} step={1} 
          tooltip="Initial pitch of the sound in Hertz."
          onChange={(v: number) => handleChange('frequencyStart', v)} 
        />
        <Slider 
          label="F_END" 
          value={params.frequencyEnd} 
          min={20} max={5000} step={1} 
          tooltip="Final pitch of the sound. Creates a slide effect if different from start."
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
            tooltip="Time for the sound to reach peak volume."
            onChange={(v: number) => handleChange('attack', v)} 
          />
          <Slider 
            label="DECAY" 
            value={params.decay} 
            min={0} max={1} step={0.01} 
            tooltip="Time to drop from peak to sustain level."
            onChange={(v: number) => handleChange('decay', v)} 
          />
          <Slider 
            label="SUSTAIN" 
            value={params.sustain} 
            min={0} max={1} step={0.01} 
            tooltip="Constant volume level while the note is held."
            onChange={(v: number) => handleChange('sustain', v)} 
          />
          <Slider 
            label="RELEASE" 
            value={params.release} 
            min={0} max={2} step={0.01} 
            tooltip="Time for sound to fade out after duration ends."
            onChange={(v: number) => handleChange('release', v)} 
          />
        </div>
      </ControlGroup>

      <ControlGroup label="FILTER" icon={<Volume2 className="w-2 h-2" />}>
        <div className="space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase">FILT_TYPE</div>
          <select
            value={params.filterType}
            onChange={(e) => handleChange('filterType', e.target.value)}
            className="w-full bg-[#0a0a0c] border-2 border-[#2a2a32] text-[10px] text-[#00e5ff] p-2 uppercase outline-none focus:border-[#00e5ff] font-mono cursor-pointer"
          >
            <option value="lowpass">lowpass</option>
            <option value="highpass">highpass</option>
            <option value="bandpass">bandpass</option>
          </select>
        </div>
        <Slider 
          label="CUTOFF" 
          value={params.filterFreq} 
          min={20} max={10000} step={1} 
          tooltip="Frequency at which the filter starts working."
          onChange={(v: number) => handleChange('filterFreq', v)} 
        />
        <Slider 
          label="RES" 
          value={params.qFactor} 
          min={0.1} max={20} step={0.1} 
          tooltip="Resonance boost at the cutoff frequency."
          onChange={(v: number) => handleChange('qFactor', v)} 
        />
      </ControlGroup>

      <ControlGroup label="FX_UNIT" icon={<Wind className="w-2 h-2" />}>
        <Slider 
          label="DRIVE" 
          value={params.distortion} 
          min={0} max={1} step={0.01} 
          tooltip="Adds grit and harmonics by clipping the signal."
          onChange={(v: number) => handleChange('distortion', v)} 
        />
        <div className="grid grid-cols-2 gap-4">
          <Slider 
            label="D_TIME" 
            value={params.delayTime} 
            min={0} max={1} step={0.01} 
            tooltip="Time between echo repetitions."
            onChange={(v: number) => handleChange('delayTime', v)} 
          />
          <Slider 
            label="D_FEED" 
            value={params.delayFeedback} 
            min={0} max={0.9} step={0.01} 
            tooltip="Amount of signal fed back for multiple echoes."
            onChange={(v: number) => handleChange('delayFeedback', v)} 
          />
        </div>
        <Slider 
          label="VERB" 
          value={params.reverb} 
          min={0} max={1} step={0.01} 
          tooltip="Simulates space and room size."
          onChange={(v: number) => handleChange('reverb', v)} 
        />
      </ControlGroup>
    </div>
  );
};

export default ManualEditor;