"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type GameStatus = "idle" | "running" | "gameover";

type Size = { w: number; h: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = clamp(r, 0, Math.min(w, h) / 2);
  if (typeof (ctx as any).roundRect === "function") {
    (ctx as any).roundRect(x, y, w, h, rr);
    return;
  }
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (!r) return;
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
}

export function FlappyHollies({
  className,
  height = 260,
  spriteSrc = "/holy/14.png",
}: {
  className?: string;
  /** Chiều cao khung game (px) */
  height?: number;
  /** Đường dẫn sprite nhân vật */
  spriteSrc?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTRef = useRef<number | null>(null);

  const { ref: containerRef, size } = useElementSize<HTMLDivElement>();

  const [status, setStatus] = useState<GameStatus>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const spriteRef = useRef<HTMLImageElement | null>(null);
  const spriteOkRef = useRef(false);
  useEffect(() => {
    spriteOkRef.current = false;
    const img = new Image();
    img.decoding = "async";
    img.src = spriteSrc;
    img.onload = () => {
      spriteRef.current = img;
      spriteOkRef.current = true;
    };
    img.onerror = () => {
      spriteRef.current = null;
      spriteOkRef.current = false;
    };
  }, [spriteSrc]);

  const seededPalette = useMemo(
    () => ({
      skyTop: "#EEF6FF",
      skyBottom: "#DCEBFF",
      accent: "#0052FF",
      accent2: "#4D7CFF",
      pipe: "rgba(0,82,255,0.18)",
      pipeEdge: "rgba(0,82,255,0.35)",
      ground: "rgba(2,6,23,0.07)",
      ink: "rgba(2,6,23,0.78)",
      muted: "rgba(2,6,23,0.45)",
    }),
    [],
  );

  // --- Game state (mutable) ---
  const worldRef = useRef({
    birdY: 0,
    birdV: 0,
    birdX: 0,
    gravity: 1550, // px/s^2
    flapV: -460, // px/s
    pipes: [] as Array<{
      x: number;
      gapY: number;
      passed: boolean;
    }>,
    speed: 230, // px/s
    spawnEvery: 1.25, // seconds
    spawnT: 0,
    rng: 1,
  });

  const reset = useCallback(() => {
    const w = Math.max(320, size.w || 420);
    const h = Math.max(200, (height || 260) | 0);
    const world = worldRef.current;
    world.birdX = Math.round(w * 0.28);
    world.birdY = Math.round(h * 0.45);
    world.birdV = 0;
    world.pipes = [];
    world.spawnT = 0;
    world.rng = 1;
    setScore(0);
    setStatus("idle");
    lastTRef.current = null;
  }, [height, size.w]);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, height]);

  const restart = useCallback(() => {
    const w = Math.max(320, size.w || 420);
    const h = Math.max(200, (height || 260) | 0);
    const world = worldRef.current;
    world.birdX = Math.round(w * 0.28);
    world.birdY = Math.round(h * 0.45);
    world.birdV = 0;
    world.pipes = [];
    world.spawnT = 0;
    world.rng = 1;
    setScore(0);
    setStatus("running");
    lastTRef.current = null;
  }, [height, size.w]);

  const flap = useCallback(() => {
    const world = worldRef.current;
    if (status === "gameover") {
      restart();
      world.birdV = world.flapV;
      return;
    }
    if (status === "idle") setStatus("running");
    world.birdV = world.flapV;
  }, [restart, status]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown as any);
  }, [flap]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // background
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, seededPalette.skyTop);
    g.addColorStop(1, seededPalette.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // subtle diagonal sheen
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.moveTo(w * 0.35, 0);
    ctx.lineTo(w * 0.55, 0);
    ctx.lineTo(w * 0.15, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ground
    const groundH = Math.round(h * 0.12);
    ctx.fillStyle = seededPalette.ground;
    ctx.fillRect(0, h - groundH, w, groundH);

    // pipes
    const world = worldRef.current;
    const pipeW = Math.max(44, Math.round(w * 0.1));
    const gap = Math.max(92, Math.round(h * 0.28));
    const margin = Math.round(h * 0.12);

    for (const p of world.pipes) {
      const topH = clamp(p.gapY - gap / 2, margin, h - margin - gap);
      const botY = topH + gap;
      const botH = h - groundH - botY;

      ctx.fillStyle = seededPalette.pipe;
      ctx.strokeStyle = seededPalette.pipeEdge;
      ctx.lineWidth = 2;

      // top
      ctx.beginPath();
      roundRectPath(ctx, p.x, 0, pipeW, topH, 10);
      ctx.fill();
      ctx.stroke();
      // bottom
      ctx.beginPath();
      roundRectPath(ctx, p.x, botY, pipeW, botH, 10);
      ctx.fill();
      ctx.stroke();
    }

    // bird (sprite)
    const bx = world.birdX;
    const by = world.birdY;
    const birdSize = clamp(Math.round(Math.min(w, h) * 0.15), 34, 58);
    const img = spriteRef.current;
    if (spriteOkRef.current && img) {
      const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
      const drawH = birdSize;
      const drawW = Math.round(drawH * ratio);
      const x = Math.round(bx - drawW / 2);
      const y = Math.round(by - drawH / 2);
      ctx.save();
      ctx.shadowColor = "rgba(0,82,255,0.25)";
      ctx.shadowBlur = 10;
      ctx.drawImage(img, x, y, drawW, drawH);
      ctx.restore();
    } else {
      // fallback orb if sprite chưa load
      const r = Math.max(12, Math.round(birdSize * 0.28));
      const orb = ctx.createLinearGradient(bx - r, by - r, bx + r, by + r);
      orb.addColorStop(0, seededPalette.accent2);
      orb.addColorStop(1, seededPalette.accent);
      ctx.fillStyle = orb;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD pill (centered)
    const pillText = `Score ${score}  ·  Best ${best}`;
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.font =
      "700 13px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    const textW = Math.ceil(ctx.measureText(pillText).width);
    const padX = 12;
    const pillW = clamp(textW + padX * 2, 150, Math.round(w * 0.6));
    const pillH = 30;
    const pillX = Math.round((w - pillW) / 2);
    const pillY = 10;
    const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
    pillGrad.addColorStop(0, "rgba(0,82,255,0.16)");
    pillGrad.addColorStop(1, "rgba(77,124,255,0.12)");
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.strokeStyle = "rgba(0,82,255,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    roundRectPath(ctx, pillX, pillY, pillW, pillH, 999);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = pillGrad;
    ctx.beginPath();
    roundRectPath(ctx, pillX, pillY, pillW, pillH, 999);
    ctx.fill();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = seededPalette.ink;
    ctx.fillText(pillText, pillX + padX, pillY + 20);
    ctx.restore();
  }, [best, height, score, seededPalette]);

  const tick = useCallback(
    (t: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const w = canvas.width;
      const h = canvas.height;
      const groundH = Math.round(h * 0.12);

      const world = worldRef.current;
      const prevT = lastTRef.current;
      lastTRef.current = t;
      const dt = prevT == null ? 0 : clamp((t - prevT) / 1000, 0, 0.04);

      if (status === "running") {
        // physics
        world.birdV += world.gravity * dt;
        world.birdY += world.birdV * dt;

        // spawn pipes
        world.spawnT += dt;
        if (world.spawnT >= world.spawnEvery) {
          world.spawnT = 0;
          // deterministic-ish rng
          world.rng = (world.rng * 1664525 + 1013904223) >>> 0;
          const r01 = world.rng / 0xffffffff;
          const gap = Math.max(92, Math.round(h * 0.28));
          const margin = Math.round(h * 0.12);
          const minY = margin + gap * 0.5;
          const maxY = h - groundH - margin - gap * 0.5;
          const gapY = minY + (maxY - minY) * r01;
          world.pipes.push({ x: w + 24, gapY, passed: false });
        }

        // move pipes
        for (const p of world.pipes) p.x -= world.speed * dt;
        world.pipes = world.pipes.filter((p) => p.x > -120);

        // scoring + collisions
        const pipeW = Math.max(44, Math.round(w * 0.1));
        const gap = Math.max(92, Math.round(h * 0.28));
        const birdSize = clamp(Math.round(Math.min(w, h) * 0.15), 34, 58);
        const birdR = Math.max(12, Math.round(birdSize * 0.28));

        for (const p of world.pipes) {
          const pipeMid = p.x + pipeW / 2;
          if (!p.passed && pipeMid < world.birdX) {
            p.passed = true;
            setScore((s) => s + 1);
          }

          const topH = clamp(p.gapY - gap / 2, 0, h);
          const botY = topH + gap;

          const birdLeft = world.birdX - birdR;
          const birdRight = world.birdX + birdR;
          const birdTop = world.birdY - birdR;
          const birdBottom = world.birdY + birdR;

          const pipeLeft = p.x;
          const pipeRight = p.x + pipeW;

          const overlapX = birdRight > pipeLeft && birdLeft < pipeRight;
          if (overlapX) {
            const hitTop = birdTop < topH;
            const hitBottom = birdBottom > botY;
            if (hitTop || hitBottom) {
              setStatus("gameover");
              setBest((b) => Math.max(b, score));
            }
          }
        }

        // boundaries
        if (world.birdY > h - groundH - 2 || world.birdY < 2) {
          setStatus("gameover");
          setBest((b) => Math.max(b, score));
        }
      }

      draw();
      rafRef.current = requestAnimationFrame(tick);
    },
    [draw, score, status],
  );

  // setup canvas sizing + loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = Math.max(320, size.w || 420);
    const h = Math.max(200, (height || 260) | 0);

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [height, size.w, tick]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height }}
      onMouseDown={(e) => {
        e.preventDefault();
        flap();
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        flap();
      }}
      role="application"
      aria-label="Flappy Hollies mini game"
    >
      <canvas
        ref={canvasRef}
        className="block w-full rounded-2xl border border-border bg-white/70 dark:bg-card shadow-sm"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {status === "gameover"
            ? "Space/Click để chơi lại"
            : "Space/Click để bay"}
        </span>
        <div className="flex items-center gap-2">
          <span className="tabular-nums">Best: {best}</span>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-border bg-card px-2 py-1 hover:bg-muted transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

