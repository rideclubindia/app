import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, RefreshCw, Home, Play } from 'lucide-react';

type GameState = 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY';

const VICTORY_TIME = 12; // seconds
const GRAVITY = 0.6;
const JUMP_POWER = -10;
const GROUND_HEIGHT = 80;

interface Entity {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function RideDash404() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);

  // Game Refs to avoid state dependencies in loop
  const stateRef = useRef<GameState>('START');
  const riderRef = useRef({ ...initRider(), vy: 0, isGrounded: true });
  const obstaclesRef = useRef<Entity[]>([]);
  const frameRef = useRef(0);
  const scoreRef = useRef(0); // time in seconds
  const lastTimeRef = useRef(Date.now());
  const speedMultiplierRef = useRef(1);

  // Background offsets
  const bgOffsets = useRef({ layer1: 0, layer2: 0, layer3: 0 });

  function initRider() {
    return { x: 50, y: 0, w: 40, h: 40 }; // Will set y properly on resize
  }

  const startGame = () => {
    setGameState('PLAYING');
    stateRef.current = 'PLAYING';
    scoreRef.current = 0;
    setScore(0);
    obstaclesRef.current = [];
    frameRef.current = 0;
    speedMultiplierRef.current = 1;
    lastTimeRef.current = Date.now();
    
    if (canvasRef.current) {
      riderRef.current.y = canvasRef.current.height - GROUND_HEIGHT - riderRef.current.h;
      riderRef.current.vy = 0;
      riderRef.current.isGrounded = true;
    }
  };

  const jump = () => {
    if (stateRef.current === 'PLAYING' && riderRef.current.isGrounded) {
      riderRef.current.vy = JUMP_POWER;
      riderRef.current.isGrounded = false;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (stateRef.current === 'PLAYING') {
          jump();
        } else if (stateRef.current === 'START' || stateRef.current === 'GAMEOVER' || stateRef.current === 'VICTORY') {
          startGame();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (stateRef.current === 'START') {
        riderRef.current.y = canvas.height - GROUND_HEIGHT - riderRef.current.h;
      }
    };
    window.addEventListener('resize', resize);
    resize();

    // Drawing helpers
    const drawRider = (ctx: CanvasRenderingContext2D, r: typeof riderRef.current) => {
      ctx.fillStyle = '#ef4523'; // Brand color
      
      // Draw scooter body
      ctx.fillRect(r.x, r.y + 20, r.w, 10);
      // Wheels
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(r.x + 10, r.y + 35, 8, 0, Math.PI * 2);
      ctx.arc(r.x + r.w - 10, r.y + 35, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Handlebars
      ctx.fillStyle = '#666';
      ctx.fillRect(r.x + r.w - 15, r.y, 4, 25);
      
      // Rider
      ctx.fillStyle = '#111';
      ctx.fillRect(r.x + 10, r.y - 15, 12, 35); // Body
      ctx.beginPath();
      ctx.arc(r.x + 16, r.y - 22, 8, 0, Math.PI * 2); // Head
      ctx.fill();
    };

    const drawObstacle = (ctx: CanvasRenderingContext2D, obs: Entity) => {
      // Traffic cone style
      ctx.fillStyle = '#FF3B30';
      ctx.beginPath();
      ctx.moveTo(obs.x + obs.w / 2, obs.y);
      ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
      ctx.lineTo(obs.x, obs.y + obs.h);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#FFF';
      ctx.fillRect(obs.x + 5, obs.y + 10, obs.w - 10, 8);
    };

    const drawBackgrounds = (ctx: CanvasRenderingContext2D, cw: number, ch: number) => {
      // Sky
      ctx.fillStyle = '#F0F4F8';
      ctx.fillRect(0, 0, cw, ch);

      // Distant hills (Layer 1)
      ctx.fillStyle = '#D9E2EC';
      const l1 = bgOffsets.current.layer1;
      for (let i = -1; i < Math.ceil(cw / 200) + 1; i++) {
        ctx.beginPath();
        ctx.arc(i * 200 - l1, ch - GROUND_HEIGHT, 150, Math.PI, 0);
        ctx.fill();
      }

      // Trees/Signs (Layer 2)
      ctx.fillStyle = '#9FB3C8';
      const l2 = bgOffsets.current.layer2;
      for (let i = -1; i < Math.ceil(cw / 300) + 1; i++) {
        ctx.fillRect(i * 300 - l2 + 50, ch - GROUND_HEIGHT - 60, 20, 60);
        ctx.beginPath();
        ctx.arc(i * 300 - l2 + 60, ch - GROUND_HEIGHT - 70, 30, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ground (Layer 3)
      ctx.fillStyle = '#273a5a';
      ctx.fillRect(0, ch - GROUND_HEIGHT, cw, GROUND_HEIGHT);
      
      // Road lines
      ctx.fillStyle = '#FFF';
      const l3 = bgOffsets.current.layer3;
      for (let i = -1; i < Math.ceil(cw / 60) + 1; i++) {
        ctx.fillRect(i * 60 - l3, ch - GROUND_HEIGHT + 20, 30, 4);
      }
    };

    const loop = () => {
      const now = Date.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const cw = canvas.width;
      const ch = canvas.height;

      ctx.clearRect(0, 0, cw, ch);

      if (stateRef.current === 'PLAYING') {
        frameRef.current++;
        scoreRef.current += dt;
        
        // Update difficulty
        if (scoreRef.current > 6) {
          speedMultiplierRef.current = 1.5;
        }

        // Win condition
        if (scoreRef.current >= VICTORY_TIME) {
          stateRef.current = 'VICTORY';
          setGameState('VICTORY');
        }

        // Parallax movement
        const baseSpeed = 5 * speedMultiplierRef.current;
        bgOffsets.current.layer1 = (bgOffsets.current.layer1 + baseSpeed * 0.2) % 200;
        bgOffsets.current.layer2 = (bgOffsets.current.layer2 + baseSpeed * 0.5) % 300;
        bgOffsets.current.layer3 = (bgOffsets.current.layer3 + baseSpeed) % 60;

        // Rider physics
        const r = riderRef.current;
        r.vy += GRAVITY;
        r.y += r.vy;

        const groundY = ch - GROUND_HEIGHT - r.h;
        if (r.y > groundY) {
          r.y = groundY;
          r.vy = 0;
          r.isGrounded = true;
        }

        // Obstacle spawning
        // Spawns roughly every 1.5 to 2.5 seconds depending on multiplier
        if (Math.random() < 0.015 * speedMultiplierRef.current) {
          // Avoid spawning too close
          const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
          if (!lastObs || cw - lastObs.x > 300) {
            obstaclesRef.current.push({
              x: cw,
              y: ch - GROUND_HEIGHT - 30,
              w: 24,
              h: 30
            });
          }
        }

        // Obstacle logic & collision
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const obs = obstaclesRef.current[i];
          obs.x -= baseSpeed; // move left

          // Hitbox slightly smaller than visual for fairness
          const padding = 5;
          if (
            r.x + padding < obs.x + obs.w - padding &&
            r.x + r.w - padding > obs.x + padding &&
            r.y + padding < obs.y + obs.h - padding &&
            r.y + r.h - padding > obs.y + padding
          ) {
            stateRef.current = 'GAMEOVER';
            setGameState('GAMEOVER');
          }

          if (obs.x + obs.w < 0) {
            obstaclesRef.current.splice(i, 1);
          }
        }

        setScore(Math.floor(scoreRef.current));
      }

      // Draw
      drawBackgrounds(ctx, cw, ch);
      
      obstaclesRef.current.forEach(obs => drawObstacle(ctx, obs));
      drawRider(ctx, riderRef.current);

      animationId = requestAnimationFrame(loop);
    };

    lastTimeRef.current = Date.now();
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 w-full h-full bg-[#111] overflow-hidden select-none font-sans"
      onPointerDown={() => {
        if (gameState === 'PLAYING') jump();
      }}
    >
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full"
      />

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 bg-gradient-to-b from-[#273a5a]/80 to-transparent pointer-events-none flex justify-between items-start">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight flex items-center gap-3">
            404 
            <span className="text-[#ef4523]">Wrong Turn!</span>
          </h1>
          <p className="text-gray-300 font-medium mt-1">Help your rider get back on the map!</p>
        </div>
        <div className="flex items-center gap-2 bg-[#273a5a]/40 backdrop-blur px-4 py-2 rounded-lg border border-white/10">
          <ShieldAlert className="text-[#ef4523] w-5 h-5" />
          <span className="text-white font-bold font-mono text-xl">{score}s</span>
        </div>
      </div>

      {/* Start Screen */}
      {gameState === 'START' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#273a5a]/40 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border border-gray-100">
            <div className="w-16 h-16 bg-[#FFF0E6] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-[#ef4523] ml-1" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">RideDash</h2>
            <p className="text-sm text-gray-500 mb-6">
              Survive for 12 seconds to find your way back! Tap screen or press Space to jump over obstacles.
            </p>
            <button 
              onClick={startGame}
              className="w-full py-4 bg-[#ef4523] hover:bg-[#ef4523] text-white font-bold rounded-xl text-lg shadow-lg shadow-[#ef4523]/30 transition-all active:scale-95"
            >
              Start Dash
            </button>
            <button 
              onClick={() => navigate('/home')}
              className="w-full mt-3 py-3 text-gray-500 hover:text-gray-900 font-bold transition-colors text-sm"
            >
              Skip & Go Home
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/40 backdrop-blur-md animate-in fade-in zoom-in duration-300">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border-t-4 border-red-500">
            <h2 className="text-3xl font-black text-gray-900 mb-2">CRASH!</h2>
            <p className="text-gray-500 mb-6 font-medium">You survived for {score} seconds.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={startGame}
                className="w-full py-4 bg-gray-900 hover:bg-[#273a5a] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <RefreshCw className="w-5 h-5" />
                Play Again
              </button>
              <button 
                onClick={() => navigate('/home')}
                className="w-full py-4 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Home className="w-5 h-5" />
                Back to Homepage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Screen */}
      {gameState === 'VICTORY' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-900/40 backdrop-blur-md animate-in fade-in zoom-in duration-300">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border-t-4 border-[#34C759]">
            <h2 className="text-3xl font-black text-gray-900 mb-2">You Made It!</h2>
            <p className="text-gray-500 mb-6 font-medium">You survived {score} seconds and found your way back.</p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => navigate('/home')}
                className="w-full py-4 bg-[#ef4523] hover:bg-[#ef4523] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#ef4523]/30 transition-all active:scale-95"
              >
                <Home className="w-5 h-5" />
                Back to Homepage
              </button>
              <button 
                onClick={startGame}
                className="w-full py-4 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <RefreshCw className="w-5 h-5" />
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
