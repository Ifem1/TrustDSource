"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedCounterProps {
  to: number;
  suffix?: string;
  durationMs?: number;
}

export function AnimatedCounter({
  to,
  suffix = "",
  durationMs = 1500,
}: AnimatedCounterProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    let raf: number;
    let start: number | null = null;

    function step(t: number) {
      if (start === null) start = t;
      const progress = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(to * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, durationMs]);

  return (
    <motion.span ref={ref}>
      {value}
      {suffix}
    </motion.span>
  );
}
