import Logo from "./Logo";

export default function SetupNotice() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <Logo size={64} stacked />
      <div className="card mt-8 text-left">
        <h1 className="font-display text-xl font-bold">Connect Firebase to continue</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Uddesho can't find your Firebase settings. Add these environment variables (in <code>.env.local</code> for local use, or
          in Netlify under Site configuration &rarr; Environment variables), then rebuild:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-ink">
{`NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID`}
        </pre>
        <p className="mt-3 text-xs text-ink-faint">The README in the project folder has step-by-step instructions.</p>
      </div>
    </div>
  );
}
