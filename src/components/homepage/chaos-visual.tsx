'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  LayoutGrid,
  Github,
  MessageSquare,
  Code2,
  Globe,
  Terminal,
  FileText,
  Bookmark,
} from 'lucide-react';

const ICONS = [LayoutGrid, Github, MessageSquare, Code2, Globe, Terminal, FileText, Bookmark];
const ICON_SIZE = 44;
const REPEL_RADIUS = 100;
const REPEL_STRENGTH = 3;

interface IconState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  scalePhase: number;
}

export function ChaosVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<(HTMLDivElement | null)[]>([]);
  const stateRef = useRef<IconState[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number>(0);

  const initState = useCallback((width: number, height: number): IconState[] => {
    return ICONS.map(() => ({
      x: Math.random() * (width - ICON_SIZE),
      y: Math.random() * (height - ICON_SIZE),
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      rotation: Math.random() * 20 - 10,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      scalePhase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    stateRef.current = initState(rect.width, rect.height);

    const handleMouseMove = (e: MouseEvent) => {
      const r = container.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    function animate() {
      const r = container!.getBoundingClientRect();
      const maxW = r.width - ICON_SIZE;
      const maxH = r.height - ICON_SIZE;
      const mouse = mouseRef.current;

      stateRef.current.forEach((s, i) => {
        const centerX = s.x + ICON_SIZE / 2;
        const centerY = s.y + ICON_SIZE / 2;
        const dx = centerX - mouse.x;
        const dy = centerY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPEL_RADIUS && dist > 0) {
          const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH;
          s.vx += (dx / dist) * force;
          s.vy += (dy / dist) * force;
        }

        s.vx *= 0.98;
        s.vy *= 0.98;

        const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
        if (speed < 0.3) {
          s.vx += (Math.random() - 0.5) * 0.2;
          s.vy += (Math.random() - 0.5) * 0.2;
        }
        if (speed > 4) {
          s.vx = (s.vx / speed) * 4;
          s.vy = (s.vy / speed) * 4;
        }

        s.x += s.vx;
        s.y += s.vy;

        if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); }
        if (s.x >= maxW) { s.x = maxW; s.vx = -Math.abs(s.vx); }
        if (s.y <= 0) { s.y = 0; s.vy = Math.abs(s.vy); }
        if (s.y >= maxH) { s.y = maxH; s.vy = -Math.abs(s.vy); }

        s.rotation += s.rotationSpeed;
        s.scalePhase += 0.015;
        const scale = 1 + Math.sin(s.scalePhase) * 0.06;

        const el = iconsRef.current[i];
        if (el) {
          el.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.rotation}deg) scale(${scale})`;
        }
      });

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [initState]);

  return (
    <div ref={containerRef} className="relative h-[280px] overflow-hidden max-md:h-[220px]">
      {ICONS.map((Icon, i) => (
        <div
          key={i}
          ref={(el) => { iconsRef.current[i] = el; }}
          className="absolute flex size-[44px] items-center justify-center rounded-[10px] border border-[#2a2a3a] bg-[#1a1a25] select-none pointer-events-none"
        >
          <Icon className="size-[22px] text-[#8888a0]" strokeWidth={1.5} />
        </div>
      ))}
    </div>
  );
}
