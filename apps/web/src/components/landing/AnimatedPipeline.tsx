"use client";

import { motion } from "framer-motion";

const STEPS = [
  { icon: "📥", label: "Submit", desc: "Article, tweet or claim" },
  { icon: "🔒", label: "Snapshot", desc: "Locked on GenLayer" },
  { icon: "🔍", label: "Extract", desc: "Factual claims identified" },
  { icon: "🌐", label: "Discover", desc: "Sources & evidence" },
  { icon: "⚖️", label: "Verdict", desc: "Credibility score" },
];

export function AnimatedPipeline() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative">
        {/* Animated connecting line */}
        <div className="absolute top-9 left-12 right-12 h-1 bg-border rounded-full overflow-hidden hidden md:block">
          <motion.div
            className="h-full bg-gradient-to-r from-graphPurple via-trustLavender to-credibilityGreen"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-2 relative">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.label}
              className="card p-4 text-center relative z-10"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              whileInView={{
                scale: [1, 1.06, 1],
                transition: {
                  delay: i * 0.4,
                  duration: 0.6,
                  repeat: Infinity,
                  repeatDelay: STEPS.length * 0.4,
                },
              }}
              viewport={{ once: false }}
            >
              <motion.div
                className="text-3xl mb-2"
                animate={{
                  rotate: [0, -8, 8, 0],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  repeatDelay: 3 + i * 0.6,
                  ease: "easeInOut",
                }}
              >
                {step.icon}
              </motion.div>
              <p className="text-sm font-bold text-primaryText">{step.label}</p>
              <p className="text-xs text-secondaryText mt-1">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
