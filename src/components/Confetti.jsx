"use client";

import { useState } from "react";

const COLORS = ["#086AFA", "#FF9F04", "#F93334", "#04E6B4"];

// Only ever mounted after a click, so random values are safe (no SSR mismatch).
export default function Confetti({ count = 36 }) {
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      dx: (Math.random() - 0.5) * 240,
      rot: (Math.random() - 0.5) * 900,
      delay: Math.random() * 0.5,
      color: COLORS[i % COLORS.length],
    }))
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, "--dx": `${p.dx}px`, "--rot": `${p.rot}deg` }}
        />
      ))}
    </div>
  );
}
