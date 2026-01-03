"use client";

import { useEffect, useRef } from "react";

interface ParticleWaveProps {
  className?: string;
}

export function ParticleWave({ className = "" }: ParticleWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    // Grid settings
    const GRID_SIZE_X = 80;
    const GRID_SIZE_Y = 40;
    const PERSPECTIVE = 400;
    const CAMERA_HEIGHT = 150;

    let width: number;
    let height: number;
    let centerX: number;
    let centerY: number;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      centerX = width / 2;
      centerY = height / 2;
    };

    // Project 3D point to 2D with perspective
    const project = (x: number, y: number, z: number) => {
      const scale = PERSPECTIVE / (PERSPECTIVE + z);
      return {
        x: centerX + x * scale,
        y: centerY + (y - CAMERA_HEIGHT) * scale,
        scale: scale,
      };
    };

    // Wave function - creates the 3D surface
    const getWaveHeight = (x: number, z: number, time: number) => {
      const wave1 = Math.sin(x * 0.02 + time * 0.8) * 25;
      const wave2 = Math.sin(z * 0.015 + time * 0.6) * 20;
      const wave3 = Math.sin((x + z) * 0.01 + time * 0.4) * 15;
      const wave4 = Math.cos(x * 0.008 - time * 0.3) * 30;
      return wave1 + wave2 + wave3 + wave4;
    };

    const animate = (timestamp: number) => {
      const time = timestamp * 0.001;

      ctx.clearRect(0, 0, width, height);

      // Store points for drawing
      const points: { x: number; y: number; size: number; opacity: number; z: number }[] = [];

      // Create the grid of points
      for (let gridZ = 0; gridZ < GRID_SIZE_Y; gridZ++) {
        for (let gridX = 0; gridX < GRID_SIZE_X; gridX++) {
          // Map grid to 3D space
          const x = (gridX - GRID_SIZE_X / 2) * 25;
          const z = gridZ * 20 + 50;

          // Get wave height at this position
          const y = getWaveHeight(x, z, time);

          // Project to 2D
          const projected = project(x, y, z);

          // Only draw if on screen
          if (
            projected.x > -10 &&
            projected.x < width + 10 &&
            projected.y > -10 &&
            projected.y < height + 10
          ) {
            // Calculate opacity based on depth and position
            const depthFade = Math.max(0, 1 - gridZ / GRID_SIZE_Y);
            const edgeFade = 1 - Math.abs(gridX - GRID_SIZE_X / 2) / (GRID_SIZE_X / 2) * 0.5;
            const opacity = depthFade * edgeFade * 0.8;

            // Size based on perspective
            const size = Math.max(0.5, 2.5 * projected.scale);

            points.push({
              x: projected.x,
              y: projected.y,
              size,
              opacity,
              z: z,
            });
          }
        }
      }

      // Sort by z-depth (draw far points first)
      points.sort((a, b) => b.z - a.z);

      // Draw all points
      points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${point.opacity})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    resize();
    animationFrameId = requestAnimationFrame(animate);

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 -z-10 ${className}`}
      style={{ background: "transparent" }}
    />
  );
}
