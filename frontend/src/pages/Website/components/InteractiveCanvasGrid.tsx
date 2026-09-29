import React, { useEffect, useRef } from 'react';


interface CanvasLinesProps {
  className?: string;
}

export const InteractiveCanvasGrid: React.FC<CanvasLinesProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    let t = 0;

    const render = () => {
      t += 0.008;
      ctx.clearRect(0, 0, width, height);

      // Draw faint technical guide grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 48;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw dynamic subtle sine waves matching Webflow Dev swirl lines
      const lineCount = 3;
      for (let l = 0; l < lineCount; l++) {
        ctx.beginPath();
        ctx.strokeStyle = l === 0 
          ? 'rgba(239, 69, 35, 0.12)' 
          : l === 1 
          ? 'rgba(20, 110, 245, 0.08)' 
          : 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1.5;

        for (let x = 0; x < width; x += 6) {
          const y =
            height * 0.5 +
            Math.sin(x * 0.004 + t + l * 0.8) * 45 +
            Math.cos(x * 0.002 - t * 0.5) * 30;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Crosshair dots at select grid intersections
      ctx.fillStyle = 'rgba(239, 69, 35, 0.3)';
      const step = gridSize * 4;
      for (let x = step; x < width; x += step) {
        for (let y = step; y < height; y += step) {
          ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity: 0.9 }}
    />
  );
};

export default InteractiveCanvasGrid;
