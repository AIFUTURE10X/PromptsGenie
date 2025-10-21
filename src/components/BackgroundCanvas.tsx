import React, { useEffect, useRef } from 'react';

type EffectType = 'none' | 'grain' | 'particles';

interface BackgroundCanvasProps {
  imageSrc?: string; // optional; if omitted, draws solid color
  color?: string; // CSS color for solid fill; defaults to black
  opacity?: number; // 0..1 for base background
  blur?: number; // pixels (applies to image only)
  effect?: EffectType; // animated overlay
  effectOpacity?: number; // 0..1 for overlay alpha
  grainScale?: number; // lower = denser noise; default 160px offscreen
  particleCount?: number;
  particleColor?: string;
  particleSize?: number; // px radius
  particleSpeed?: number; // px per frame
}

const BackgroundCanvas: React.FC<BackgroundCanvasProps> = ({
  imageSrc,
  color = '#000000',
  opacity = 1,
  blur = 0,
  effect = 'grain',
  effectOpacity = 0.06,
  grainScale = 160,
  particleCount = 60,
  particleColor = '#ffffff',
  particleSize = 1.5,
  particleSpeed = 0.1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Prepare optional image
    const img = imageSrc ? new Image() : null;
    if (img) {
      img.src = imageSrc!;
      img.crossOrigin = 'anonymous';
    }

    // Offscreen noise canvas for grain
    const noiseCanvas = document.createElement('canvas');
    const noiseCtx = noiseCanvas.getContext('2d');
    noiseCanvas.width = grainScale;
    noiseCanvas.height = grainScale;
  
    // Precompute noise once to avoid per-frame random flicker
    const generateNoise = () => {
      if (!noiseCtx) return;
      const imageData = noiseCtx.createImageData(noiseCanvas.width, noiseCanvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.floor(Math.random() * 256);
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
      noiseCtx.putImageData(imageData, 0, 0);
    };
    generateNoise();

    // Particles state
    type Particle = { x: number; y: number; vx: number; vy: number };
    let particles: Particle[] = [];

    const initParticles = (w: number, h: number) => {
      particles = new Array(particleCount).fill(0).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * particleSpeed,
        vy: (Math.random() - 0.5) * particleSpeed,
      }));
    };

    const drawBase = (width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = opacity;
      if (!img) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.filter = blur > 0 ? `blur(${blur}px)` : 'none';
        if (img.complete && img.naturalWidth > 0) {
          const iw = img.naturalWidth;
          const ih = img.naturalHeight;
          const scale = Math.max(width / iw, height / ih); // cover
          const tw = iw * scale;
          const th = ih * scale;
          const x = (width - tw) / 2;
          const y = (height - th) / 2;
          ctx.drawImage(img, x, y, tw, th);
        } else {
          // Fallback to color until image loads
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, width, height);
        }
        ctx.filter = 'none';
      }
      ctx.globalAlpha = 1;
    };

    const drawGrain = (width: number, height: number) => {
      if (!noiseCtx) return;
      ctx.globalAlpha = effectOpacity;
      // Use precomputed noise and scale; no per-frame regeneration to prevent flicker
      ctx.drawImage(noiseCanvas, 0, 0, width, height);
      ctx.globalAlpha = 1;
    };

    const drawParticles = (width: number, height: number) => {
      if (!particles.length) initParticles(width, height);
      ctx.globalAlpha = effectOpacity;
      ctx.fillStyle = particleColor;
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, particleSize, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        // gentle drift
        p.vx += (Math.random() - 0.5) * 0.005;
        p.vy += (Math.random() - 0.5) * 0.005;
        // wrap bounds
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }
      ctx.globalAlpha = 1;
    };

    let rafId = 0;
    let lastTime = 0;
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    // Resize only when needed; resizing every frame induces flicker
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const newW = Math.floor(width * dpr);
      const newH = Math.floor(height * dpr);
      if (canvas.width !== newW || canvas.height !== newH) {
        canvas.width = newW;
        canvas.height = newH;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      return { width, height };
    };

    const render = (time: number) => {
      const { width, height } = resizeCanvas();
  
      // throttle to target FPS
      if (time - lastTime >= frameInterval) {
        lastTime = time;
        drawBase(width, height);
        if (effect === 'grain') {
          drawGrain(width, height);
        } else if (effect === 'particles') {
          drawParticles(width, height);
        }
      }
  
      rafId = requestAnimationFrame(render);
    };

    const handleResize = () => {
      resizeCanvas();
      // re-init particles on resize to avoid odd wrapping
      initParticles(canvas.clientWidth, canvas.clientHeight);
      drawBase(canvas.clientWidth, canvas.clientHeight);
    };

    if (img) {
      img.onload = () => {
        // draw immediately on image load
        drawBase(canvas.clientWidth, canvas.clientHeight);
      };
      img.onerror = () => {
        // fallback handled in drawBase
      };
    }

    initParticles(canvas.clientWidth, canvas.clientHeight);
    rafId = requestAnimationFrame(render);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [imageSrc, color, opacity, blur, effect, effectOpacity, grainScale, particleCount, particleColor, particleSize, particleSpeed]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[-20] w-full h-full" />;
};

export default BackgroundCanvas;