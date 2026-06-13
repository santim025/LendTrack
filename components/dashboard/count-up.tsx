"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  durationMs?: number;
  delayMs?: number;
  format?: (value: number) => string;
  className?: string;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Animates a number from 0 up (or down, for negatives) to `value` using
 * requestAnimationFrame with an ease-out curve. Honors prefers-reduced-motion
 * by rendering the final value immediately.
 */
export function CountUp({
  value,
  durationMs = 1200,
  delayMs = 0,
  format = (v) => Math.round(v).toLocaleString("es-CO"),
  className,
}: CountUpProps) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setCurrent(value);
      return;
    }

    const startAnimation = () => {
      const startTime = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / durationMs, 1);
        setCurrent(value * easeOutCubic(progress));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setCurrent(value);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    timeoutRef.current = setTimeout(startAnimation, delayMs);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, durationMs, delayMs]);

  return <span className={className}>{format(current)}</span>;
}
