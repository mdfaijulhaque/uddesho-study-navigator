"use client";

import { Loader2, Star } from "lucide-react";

export function Spinner({ className = "" }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden />;
}

export function FullLoader({ label = "Loading your workspace..." }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-ink-soft">
      <Spinner className="h-8 w-8 text-blue-600" />
      <p className="text-sm font-semibold">{label}</p>
    </div>
  );
}

export function Input({ label, value, onChange, hint, className = "", ...rest }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      <input className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...rest} />
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

export function Textarea({ label, value, onChange, hint, className = "", ...rest }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      <textarea className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...rest} />
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

export function Select({ label, value, onChange, options, placeholder, className = "" }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      <select className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const v = typeof o === "string" ? o : o.value;
          const l = typeof o === "string" ? o : o.label;
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
    </label>
  );
}

// Coloured section header used inside forms
const TONES = {
  blue: "bg-blue-50 text-blue-700",
  mint: "bg-mint-100 text-mint-800",
  orange: "bg-orange-100 text-orange-700",
  red: "bg-red-100 text-red-600",
};
export function Section({ icon: Icon, title, subtitle, tone = "blue", children, className = "" }) {
  return (
    <section className={`card ${className}`}>
      <div className="mb-5 flex items-center gap-3">
        {Icon && (
          <span className={`grid h-10 w-10 place-items-center rounded-2xl ${TONES[tone]}`}>
            <Icon className="h-5 w-5" />
          </span>
        )}
        <div>
          <h2 className="font-display text-lg font-bold leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-ink-soft">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function StarRating({ value = 0, onChange, size = "h-6 w-6" }) {
  return (
    <div className="flex items-center gap-1" role={onChange ? "radiogroup" : "img"} aria-label={`Rating ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const star = <Star className={`${size} ${filled ? "fill-orange-500 text-orange-500" : "text-slate-300"}`} />;
        return onChange ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n === value ? 0 : n)}
            className="rounded-md transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}

const STATUS_STYLES = {
  Considering: "bg-blue-50 text-blue-700",
  Shortlisted: "bg-mint-100 text-mint-800",
  "Dream School": "bg-orange-100 text-orange-700",
  Applying: "bg-blue-100 text-blue-800",
  Dropped: "bg-red-100 text-red-600",
};
export function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_STYLES[status] || "bg-slate-100 text-ink-soft"}`}>{status || "Considering"}</span>;
}

export function ProgressRing({ value = 0, size = 96, stroke = 10, label = true }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF2F8" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={value >= 100 ? "#04E6B4" : "#086AFA"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * value) / 100}
          style={{ transition: "stroke-dashoffset .6s ease, stroke .3s" }}
        />
      </svg>
      {label && (
        <span className="font-display absolute inset-0 grid place-items-center text-lg font-extrabold">{value}%</span>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 px-6 py-12 text-center">
      {Icon && (
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon className="h-7 w-7" />
        </span>
      )}
      <h3 className="font-display text-lg font-bold">{title}</h3>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{children}</p>;
}
