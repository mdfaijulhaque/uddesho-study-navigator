"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { Eye, EyeOff, Mail, Lock, User as UserIcon } from "lucide-react";
import Logo from "@/components/Logo";
import SetupNotice from "@/components/SetupNotice";
import { ErrorNote, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

const friendly = (code) => {
  switch (code) {
    case "auth/invalid-email": return "That email address doesn't look right.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential": return "Email or password is incorrect.";
    case "auth/email-already-in-use": return "An account with this email already exists. Try logging in instead.";
    case "auth/weak-password": return "Choose a password with at least 6 characters.";
    case "auth/too-many-requests": return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed": return "Can't reach the network. Check your connection and try again.";
    case "auth/unauthorized-domain": return "This website address isn't authorised in Firebase yet. Add it under Authentication > Settings > Authorized domains.";
    case "auth/operation-not-allowed": return "This sign-in method isn't turned on in Firebase yet (Authentication > Sign-in method).";
    default: return "Something went wrong. Please try again.";
  }
};

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [mode, setMode] = useState("login"); // login | register
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "register") {
      setMode("register");
    }
  }, []);

  // Already signed in? Continue the journey.
  useEffect(() => {
    if (loading || !user) return;
    router.replace(profile?.profileComplete ? "/research" : "/profile");
  }, [user, profile, loading, router]);

  if (!isFirebaseConfigured) return <SetupNotice />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (mode === "register" && !name.trim()) return setError("Please tell us your name.");
    setBusy(true);
    try {
      if (mode === "register") {
        try { sessionStorage.setItem("uddesho_new_name", name.trim()); } catch {}
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      setError(friendly(err.code));
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setInfo("");
    setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") setError(friendly(err.code));
      setBusy(false);
    }
  }

  async function handleReset() {
    setError("");
    setInfo("");
    if (!email.trim()) return setError("Type your email above first, then tap “Forgot password?”.");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(friendly(err.code));
    }
  }

  const isRegister = mode === "register";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-110px)] max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 flex justify-center">
        <Logo size={48} />
      </div>

      <div className="card animate-rise !p-6 sm:!p-8">
        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm font-bold" role="tablist">
          {[
            ["login", "Login"],
            ["register", "Create account"],
          ].map(([m, label]) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => { setMode(m); setError(""); setInfo(""); }}
              className={`rounded-xl py-2.5 transition ${mode === m ? "bg-white text-blue-700 shadow-soft" : "text-ink-soft"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <h1 className="font-display text-2xl font-extrabold">{isRegister ? "Start your journey" : "Welcome back"}</h1>
        <p className="mb-6 mt-1 text-sm text-ink-soft">
          {isRegister ? "Create your private study workspace." : "Log in to continue your research."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <label className="block">
              <span className="label">Your name</span>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                <input className="input !pl-11" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Faijul Haque" autoComplete="name" required />
              </div>
            </label>
          )}
          <label className="block">
            <span className="label">Email</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input className="input !pl-11" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
            </div>
          </label>
          <label className="block">
            <span className="label">Password</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                className="input !pl-11 !pr-12"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegister ? "At least 6 characters" : "Your password"}
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={6}
                required
              />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-faint hover:text-ink" aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {!isRegister && (
            <div className="text-right">
              <button type="button" onClick={handleReset} className="text-xs font-bold text-blue-600 hover:underline">
                Forgot password?
              </button>
            </div>
          )}

          <ErrorNote>{error}</ErrorNote>
          {info && <p className="rounded-2xl bg-mint-50 px-4 py-3 text-sm font-semibold text-mint-800">{info}</p>}

          <button type="submit" disabled={busy} className="btn btn-primary w-full !py-3.5">
            {busy && <Spinner className="h-4 w-4" />}
            {isRegister ? "Create my account" : "Login"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs font-semibold text-ink-faint">
          <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
        </div>

        <button onClick={handleGoogle} disabled={busy} className="btn btn-ghost w-full !py-3.5">
          <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
          </svg>
          Continue with Google
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        <Link href="/" className="font-bold text-blue-600 hover:underline">Back to home</Link>
      </p>
    </div>
  );
}
