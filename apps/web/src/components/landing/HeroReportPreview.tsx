"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Animated mock report card for the hero — score ticks up, gauge fills,
 * source bars animate in. Loops to feel "live."
 */
export function HeroReportPreview() {
  const [score, setScore] = useState(0);
  const target = 87;

  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const duration = 1800;

    function step(t: number) {
      if (start === null) start = t;
      const elapsed = t - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setScore(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);

    const interval = setInterval(() => {
      setScore(0);
      start = null;
      raf = requestAnimationFrame(step);
    }, 6000);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, []);

  const r = 60;
  const stroke = 8;
  const cx = r + stroke;
  const cy = r + stroke;
  const svgSize = (r + stroke) * 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      className="card p-6 max-w-md mx-auto"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="badge bg-graphPurple/10 text-graphPurple border-graphPurple/20 text-xs">
            Live Report
          </span>
        </div>
        <motion.span
          className="badge bg-green-100 text-green-800 border-green-200 text-xs"
          animate={score >= 80 ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          HIGH CREDIBILITY
        </motion.span>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <svg
            width={svgSize}
            height={svgSize}
            className="rotate-[-90deg]"
            viewBox={`0 0 ${svgSize} ${svgSize}`}
          >
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#f7f0ff"
              strokeWidth={stroke}
            />
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#16a34a"
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{
                filter: "drop-shadow(0 0 8px rgba(22, 163, 74, 0.4))",
                transition: "stroke-dashoffset 0.05s linear",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-credibilityGreen leading-none">
              {score}
            </span>
            <span className="text-[10px] text-secondaryText mt-1">/ 100</span>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {[
            { label: "Source Quality", value: 91, color: "bg-credibilityGreen" },
            { label: "Evidence Strength", value: 88, color: "bg-credibilityGreen" },
            { label: "Consistency", value: 84, color: "bg-moderateBlue" },
          ].map((m, i) => (
            <div key={m.label}>
              <div className="flex justify-between mb-0.5">
                <span className="text-[10px] text-secondaryText">{m.label}</span>
                <span className="text-[10px] font-bold text-primaryText">
                  {m.value}
                </span>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${m.color} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${m.value}%` }}
                  transition={{
                    duration: 1.2,
                    delay: 0.4 + i * 0.15,
                    ease: "easeOut",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border">
        <p className="text-xs font-semibold text-secondaryText uppercase tracking-wider mb-2">
          Supporting Sources
        </p>
        <div className="space-y-1.5">
          {["reuters.com", "apnews.com", "nature.com"].map((domain, i) => (
            <motion.div
              key={domain}
              className="flex items-center justify-between text-xs"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1 + i * 0.2 }}
            >
              <span className="text-primaryText font-medium">{domain}</span>
              <span className="text-credibilityGreen font-bold">
                {[92, 94, 90][i]}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
