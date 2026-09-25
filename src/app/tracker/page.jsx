"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { serverTimestamp, setDoc } from "firebase/firestore";
import { Award, CalendarClock, ChevronDown, ClipboardList, Dices, GraduationCap, Plus, Send, Trash2, Trophy } from "lucide-react";
import PageShell from "@/components/PageShell";
import Flag from "@/components/Flag";
import { EmptyState, FullLoader } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useUserCollection } from "@/lib/hooks";
import { DOC_CHECKLIST, STAGES, addToTracker, removeFromTracker, tsMillis, userSubDoc } from "@/lib/db";
import { getCountry } from "@/data/countries";

const STAGE_TONE = {
  Planning: { dot: "bg-slate-400", head: "text-ink-soft" },
  Preparing: { dot: "bg-orange-500", head: "text-orange-700" },
  Applied: { dot: "bg-blue-600", head: "text-blue-700" },
  Interview: { dot: "bg-blue-300", head: "text-blue-800" },
  Offer: { dot: "bg-mint-400", head: "text-mint-800" },
  Rejected: { dot: "bg-red-500", head: "text-red-600" },
};

// "2026-11-30" -> whole days from today (local time)
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function DaysBadge({ date }) {
  const n = daysUntil(date);
  if (n === null) return null;
  const tone = n < 0 ? "bg-slate-100 text-ink-faint" : n <= 7 ? "bg-red-100 text-red-600" : n <= 30 ? "bg-orange-100 text-orange-700" : "bg-mint-100 text-mint-800";
  const text = n < 0 ? `${Math.abs(n)}d ago` : n === 0 ? "Today" : `${n}d left`;
  return <span className={`badge whitespace-nowrap ${tone}`}>{text}</span>;
}

function AppCard({ app, uid }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(app.notes || "");
  const country = getCountry(app.countryId);
  const checklist = app.checklist || {};
  const done = DOC_CHECKLIST.filter((d) => checklist[d.id]).length;
  const pct = Math.round((done / DOC_CHECKLIST.length) * 100);

  const patch = (data) =>
    setDoc(userSubDoc(uid, "applications", app.id), { ...data, updatedAt: serverTimestamp() }, { merge: true }).catch((e) => console.error(e));

  return (
    <article className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-slate-100">
      <div className="flex items-start gap-3">
        {country && <Flag country={country} width={30} className="mt-0.5 shrink-0" />}
        <div className="min-w-0 flex-1">
          <Link href={`/research/${app.countryId}/universities/${app.universityId || app.id}`} className="block truncate font-bold hover:text-blue-700">
            {app.universityName}
          </Link>
          <p className="text-xs text-ink-soft">{app.countryName}</p>
        </div>
        <button onClick={() => { if (window.confirm(`Remove ${app.universityName} from your tracker? The university stays in your database.`)) removeFromTracker(uid, app.id); }} className="rounded-lg p-1.5 text-ink-faint transition hover:bg-red-50 hover:text-red-600" aria-label="Remove from tracker">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold text-ink-faint">Stage</span>
          <select className="input !rounded-xl !py-2 !text-xs" value={app.stage} onChange={(e) => patch({ stage: e.target.value })}>
            {STAGES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold text-ink-faint">Deadline</span>
          <input type="date" className="input !rounded-xl !py-2 !text-xs" value={app.deadline || ""} onChange={(e) => patch({ deadline: e.target.value })} />
        </label>
      </div>
      {app.deadline && <div className="mt-2"><DaysBadge date={app.deadline} /></div>}

      <button onClick={() => setOpen((o) => !o)} className="mt-3 flex w-full items-center gap-3 text-left" aria-expanded={open}>
        <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <span className={`block h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-mint-400" : "bg-blue-600"}`} style={{ width: `${pct}%` }} />
        </span>
        <span className="text-xs font-bold text-ink-soft">{done}/{DOC_CHECKLIST.length} documents</span>
        <ChevronDown className={`h-4 w-4 text-ink-faint transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <ul className="space-y-1">
            {DOC_CHECKLIST.map((d) => (
              <li key={d.id}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm hover:bg-slate-50">
                  <input type="checkbox" className="h-4 w-4 rounded accent-[#04E6B4]" checked={!!checklist[d.id]} onChange={() => patch({ checklist: { ...checklist, [d.id]: !checklist[d.id] } })} />
                  <span className={checklist[d.id] ? "text-ink-faint line-through" : ""}>{d.label}</span>
                </label>
              </li>
            ))}
          </ul>
          <textarea className="input !min-h-[72px] !rounded-xl !py-2 !text-xs" placeholder="Notes for this application" value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== (app.notes || "") && patch({ notes })} aria-label="Application notes" />
        </div>
      )}
    </article>
  );
}

function Tracker() {
  const { user } = useAuth();
  const apps = useUserCollection("applications");
  const unis = useUserCollection("universities");
  const schols = useUserCollection("scholarships");
  const [adding, setAdding] = useState(null);

  const trackedIds = useMemo(() => new Set(apps.items.map((a) => a.id)), [apps.items]);
  const untracked = unis.items.filter((u) => !trackedIds.has(u.id)).sort((a, b) => tsMillis(b.updatedAt) - tsMillis(a.updatedAt));

  const stats = {
    total: apps.items.length,
    applied: apps.items.filter((a) => ["Applied", "Interview", "Offer"].includes(a.stage)).length,
    offers: apps.items.filter((a) => a.stage === "Offer").length,
  };

  const deadlines = useMemo(() => {
    const rows = [
      ...apps.items.filter((a) => a.deadline && !["Applied", "Interview", "Offer", "Rejected"].includes(a.stage)).map((a) => ({ id: `a-${a.id}`, title: a.universityName, kind: "Application", date: a.deadline })),
      ...schols.items.filter((s) => s.deadline).map((s) => ({ id: `s-${s.id}`, title: `${s.name} (${s.universityName})`, kind: "Scholarship", date: s.deadline })),
    ];
    return rows.filter((r) => (daysUntil(r.date) ?? -1) >= 0).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  }, [apps.items, schols.items]);

  async function add(u) {
    setAdding(u.id);
    try { await addToTracker(user.uid, u); } catch (e) { console.error(e); alert("We couldn't add it. Try again."); }
    setAdding(null);
  }

  if (apps.loading || unis.loading) return <FullLoader label="Opening your tracker..." />;

  const nothingYet = unis.items.length === 0 && apps.items.length === 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Application tracker</h1>
        <p className="mt-1 text-ink-soft">Move each university from planning to offer, and never miss a deadline.</p>
      </div>

      {nothingYet ? (
        <EmptyState
          icon={ClipboardList}
          title="Nothing to track yet"
          text="Add universities to your research first. They'll show up here, ready to track."
          action={<Link href="/research" className="btn btn-primary"><Dices className="h-4 w-4" /> Go to my research</Link>}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Being tracked", value: stats.total, icon: ClipboardList, tone: "bg-blue-50 text-blue-700" },
              { label: "Applied", value: stats.applied, icon: Send, tone: "bg-orange-100 text-orange-700" },
              { label: "Offers", value: stats.offers, icon: Trophy, tone: "bg-mint-100 text-mint-800" },
            ].map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="card flex items-center gap-4 !p-5">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}><Icon className="h-6 w-6" /></span>
                <div>
                  <p className="font-display text-3xl font-extrabold leading-none">{value}</p>
                  <p className="mt-1 text-xs font-bold text-ink-soft">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card">
              <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-bold"><CalendarClock className="h-5 w-5 text-red-500" /> Upcoming deadlines</h2>
              {deadlines.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-ink-soft">No upcoming deadlines. Add a deadline to an application or a scholarship.</p>
              ) : (
                <ul className="space-y-2">
                  {deadlines.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                      {d.kind === "Scholarship" ? <Award className="h-4 w-4 shrink-0 text-mint-600" /> : <GraduationCap className="h-4 w-4 shrink-0 text-blue-600" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{d.title}</p>
                        <p className="text-xs text-ink-soft">{d.kind} &middot; {d.date}</p>
                      </div>
                      <DaysBadge date={d.date} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card">
              <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-bold"><Plus className="h-5 w-5 text-blue-600" /> Not tracked yet</h2>
              {untracked.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-ink-soft">Every university in your database is being tracked.</p>
              ) : (
                <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {untracked.map((u) => {
                    const c = getCountry(u.countryId);
                    return (
                      <li key={u.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                        {c && <Flag country={c} width={26} className="shrink-0" />}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{u.name}</p>
                          <p className="text-xs text-ink-soft">{u.countryName}</p>
                        </div>
                        <button onClick={() => add(u)} disabled={adding === u.id} className="btn btn-primary btn-sm">Track</button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <section>
            <h2 className="font-display mb-3 text-xl font-bold">Board</h2>
            <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
              {STAGES.map((stage) => {
                const items = apps.items.filter((a) => (a.stage || "Planning") === stage).sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"));
                const tone = STAGE_TONE[stage];
                return (
                  <div key={stage} className="w-[300px] shrink-0 snap-start rounded-3xl bg-slate-100/70 p-3">
                    <h3 className={`mb-3 flex items-center gap-2 px-2 text-sm font-extrabold ${tone.head}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} /> {stage}
                      <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs text-ink-soft">{items.length}</span>
                    </h3>
                    <div className="space-y-3">
                      {items.map((a) => <AppCard key={a.id} app={a} uid={user.uid} />)}
                      {items.length === 0 && <p className="rounded-2xl border-2 border-dashed border-slate-200 px-3 py-6 text-center text-xs font-semibold text-ink-faint">Nothing here</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function TrackerPage() {
  return (
    <PageShell>
      <Tracker />
    </PageShell>
  );
}
