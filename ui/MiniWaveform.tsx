import React, { useRef, useEffect } from 'react';

interface MiniWaveformProps {
  buffer: AudioBuffer | null;
  className?: string;
}

const MiniWaveform: React.FC<MiniWaveformProps> = ({ buffer, className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !buffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, width, height);

    // Modern Flat Bar Rendering
    const barWidth = 3;
    const gap = 1;
    for (let i = 0; i < width; i += (barWidth + gap)) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step * (barWidth + gap); j++) {
        const idx = i * step + j;
        if (idx >= data.length) break;
        const datum = data[idx];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      
      ctx.fillStyle = '#00ff66';
      const h = Math.max(2, (max - min) * amp);
      const y = (1 + min) * amp;
      ctx.fillRect(i, y, barWidth, h);
    }
  }, [buffer]);

  return (
    <div className={`bg-[#0a0a0c] border-2 border-zinc-800 overflow-hidden ${className}`}>
      <canvas 
        ref={canvasRef} 
        width={160} 
        height={40} 
        className="w-full h-full block"
      />
    </div>
  );
};

export default MiniWaveform;