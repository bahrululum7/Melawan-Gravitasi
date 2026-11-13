import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../utils/audioEngine';

interface StarParticle {
  x: number;
  y: number;
  z: number;
  baseRadius: number;
  speedX: number;
  speedY: number;
  opacity: number;
  pulsePhase: number;
  color: string;
}

export const AudioReactiveSpace: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current.targetX = e.touches[0].clientX;
        mouseRef.current.targetY = e.touches[0].clientY;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Initialize 160 stars with zero gravity float
    const starColors = [
      'rgba(245, 235, 220, ', // Warm starlight
      'rgba(255, 215, 160, ', // Celestial amber
      'rgba(200, 220, 255, ', // Cool nebula
      'rgba(255, 255, 255, ', // Crisp pure white
    ];

    const particles: StarParticle[] = [];
    const particleCount = 140;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 2 + 0.5,
        baseRadius: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: (Math.random() - 0.5) * 0.25,
        opacity: Math.random() * 0.6 + 0.2,
        pulsePhase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }

    let ringPulse = 0;

    const render = () => {
      // Smooth mouse lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const freqData = audioEngine.getFrequencyData();
      const bassEnergy = audioEngine.getBassEnergy();
      const isPlaying = audioEngine.isPlaying();

      // Deep space gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, '#0c0b11');
      bgGrad.addColorStop(0.5, '#07060a');
      bgGrad.addColorStop(1, '#030205');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle gravitational wave rings responding to bass
      if (isPlaying && bassEnergy > 0.05) {
        ringPulse += (bassEnergy * 2 + 0.3) * 0.04;
        const ringRadius = (ringPulse * 180) % (Math.min(width, height) * 0.7);
        const ringAlpha = Math.max(0, 0.2 - ringRadius / (Math.min(width, height) * 0.7) * 0.2);

        ctx.save();
        ctx.strokeStyle = `rgba(217, 180, 130, ${ringAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.5, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw audio frequency constellation ring in the center
      if (isPlaying && freqData.length > 0) {
        const cx = width * 0.5;
        const cy = height * 0.5;
        const baseOrbit = Math.min(width, height) * 0.24;
        const step = 4;
        const totalPoints = Math.floor(freqData.length / step);

        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < totalPoints; i++) {
          const angle = (i / totalPoints) * Math.PI * 2;
          const val = freqData[i * step] / 255;
          const r = baseOrbit + val * 45 * (1 + bassEnergy);
          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(240, 210, 160, ${0.12 + bassEnergy * 0.25})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // Update and draw floating zero-gravity particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Float motion
        p.x += p.speedX * (1 + bassEnergy * 1.5);
        p.y += p.speedY * (1 + bassEnergy * 1.5);

        // Screen wrap
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Interactive mouse gravity drift
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180 && dist > 1) {
          const force = (180 - dist) / 180 * 0.6;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }

        // Bass pulsing radius and opacity
        p.pulsePhase += 0.02;
        const pulse = Math.sin(p.pulsePhase) * 0.3 + 0.7;
        const reactiveRadius = p.baseRadius * (1 + bassEnergy * 1.8) * pulse;
        const currentOpacity = Math.min(1, p.opacity * (1 + bassEnergy * 0.8));

        ctx.fillStyle = `${p.color}${currentOpacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, reactiveRadius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glow for larger stars
        if (p.baseRadius > 1.2 && bassEnergy > 0.1) {
          ctx.fillStyle = `${p.color}${currentOpacity * 0.25})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, reactiveRadius * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      aria-hidden="true"
    />
  );
};
