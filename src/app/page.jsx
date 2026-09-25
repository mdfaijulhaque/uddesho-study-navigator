"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const signedIn = !loading && !!user;

  return (
    <div className="relative overflow-hidden">
      {/* the four bars of the logo, rising quietly behind the hero */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto flex max-w-3xl items-end justify-center gap-4 px-6 opacity-[.13]">
        <div className="h-28 w-1/5 rounded-t-[999px] bg-blue-600 sm:h-40" />
        <div className="h-40 w-1/5 rounded-t-[999px] bg-orange-500 sm:h-60" />
        <div className="h-52 w-1/5 rounded-t-[999px] bg-red-500 sm:h-80" />
        <div className="h-64 w-1/5 rounded-t-[999px] bg-mint-400 sm:h-[26rem]" />
      </div>

      <main className="relative mx-auto flex min-h-[calc(100vh-110px)] max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Uddesho logo" width={132} height={132} className="animate-pop h-28 w-28 object-contain sm:h-[132px] sm:w-[132px]" />

        <p className="font-display mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">UDDESHO</p>
        <p className="mt-1 text-sm font-semibold text-ink-soft">Study Navigator</p>

        <h1 className="font-display mt-10 max-w-2xl text-4xl font-extrabold leading-[1.08] sm:text-6xl">
          Your Journey Towards Global Education
        </h1>
        <p className="mt-5 max-w-lg text-lg text-ink-soft">Explore countries, research universities, and plan your future.</p>

        <div className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Link href={signedIn ? "/research" : "/login?mode=register"} className="btn btn-primary btn-lg w-full sm:w-auto">
            Start Your Journey
          </Link>
          {!signedIn && (
            <Link href="/login" className="btn btn-ghost btn-lg w-full sm:w-auto">
              Login
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
