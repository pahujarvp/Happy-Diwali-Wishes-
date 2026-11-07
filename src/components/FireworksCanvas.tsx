import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { audioStore } from '../valley/audio';

export interface FireworksCanvasHandle {
  launch: (side?: 'left' | 'right', paletteIdx?: number) => void;
  launchDouble: (originX?: number, originY?: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
  trail: { x: number; y: number }[];
  trailLength: number;
  flicker: boolean;
}

interface Rocket {
  x: number;
  y: number;
  targetY: number;
  vx: number;
  vy: number;
  color: string;
  colorSet: string[];
  trail: { x: number; y: number }[];
}

export const FireworksCanvas = forwardRef<FireworksCanvasHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rocketsRef = useRef<Rocket[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const nextAutoLaunchRef = useRef<number>(0);
  const sideToggleRef = useRef<boolean>(false);

  // 10 distinct festive color palettes
  const colorPalettes = [
    ['#fbbf24', '#f59e0b', '#fef08a', '#ffffff'], // 0: Golden Amber
    ['#ff0055', '#f43f5e', '#fda4af', '#ffffff'], // 1: Ruby Rose Crimson
    ['#00f0ff', '#38bdf8', '#7dd3fc', '#ffffff'], // 2: Electric Cyan
    ['#a855f7', '#c084fc', '#e9d5ff', '#fbbf24'], // 3: Royal Violet & Gold
    ['#00ff88', '#10b981', '#6ee7b7', '#fef08a'], // 4: Emerald Jade
    ['#ff6600', '#f97316', '#fdba74', '#ffffff'], // 5: Sacred Saffron Orange
    ['#ec4899', '#f472b6', '#fbcfe8', '#fde047'], // 6: Magenta Lotus
    ['#3b82f6', '#60a5fa', '#93c5fd', '#ffffff'], // 7: Celestial Blue
    ['#fef08a', '#fbbf24', '#ffffff', '#e2e8f0'], // 8: Diamond White & Gold
    ['#ff4500', '#ff7700', '#ffaa00', '#ffffff'], // 9: Sunset Coral
  ];

  const createRocket = (side?: 'left' | 'right', paletteIdx?: number, customStartX?: number): Rocket => {
    const canvas = canvasRef.current;
    const rect = canvas ? canvas.getBoundingClientRect() : { width: 400, height: 700 };
    const w = rect.width || 400;
    const h = rect.height || 700;

    const chosenSide = side || (sideToggleRef.current ? 'right' : 'left');
    sideToggleRef.current = !sideToggleRef.current;

    let startX: number;
    let targetX: number;

    if (customStartX !== undefined) {
      startX = customStartX;
      targetX = customStartX + (Math.random() - 0.5) * (w * 0.25);
    } else {
      startX = chosenSide === 'left' ? w * 0.12 + Math.random() * (w * 0.18) : w * 0.70 + Math.random() * (w * 0.18);
      targetX = chosenSide === 'left' ? w * 0.22 + Math.random() * (w * 0.24) : w * 0.54 + Math.random() * (w * 0.24);
    }

    const targetY = h * 0.13 + Math.random() * (h * 0.26);
    const speed = 13 + Math.random() * 4.5;
    const dx = targetX - startX;
    const dy = targetY - h;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    const selectedIdx = paletteIdx !== undefined ? paletteIdx % colorPalettes.length : Math.floor(Math.random() * colorPalettes.length);
    const colorSet = colorPalettes[selectedIdx];

    return {
      x: startX,
      y: h,
      targetY,
      vx,
      vy,
      color: colorSet[0],
      colorSet,
      trail: [],
    };
  };

  const explodeRocket = (rocket: Rocket) => {
    audioStore.playFireworkBurst();

    const count = 95 + Math.floor(Math.random() * 55);
    const isWillow = Math.random() > 0.45;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
      const speed = isWillow ? 3.5 + Math.random() * 9.0 : 4.5 + Math.random() * 11.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const color = rocket.colorSet[Math.floor(Math.random() * rocket.colorSet.length)];

      particlesRef.current.push({
        x: rocket.x,
        y: rocket.y,
        vx,
        vy,
        color,
        alpha: 1.0,
        decay: isWillow ? 0.010 + Math.random() * 0.009 : 0.016 + Math.random() * 0.014,
        size: 2.2 + Math.random() * 2.6,
        trail: [],
        trailLength: isWillow ? 6 : 3,
        flicker: Math.random() > 0.35,
      });
    }
  };

  useImperativeHandle(ref, () => ({
    launch: (side?: 'left' | 'right', paletteIdx?: number) => {
      rocketsRef.current.push(createRocket(side, paletteIdx));
    },
    // Launch 2x fireworks of strictly different colors simultaneously
    launchDouble: (originX?: number) => {
      const canvas = canvasRef.current;
      const w = canvas ? canvas.getBoundingClientRect().width : 400;

      const idxA = Math.floor(Math.random() * colorPalettes.length);
      let idxB = Math.floor(Math.random() * colorPalettes.length);
      if (idxB === idxA) idxB = (idxA + 2) % colorPalettes.length;

      if (originX !== undefined) {
        // Offset around the touch point
        rocketsRef.current.push(createRocket('left', idxA, Math.max(w * 0.08, originX - w * 0.15)));
        setTimeout(() => {
          rocketsRef.current.push(createRocket('right', idxB, Math.min(w * 0.92, originX + w * 0.15)));
        }, 80);
      } else {
        // Dual launch from left and right flanks
        rocketsRef.current.push(createRocket('left', idxA));
        setTimeout(() => {
          rocketsRef.current.push(createRocket('right', idxB));
        }, 120);
      }
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    // Initial dual launch on load
    rocketsRef.current.push(createRocket('left', 0));
    setTimeout(() => {
      rocketsRef.current.push(createRocket('right', 2));
    }, 450);

    let lastTime = performance.now();

    const loop = (now: number) => {
      animFrameRef.current = requestAnimationFrame(loop);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Auto launch periodically from sides
      if (now > nextAutoLaunchRef.current) {
        rocketsRef.current.push(createRocket());
        if (Math.random() > 0.4) {
          setTimeout(() => {
            rocketsRef.current.push(createRocket());
          }, 350);
        }
        nextAutoLaunchRef.current = now + 1900 + Math.random() * 1400;
      }

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      // 1. Update & Draw Rockets
      for (let i = rocketsRef.current.length - 1; i >= 0; i--) {
        const r = rocketsRef.current[i];
        r.x += r.vx;
        r.y += r.vy;

        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 8) r.trail.shift();

        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        if (r.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(r.trail[0].x, r.trail[0].y);
          for (let j = 1; j < r.trail.length; j++) {
            ctx.lineTo(r.trail[j].x, r.trail[j].y);
          }
          ctx.strokeStyle = r.color;
          ctx.lineWidth = 2.0;
          ctx.stroke();
        }

        if (r.y <= r.targetY || r.vy >= 0) {
          explodeRocket(r);
          rocketsRef.current.splice(i, 1);
        }
      }

      // 2. Update & Draw Particles
      const gravity = 4.2;
      const friction = 0.978;

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];

        p.vx *= friction;
        p.vy = p.vy * friction + gravity * dt;

        p.x += p.vx;
        p.y += p.vy;

        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > p.trailLength) p.trail.shift();

        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        const currentAlpha = p.flicker && Math.random() > 0.3 ? p.alpha * 0.6 : p.alpha;

        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let j = 1; j < p.trail.length; j++) {
            ctx.lineTo(p.trail[j].x, p.trail[j].y);
          }
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = currentAlpha * 0.7;
          ctx.lineWidth = p.size * 0.8;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      style={{ display: 'block' }}
    />
  );
});

FireworksCanvas.displayName = 'FireworksCanvas';
