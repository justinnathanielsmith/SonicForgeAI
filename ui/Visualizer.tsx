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

    // Dimensions
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    if (!data || !isPlaying) {
      // Draw idle line
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.strokeStyle = '#3f3f46'; // zinc-700
      ctx.lineWidth = 2;
      ctx.stroke();
      return;
    }

    // Draw waveform
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#818cf8'; // indigo-400
    ctx.beginPath();

    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0; // 0..255 -> 0..2
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#6366f1'; 

  }, [data, isPlaying]);

  return (
    <div className="w-full h-32 bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden relative">
        <canvas 
            ref={canvasRef} 
            width={800} 
            height={200} 
            className="w-full h-full block"
        />
        <div className="absolute top-2 left-2 text-xs font-mono text-gray-500">
            OSCILLOSCOPE
        </div>
    </div>
  );
};

export default Visualizer;
