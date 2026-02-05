import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
  data: Uint8Array | null;
  isPlaying: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ data, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#141418';
    ctx.fillRect(0, 0, width, height);
    
    // Draw Minimalist Grid
    ctx.strokeStyle = '#1f1f23';
    ctx.lineWidth = 2;
    for(let i=0; i<width; i+=40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for(let j=0; j<height; j+=40) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
    }

    if (!data || !isPlaying) {
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.strokeStyle = '#2a2a32';
      ctx.lineWidth = 4;
      ctx.stroke();
      return;
    }

    // Modern Flat Pixel Waveform
    const sliceWidth = width / data.length;
    const stepSize = 8; // Larger blocks for modern look
    
    ctx.fillStyle = '#00ff66';
    
    for (let i = 0; i < data.length; i += stepSize) {
      const v = data[i] / 128.0; 
      const y = (v * height) / 2;
      const barHeight = 6;
      
      // Horizontal segment
      ctx.fillRect(i * sliceWidth, y - (barHeight/2), sliceWidth * stepSize, barHeight);
      
      // Vertical connector
      if (i > 0) {
        const prevV = data[i - stepSize] / 128.0;
        const prevY = (prevV * height) / 2;
        const connX = i * sliceWidth;
        const minY = Math.min(y, prevY);
        const connH = Math.abs(y - prevY);
        ctx.fillRect(connX, minY, 4, connH);
      }
    }

  }, [data, isPlaying]);

  return (
    <div className="w-full h-48 border-2 border-[#2a2a32] overflow-hidden relative shadow-[4px_4px_0px_0px_#000]">
        <canvas 
            ref={canvasRef} 
            width={800} 
            height={200} 
            className="w-full h-full block"
        />
        <div className="absolute top-0 left-0 bg-[#00ff66] text-black text-[8px] px-2 py-0.5 font-bold uppercase tracking-widest">
            SCOPE_OUTPUT
        </div>
        <div className="absolute bottom-2 right-4 flex items-center gap-2">
            <div className={`w-3 h-3 border border-black ${isPlaying ? 'bg-[#ff3d3d] animate-pulse' : 'bg-zinc-800'}`}></div>
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">IO_ACTIVE</span>
        </div>
    </div>
  );
};

export default Visualizer;