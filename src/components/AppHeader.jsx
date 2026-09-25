"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Dices, Globe, LogOut, User, UsersRound } from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "@/lib/auth-context";

const LINKS = [
  { href: "/research", label: "My Research", icon: Globe },
  { href: "/roll", label: "Roll", icon: Dices },
  { href: "/community", label: "Community", icon: UsersRound },
  { href: "/tracker", label: "Tracker", icon: ClipboardList },
  { href: "/profile", label: "Profile", icon: User, mobileOnly: true },
];

export default function AppHeader() {
  const pathname = usePathname() || "";
  const { user, profile, logout } = useAuth();
  const name = profile?.name || user?.displayName || "Student";
  const photo = profile?.photoURL || user?.photoURL;

  const active = (href) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo size={34} href="/research" />

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {LINKS.filter((l) => !l.mobileOnly).map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                  active(href) ? "bg-blue-50 text-blue-700" : "text-ink-soft hover:bg-slate-50 hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/profile" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition hover:bg-slate-50" aria-label="Edit profile">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-white" />
              ) : (
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-mint-400 text-xs font-extrabold text-white">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="hidden max-w-[120px] truncate text-sm font-bold sm:block">{name.split(" ")[0]}</span>
            </Link>
            <button onClick={logout} className="btn btn-ghost btn-sm" aria-label="Log out">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-100 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="Main">
        <ul className="mx-auto flex max-w-md justify-around px-2 py-1.5">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-[11px] font-bold ${
                  active(href) ? "text-blue-700" : "text-ink-faint"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
