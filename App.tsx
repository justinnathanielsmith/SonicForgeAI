import React, { useReducer, useEffect, useRef, useState } from 'react';
import { 
  AppState, 
  Action, 
  IntentType, 
  SoundEntity,
  SoundPreset,
  SynthParams
} from './types';
import { generateSynthParams } from './data/geminiService';
import { generateSoundBuffer, playBuffer, getAudioContext } from './domain/audioEngine';
import { audioBufferToWav } from './domain/wavEncoder';
import { synthParamsToMidi } from './domain/midiEncoder';
import { loadHistory, saveHistory, loadCustomPresets, saveCustomPresets } from './data/storage';
import { SOUND_PRESETS } from './data/presets';
import { INITIAL_SYNTH_PARAMS } from './constants';
import Button from './ui/Button';
import Visualizer from './ui/Visualizer';
import MiniWaveform from './ui/MiniWaveform';
import ManualEditor from './ui/ManualEditor';
import { 
  Play, 
  Square, 
  Download, 
  Wand2, 
  History, 
  Trash2, 
  RefreshCw, 
  Sliders,
  Volume2,
  VolumeX,
  Zap,
  AudioWaveform,
  Save,
  Star,
  Cpu,
  Terminal,
  Settings,
  BrainCircuit,
  Binary,
  Music
} from 'lucide-react';

// --- INITIAL STATE ---
const initialState: AppState = {
  prompt: '',
  isGenerating: false,
  history: loadHistory(),
  customPresets: loadCustomPresets(),
  selectedSoundId: null,
  isPlaying: false,
  error: null,
  analyzerData: null,
};

// --- REDUCER ---
const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case IntentType.UPDATE_PROMPT:
      return { ...state, prompt: action.payload };
    case IntentType.GENERATE_SOUND:
      return { ...state, isGenerating: true, error: null };
    case IntentType.GENERATION_SUCCESS:
      return {
        ...state,
        isGenerating: false,
        history: [action.payload, ...state.history],
        selectedSoundId: action.payload.id,
      };
    case IntentType.LOAD_PRESET:
      return {
        ...state,
        history: [action.payload, ...state.history],
        selectedSoundId: action.payload.id,
      };
    case IntentType.GENERATION_FAILURE:
      return { ...state, isGenerating: false, error: action.payload };
    case IntentType.SELECT_SOUND:
      return { ...state, selectedSoundId: action.payload, error: null };
    case IntentType.PLAY_SOUND:
      return { ...state, isPlaying: true, selectedSoundId: action.payload };
    case IntentType.STOP_SOUND:
      return { ...state, isPlaying: false, analyzerData: null };
    case IntentType.UPDATE_ANALYZER:
      return { ...state, analyzerData: action.payload };
    case IntentType.DELETE_SOUND:
        return {
            ...state,
            history: state.history.filter(s => s.id !== action.payload),
            selectedSoundId: state.selectedSoundId === action.payload ? null : state.selectedSoundId
        };
    case IntentType.SAVE_CUSTOM_PRESET:
        return {
            ...state,
            customPresets: [action.payload, ...state.customPresets]
        };
    case IntentType.DELETE_CUSTOM_PRESET:
        return {
            ...state,
            customPresets: state.customPresets.filter(p => p.id !== action.payload)
        };
    default:
      return state;
  }
};

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [volume, setVolume] = useState(0.7);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualParams, setManualParams] = useState<SynthParams>(INITIAL_SYNTH_PARAMS);
  
  const animationRef = useRef<number>(0);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const activeGainRef = useRef<GainNode | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const playbackOffsetRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);

  useEffect(() => { saveHistory(state.history); }, [state.history]);
  useEffect(() => { saveCustomPresets(state.customPresets); }, [state.customPresets]);

  useEffect(() => {
    if (activeGainRef.current) {
      activeGainRef.current.gain.setTargetAtTime(volume, getAudioContext().currentTime, 0.05);
    }
  }, [volume]);

  const handleManualCompile = async () => {
    dispatch({ type: IntentType.GENERATE_SOUND });
    try {
      const buffer = await generateSoundBuffer(manualParams);
      const blob = audioBufferToWav(buffer);
      const blobUrl = URL.createObjectURL(blob);

      const newSound: SoundEntity = {
        id: crypto.randomUUID(),
        name: `SYNTH_${manualParams.waveform.toUpperCase().slice(0,3)}_${Date.now().toString().slice(-4)}`,
        description: 'MANUAL_CONSTRUCTION',
        params: { ...manualParams },
        timestamp: Date.now(),
        audioBuffer: buffer,
        blobUrl
      };
      dispatch({ type: IntentType.GENERATION_SUCCESS, payload: newSound });
      handlePlay(newSound);
    } catch (error: any) {
      dispatch({ type: IntentType.GENERATION_FAILURE, payload: 'COMPILE_ERROR' });
    }
  };

  const handleGenerate = async (remix: boolean = false) => {
    if (isManualMode && !remix) {
      handleManualCompile();
      return;
    }

    if (!state.prompt && !remix) return;
    dispatch({ type: IntentType.GENERATE_SOUND });
    try {
      let baseParams = undefined;
      if (remix && state.selectedSoundId) {
         const selected = state.history.find(s => s.id === state.selectedSoundId);
         if (selected) baseParams = selected.params;
      }
      const params = await generateSynthParams(state.prompt, baseParams);
      const buffer = await generateSoundBuffer(params);
      const blob = audioBufferToWav(buffer);
      const blobUrl = URL.createObjectURL(blob);

      const newSound: SoundEntity = {
        id: crypto.randomUUID(),
        name: remix ? `RM_ ${state.prompt.slice(0, 10).toUpperCase()}` : (state.prompt || 'CORE_SND'),
        description: state.prompt,
        params,
        timestamp: Date.now(),
        audioBuffer: buffer,
        blobUrl
      };
      dispatch({ type: IntentType.GENERATION_SUCCESS, payload: newSound });
      handlePlay(newSound);
    } catch (error: any) {
      dispatch({ type: IntentType.GENERATION_FAILURE, payload: 'COMPILE_FAILURE' });
    }
  };

  const handleLoadPreset = async (preset: { name: string, params: any }) => {
    try {
      const buffer = await generateSoundBuffer(preset.params);
      const blob = audioBufferToWav(buffer);
      const blobUrl = URL.createObjectURL(blob);

      const newSound: SoundEntity = {
        id: crypto.randomUUID(),
        name: preset.name.toUpperCase(),
        description: 'PRESET_LOAD',
        params: preset.params,
        timestamp: Date.now(),
        audioBuffer: buffer,
        blobUrl
      };

      dispatch({ type: IntentType.LOAD_PRESET, payload: newSound });
      handlePlay(newSound);
      if (isManualMode) setManualParams(preset.params);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveAsPreset = () => {
    const selected = state.history.find(s => s.id === state.selectedSoundId);
    if (!selected) return;
    const presetName = prompt("NAME PRESET:", selected.name);
    if (!presetName) return;
    const newPreset: SoundPreset = {
      id: crypto.randomUUID(),
      name: presetName.toUpperCase(),
      description: `USR_${selected.name}`,
      params: { ...selected.params }
    };
    dispatch({ type: IntentType.SAVE_CUSTOM_PRESET, payload: newPreset });
  };

  const handlePlay = (sound: SoundEntity, offset: number = 0) => {
    stopCurrentPlayback();
    getAudioContext().resume();
    if (!sound.audioBuffer) {
        generateSoundBuffer(sound.params).then(buffer => {
            sound.audioBuffer = buffer;
            sound.blobUrl = URL.createObjectURL(audioBufferToWav(buffer));
            startPlayback(sound, offset);
        });
    } else { startPlayback(sound, offset); }
  };

  const stopCurrentPlayback = () => {
    if (activeSourceRef.current) {
        activeSourceRef.current.onended = null;
        try { activeSourceRef.current.stop(); } catch(e){}
    }
    cancelAnimationFrame(animationRef.current);
    dispatch({ type: IntentType.STOP_SOUND });
  };

  const startPlayback = (sound: SoundEntity, offset: number) => {
    if (!sound.audioBuffer) return;
    dispatch({ type: IntentType.PLAY_SOUND, payload: sound.id });
    playbackOffsetRef.current = offset;
    playbackStartTimeRef.current = getAudioContext().currentTime;
    const { source, analyser, gainNode } = playBuffer(sound.audioBuffer, volume, offset, () => {
      if (!isSeekingRef.current) {
        dispatch({ type: IntentType.STOP_SOUND });
        setPlaybackTime(0);
        cancelAnimationFrame(animationRef.current);
      }
    });
    activeSourceRef.current = source;
    activeGainRef.current = gainNode;
    const updateUI = () => {
      const elapsed = getAudioContext().currentTime - playbackStartTimeRef.current + playbackOffsetRef.current;
      setPlaybackTime(elapsed);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(dataArray);
      dispatch({ type: IntentType.UPDATE_ANALYZER, payload: dataArray });
      animationRef.current = requestAnimationFrame(updateUI);
    };
    updateUI();
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOffset = parseFloat(e.target.value);
    setPlaybackTime(newOffset);
    if (selectedSound) {
      isSeekingRef.current = true;
      handlePlay(selectedSound, newOffset);
      isSeekingRef.current = false;
    }
  };

  const handleDownload = (sound: SoundEntity) => {
    if (!sound.blobUrl) return;
    const a = document.createElement('a');
    a.href = sound.blobUrl;
    a.download = `${sound.name.replace(/\s+/g, '_')}.wav`;
    a.click();
  };

  const handleMidiExport = (sound: SoundEntity) => {
    const blob = synthParamsToMidi(sound.params);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sound.name.replace(/\s+/g, '_')}_pattern.mid`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedSound = state.history.find(s => s.id === state.selectedSoundId);
  const duration = selectedSound?.audioBuffer?.duration || (selectedSound ? selectedSound.params.duration + selectedSound.params.release : 1);

  return (
    <div className="min-h-screen p-4 sm:p-10 max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141418] border-2 border-[#2a2a32] p-6 shadow-[4px_4px_0px_0px_#000]">
        <div className="flex items-center gap-4">
          <div className="bg-[#00ff66] p-4 border-2 border-black">
            <Binary className="text-black w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tighter uppercase leading-none text-[#f0f0f5]">SonicForge</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 font-bold uppercase tracking-widest border border-zinc-700">OS_v3.0.2</span>
              <div className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse"></div>
              <span className="text-[8px] font-mono text-zinc-500 uppercase">ENGINE_CONNECTED</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end font-mono">
          <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">GEMINI_THINK_CORE</div>
          <div className="text-[8px] text-zinc-600 mt-1">44.1KHZ // MIDI_ENABLED // PCM_MONO</div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <section className="lg:col-span-8 space-y-8">
          {/* Main Monitor */}
          <Visualizer data={state.analyzerData} isPlaying={state.isPlaying} />

          {/* Active Control Panel */}
          {selectedSound && (
            <div className="pixel-card p-6 border-[#00e5ff] border-l-[12px] bg-[#1a1a1e]">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-[#00e5ff] uppercase tracking-widest">
                    <span>SEEK_HEAD</span>
                    <span>{playbackTime.toFixed(2)}s / {duration.toFixed(2)}s</span>
                  </div>
                  <input type="range" min="0" max={duration} step="0.01" value={playbackTime} onChange={handleSeekChange} className="w-full" />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <Button 
                      onClick={() => state.isPlaying && state.selectedSoundId === selectedSound.id ? stopCurrentPlayback() : handlePlay(selectedSound)}
                      variant={state.isPlaying && state.selectedSoundId === selectedSound.id ? "accent" : "primary"}
                      icon={state.isPlaying && state.selectedSoundId === selectedSound.id ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      className="w-16 h-16 p-0 border-4 border-black"
                    />
                    <div>
                      <h2 className="text-xl font-bold uppercase tracking-tighter leading-tight text-[#f0f0f5]">{selectedSound.name}</h2>
                      <div className="flex gap-2 mt-1 font-mono">
                        <span className="text-[9px] text-[#00e5ff] bg-black px-2 py-0.5 border border-[#00e5ff]/30">{selectedSound.params.waveform.toUpperCase()}</span>
                        <span className="text-[9px] text-zinc-400 bg-black px-2 py-0.5 border border-zinc-800">{duration.toFixed(2)}S</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 bg-[#0a0a0c] p-3 border-2 border-zinc-800">
                      {volume === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-[#00e5ff]" />}
                      <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-24 h-2 accent-[#00e5ff]" />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="accent" onClick={() => handleDownload(selectedSound)} icon={<Download className="w-4 h-4" />}>WAV</Button>
                      <Button variant="secondary" onClick={() => handleMidiExport(selectedSound)} icon={<Music className="w-4 h-4" />} title="Export MIDI Sequence">MIDI</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Construction Unit */}
          <div className="pixel-card p-8 bg-[#141418] relative">
            <div className="absolute -top-3 left-8 bg-[#141418] border-2 border-[#2a2a32] px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f0f0f5]">
              SND_BUILDER
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                MODE: {isManualMode ? <span className="text-[#00e5ff]">MANUAL_CONSTRUCT</span> : <span className="text-[#00ff66]">AI_GENERATOR</span>}
              </div>
              <button 
                onClick={() => setIsManualMode(!isManualMode)}
                className={`px-3 py-1 border-2 text-[10px] font-bold uppercase transition-all ${isManualMode ? 'bg-[#00e5ff] text-black border-black shadow-[2px_2px_0px_#007785]' : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-white hover:border-zinc-500'}`}
              >
                TOGGLE_UNIT
              </button>
            </div>
            
            {!isManualMode ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <input 
                  type="text" 
                  value={state.prompt}
                  onChange={(e) => dispatch({ type: IntentType.UPDATE_PROMPT, payload: e.target.value })}
                  placeholder="DESCRIBE_TARGET_SOUND..."
                  className="flex-1 bg-black border-2 border-[#2a2a32] px-6 py-4 text-white focus:border-[#00ff66] outline-none placeholder-zinc-700 font-mono text-sm uppercase tracking-tighter"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate(false)}
                />
                <Button onClick={() => handleGenerate(false)} isLoading={state.isGenerating} icon={<Wand2 className="w-5 h-5" />} className="h-[60px] sm:w-40 border-4 border-black">GENERATE</Button>
              </div>
            ) : (
              <div className="space-y-6">
                <ManualEditor params={manualParams} onChange={setManualParams} />
                <div className="flex justify-end pt-4">
                  <Button onClick={handleManualCompile} isLoading={state.isGenerating} icon={<Cpu className="w-5 h-5" />} className="w-full sm:w-60 border-4 border-black" variant="primary">COMPILE_DATA</Button>
                </div>
              </div>
            )}

            {/* Presets Grid */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-3 h-3 text-[#00ff66]" /> CORE_PATCHES
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {SOUND_PRESETS.map(preset => (
                      <Button key={preset.id} variant="secondary" size="sm" onClick={() => handleLoadPreset(preset)}>{preset.name}</Button>
                    ))}
                 </div>
               </div>

               {state.customPresets.length > 0 && (
                 <div className="space-y-4">
                   <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                      <Star className="w-3 h-3 text-[#00e5ff]" /> USR_DATABASE
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {state.customPresets.map(preset => (
                        <div key={preset.id} className="group relative flex items-center">
                          <Button variant="secondary" size="sm" onClick={() => handleLoadPreset(preset)} className="pr-10 border-[#00e5ff]/30 text-[#00e5ff]">{preset.name}</Button>
                          <button onClick={() => dispatch({ type: IntentType.DELETE_CUSTOM_PRESET, payload: preset.id })} className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-600 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                   </div>
                 </div>
               )}
            </div>
            
            {state.error && <div className="mt-6 bg-red-950/20 border-2 border-red-900 text-red-400 p-4 font-mono text-[10px] uppercase">{state.error}</div>}

            {selectedSound && (
              <div className="mt-10 pt-8 border-t-2 border-[#2a2a32] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-[10px] text-zinc-600 font-mono">ADDR: {selectedSound.id.slice(0,12)}</div>
                  <div className="flex gap-4 w-full sm:w-auto">
                    <Button variant="secondary" size="sm" onClick={handleSaveAsPreset} icon={<Save className="w-3 h-3"/>} className="flex-1 sm:flex-none">SAVE_PATCH</Button>
                    <Button variant="secondary" size="sm" onClick={() => { setIsManualMode(false); handleGenerate(true); }} icon={<Sliders className="w-3 h-3"/>} className="flex-1 sm:flex-none">REMIX_DATA</Button>
                  </div>
              </div>
            )}
          </div>
        </section>

        {/* Library Sidebar */}
        <section className="lg:col-span-4 flex flex-col h-auto lg:h-[calc(100vh-160px)] pixel-card shadow-xl sticky top-10">
            <div className="p-6 pixel-card-header flex items-center justify-between">
                <div className="flex items-center gap-3 text-[#f0f0f5] font-bold uppercase tracking-widest text-[11px]">
                    <History className="w-4 h-4 text-[#00ff66]" /> LIBRARY_LOG
                </div>
                <span className="bg-[#0a0a0c] text-[#00ff66] text-[10px] px-3 py-1 border border-zinc-800 font-mono">
                  {state.history.length.toString().padStart(3, '0')}
                </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
                {state.history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-700 text-[10px] uppercase tracking-widest text-center px-4">
                        <Terminal className="w-10 h-10 mb-4 opacity-10" />
                        <p>NULL_RECORDS_FOUND</p>
                    </div>
                ) : (
                    state.history.map(sound => (
                        <div 
                            key={sound.id}
                            onClick={() => dispatch({ type: IntentType.SELECT_SOUND, payload: sound.id })}
                            className={`group p-4 border-2 cursor-pointer transition-all flex items-center justify-between ${
                                state.selectedSoundId === sound.id 
                                ? 'bg-[#00ff66]/10 border-[#00ff66] translate-x-1' 
                                : 'bg-transparent border-[#2a2a32] hover:border-zinc-700'
                            }`}
                        >
                            <div className="flex-1 min-w-0">
                                <div className={`font-bold truncate text-[11px] uppercase tracking-tight ${state.selectedSoundId === sound.id ? 'text-[#00ff66]' : 'text-[#f0f0f5]'}`}>
                                    {sound.name}
                                </div>
                                <div className="text-[8px] text-zinc-600 truncate mt-1 tracking-widest uppercase flex items-center gap-2">
                                    {sound.params.waveform} <span className="text-zinc-800">•</span> {sound.params.duration.toFixed(1)}S
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                <button onClick={(e) => { e.stopPropagation(); handlePlay(sound); }} className="p-1.5 border-2 border-zinc-800 hover:border-[#00ff66] text-zinc-500 hover:text-[#00ff66] bg-[#0a0a0c]">
                                    <Play className="w-3 h-3" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); dispatch({ type: IntentType.DELETE_SOUND, payload: sound.id }); }} className="p-1.5 border-2 border-zinc-800 hover:border-red-500 text-zinc-500 hover:text-red-500 bg-[#0a0a0c]">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="p-4 bg-black/60 border-t-2 border-[#2a2a32] text-[8px] text-zinc-700 font-mono text-center tracking-widest">
              LOCAL_CACHE_LOG // SYNC_OK
            </div>
        </section>
      </div>
    </div>
  );
};

export default App;
