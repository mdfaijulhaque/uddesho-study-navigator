import Link from "next/link";

// The Uddesho mark (public/logo.png) with the UDDESHO wordmark.
export default function Logo({ size = 40, text = true, subtitle = true, href = "/", stacked = false, className = "" }) {
  const inner = (
    <span className={`inline-flex items-center gap-3 ${stacked ? "flex-col text-center" : ""} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Uddesho logo" width={size} height={size} style={{ width: size, height: size }} className="shrink-0 object-contain" />
      {text && (
        <span className="leading-none">
          <span className="font-display block text-xl font-extrabold tracking-tight text-ink" style={stacked ? { fontSize: size * 0.5 } : undefined}>
            UDDESHO
          </span>
          {subtitle && <span className="mt-1 block text-xs font-semibold text-ink-soft">Study Navigator</span>}
        </span>
      )}
    </span>
  );
  return href ? (
    <Link href={href} aria-label="Uddesho home">
      {inner}
    </Link>
  ) : (
    inner
  );
}
