"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dices, RotateCcw } from "lucide-react";
import PageShell from "@/components/PageShell";
import Dice from "@/components/Dice";
import Flag from "@/components/Flag";
import Confetti from "@/components/Confetti";
import { Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { ensureCountry } from "@/lib/db";
import { COUNTRIES } from "@/data/countries";

const ROLL_MS = 2700;
const LEAVE_MS = 800;

function Roller() {
  const router = useRouter();
  const { user } = useAuth();
  const [phase, setPhase] = useState("idle"); // idle | rolling | leaving | revealed
  const [country, setCountry] = useState(null);
  const [spin, setSpin] = useState({ rx: 0, ry: 0 });
  const [starting, setStarting] = useState(false);
  const [rollCount, setRollCount] = useState(0);
  const last = useRef(null);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function roll() {
    if (phase !== "idle") return;
    // pick a random country from the database list (never the same one twice in a row)
    let pick;
    do {
      pick = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    } while (pick.id === last.current && COUNTRIES.length > 1);
    last.current = pick.id;

    setCountry(pick);
    setSpin({
      rx: 720 + 90 * Math.floor(Math.random() * 4),
      ry: 1080 + 90 * Math.floor(Math.random() * 4),
    });
    setRollCount((n) => n + 1);
    setPhase("rolling");
    timers.current.push(
      setTimeout(() => setPhase("leaving"), ROLL_MS + 350),
      setTimeout(() => setPhase("revealed"), ROLL_MS + 350 + LEAVE_MS)
    );
  }

  async function startResearch() {
    if (!country || starting) return;
    setStarting(true);
    try {
      await ensureCountry(user.uid, country);
    } catch (err) {
      console.error(err);
    }
    router.push(`/research/${country.id}`);
  }

  const showDice = phase !== "revealed";

  return (
    <div className="relative flex min-h-[calc(100vh-190px)] flex-col items-center justify-center overflow-hidden pb-6 pt-56 text-center">
      {showDice && (
        <>
          <Dice phase={phase} rx={spin.rx} ry={spin.ry} />
          <p className="font-display mt-16 text-sm font-extrabold tracking-[0.25em] text-ink-soft">ROLL A COUNTRY</p>
          <button onClick={roll} disabled={phase !== "idle"} className="btn btn-primary btn-lg mt-6 min-w-[200px]">
            <Dices className="h-5 w-5" /> Roll
          </button>
        </>
      )}

      {phase === "revealed" && country && (
        <div className="relative flex w-full flex-col items-center">
          <Confetti key={rollCount} />
          <div className="animate-pop">
            <Flag country={country} width={168} />
          </div>
          <h1 className="font-display animate-rise mt-8 text-5xl font-extrabold sm:text-7xl" style={{ animationDelay: ".15s" }}>
            {country.name}
          </h1>
          <div className="animate-rise mt-10 flex flex-col items-center gap-3" style={{ animationDelay: ".3s" }}>
            <button onClick={startResearch} disabled={starting} className="btn btn-success btn-lg min-w-[220px]">
              {starting && <Spinner className="h-5 w-5" />} Start Research
            </button>
            <button
              onClick={() => { setPhase("idle"); setCountry(null); }}
              disabled={starting}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-ink-soft hover:text-blue-700"
            >
              <RotateCcw className="h-4 w-4" /> Roll again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RollPage() {
  return (
    <PageShell width="max-w-3xl">
      <Roller />
    </PageShell>
  );
}
