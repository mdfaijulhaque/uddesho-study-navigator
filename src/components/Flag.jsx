"use client";

import { useState } from "react";
import { flagUrl } from "@/data/countries";

// Uses a flag image (works on Windows too) and falls back to the emoji if it can't load.
export default function Flag({ country, width = 48, className = "" }) {
  const [failed, setFailed] = useState(false);
  if (!country) return null;

  if (failed) {
    return (
      <span role="img" aria-label={`${country.name} flag`} className={className} style={{ fontSize: width * 0.8, lineHeight: 1 }}>
        {country.emoji}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flagUrl(country.code, width > 80 ? 320 : 160)}
      alt={`${country.name} flag`}
      width={width}
      style={{ width, height: "auto" }}
      className={`rounded-lg object-cover shadow-soft ring-1 ring-black/5 ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
