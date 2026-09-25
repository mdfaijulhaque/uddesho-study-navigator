"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Award, Check, ClipboardList, ExternalLink, GraduationCap, LayoutGrid, MapPin, Pencil, Plus, Search, Table2, Trash2 } from "lucide-react";
import PageShell from "@/components/PageShell";
import Flag from "@/components/Flag";
import { EmptyState, FullLoader, StarRating, StatusBadge } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useUserCollection } from "@/lib/hooks";
import { DECISION_STATUSES, addToTracker, deleteUniversity, tsMillis } from "@/lib/db";
import { getCountry } from "@/data/countries";

const money = (cur, v) => (v ? `${cur || ""} ${v}`.trim() : "");
const dash = (v) => (v ? v : <span className="text-slate-300">-</span>);

function Database({ country }) {
  const { user } = useAuth();
  const unis = useUserCollection("universities");
  const apps = useUserCollection("applications");
  const [view, setView] = useState("cards");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [busyId, setBusyId] = useState(null);

  const base = `/research/${country.id}`;
  const trackedIds = useMemo(() => new Set(apps.items.map((a) => a.id)), [apps.items]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return unis.items
      .filter((u) => u.countryId === country.id)
      .filter((u) => status === "all" || u.status === status)
      .filter((u) => !q || [u.name, u.city, u.subject, u.department, u.degree].some((v) => (v || "").toLowerCase().includes(q)))
      .sort((a, b) => tsMillis(b.updatedAt) - tsMillis(a.updatedAt));
  }, [unis.items, country.id, query, status]);

  const total = unis.items.filter((u) => u.countryId === country.id).length;

  // every custom field name used in this country becomes an extra column in the sheet view
  const customColumns = useMemo(() => {
    const set = new Set();
    list.forEach((u) => (u.customFields || []).forEach((f) => f.label && set.add(f.label)));
    return Array.from(set).slice(0, 8);
  }, [list]);

  async function track(u) {
    setBusyId(u.id);
    try { await addToTracker(user.uid, u); } catch (e) { console.error(e); alert("We couldn't add it to the tracker. Try again."); }
    setBusyId(null);
  }
  async function remove(u) {
    if (!window.confirm(`Delete ${u.name}? This also removes it from your tracker.`)) return;
    setBusyId(u.id);
    try { await deleteUniversity(user.uid, u.id); } catch (e) { console.error(e); alert("We couldn't delete it. Try again."); }
    setBusyId(null);
  }

  return (
    <div className="space-y-6">
      <Link href={base} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-blue-700">
        <ArrowLeft className="h-4 w-4" /> {country.name} Research Hub
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Flag country={country} width={52} />
          <div>
            <h1 className="font-display text-3xl font-extrabold">University database</h1>
            <p className="text-sm text-ink-soft">{country.name} &middot; {total} {total === 1 ? "university" : "universities"}</p>
          </div>
        </div>
        <Link href={`${base}/universities/new`} className="btn btn-primary">
          <Plus className="h-4 w-4" /> Add University
        </Link>
      </div>

      {total > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input className="input !py-2.5 !pl-11" placeholder="Search universities" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search universities" />
          </div>
          <select className="input !w-auto !py-2.5" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="all">All statuses</option>
            {DECISION_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <div className="ml-auto flex rounded-2xl bg-slate-100 p-1" role="group" aria-label="View">
            {[["cards", LayoutGrid, "Cards"], ["table", Table2, "Sheet"]].map(([v, Icon, label]) => (
              <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${view === v ? "bg-white text-blue-700 shadow-soft" : "text-ink-soft"}`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {unis.loading ? (
        <FullLoader label="Loading universities..." />
      ) : total === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Your database is empty"
          text={`Add the first university you're curious about in ${country.name}. You choose what to record.`}
          action={<Link href={`${base}/universities/new`} className="btn btn-primary"><Plus className="h-4 w-4" /> Add University</Link>}
        />
      ) : list.length === 0 ? (
        <EmptyState icon={Search} title="No matches" text="Try a different search or status filter." />
      ) : view === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((u) => {
            const tracked = trackedIds.has(u.id);
            const cf = (u.customFields || []).filter((f) => f.label && f.value).slice(0, 3);
            return (
              <article key={u.id} className="card flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display truncate text-xl font-bold">{u.name}</h2>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
                      {u.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{u.city}</span>}
                      {u.ranking && <span>Rank {u.ranking}</span>}
                      {u.website && (
                        <a href={/^https?:\/\//.test(u.website) ? u.website : `https://${u.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-semibold text-blue-600 hover:underline">
                          Website <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={u.status} />
                </div>

                {(u.degree || u.subject) && (
                  <p className="text-sm font-semibold">{[u.degree, u.subject, u.department].filter(Boolean).join(" \u00b7 ")}</p>
                )}

                <dl className="grid grid-cols-3 gap-2 text-center">
                  {[["GPA", u.gpaReq], ["IELTS", u.ielts], ["Tuition", money(u.currency, u.tuitionFee)]].map(([k, v]) => (
                    <div key={k} className="rounded-2xl bg-slate-50 px-2 py-2.5">
                      <dt className="text-[11px] font-bold text-ink-faint">{k}</dt>
                      <dd className="mt-0.5 truncate text-sm font-bold">{dash(v)}</dd>
                    </div>
                  ))}
                </dl>

                {u.scholarshipName && (
                  <p className="flex items-center gap-2 rounded-2xl bg-mint-50 px-3 py-2 text-sm font-semibold text-mint-800">
                    <Award className="h-4 w-4 shrink-0" /> <span className="truncate">{u.scholarshipName}</span>
                    {u.scholarshipDeadline && <span className="ml-auto shrink-0 text-xs">by {u.scholarshipDeadline}</span>}
                  </p>
                )}

                {cf.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {cf.map((f) => (
                      <li key={f.id} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
                        {f.label}: <span className="font-bold">{f.value}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                  <StarRating value={u.rating || 0} size="h-4 w-4" />
                  <div className="flex items-center gap-2">
                    {tracked ? (
                      <Link href="/tracker" className="btn btn-sm bg-mint-100 text-mint-800"><Check className="h-4 w-4" /> In tracker</Link>
                    ) : (
                      <button onClick={() => track(u)} disabled={busyId === u.id} className="btn btn-ghost btn-sm"><ClipboardList className="h-4 w-4" /> Track</button>
                    )}
                    <Link href={`${base}/universities/${u.id}`} className="btn btn-primary btn-sm"><Pencil className="h-4 w-4" /> Edit</Link>
                    <button onClick={() => remove(u)} disabled={busyId === u.id} className="btn btn-danger btn-sm" aria-label={`Delete ${u.name}`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-white shadow-soft ring-1 ring-slate-100">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold text-ink-soft">
                {["University", "Program", "GPA", "IELTS", "SAT", "Tuition", "Living", "Scholarship", "Rating", "Status", ...customColumns].map((h, i) => (
                  <th key={h} className={`whitespace-nowrap px-4 py-3 ${i === 0 ? "sticky left-0 z-10 bg-slate-50" : ""} ${i >= 10 ? "text-blue-700" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 hover:bg-blue-50/40">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3">
                    <Link href={`${base}/universities/${u.id}`} className="font-bold text-blue-700 hover:underline">{u.name}</Link>
                    <div className="text-xs text-ink-faint">{u.city}</div>
                  </td>
                  <td className="px-4 py-3">{dash([u.degree, u.subject].filter(Boolean).join(" \u00b7 "))}</td>
                  <td className="px-4 py-3">{dash(u.gpaReq)}</td>
                  <td className="px-4 py-3">{dash(u.ielts)}</td>
                  <td className="px-4 py-3">{dash(u.sat)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{dash(money(u.currency, u.tuitionFee))}</td>
                  <td className="whitespace-nowrap px-4 py-3">{dash(money(u.currency, u.livingCost))}</td>
                  <td className="px-4 py-3">{dash(u.scholarshipName)}</td>
                  <td className="px-4 py-3"><StarRating value={u.rating || 0} size="h-3.5 w-3.5" /></td>
                  <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  {customColumns.map((label) => (
                    <td key={label} className="px-4 py-3">{dash((u.customFields || []).find((f) => f.label === label)?.value)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Inner() {
  const { countryId } = useParams();
  const country = getCountry(countryId);
  if (!country) return <EmptyState title="Country not found" action={<Link href="/research" className="btn btn-primary">My research</Link>} />;
  return <Database country={country} />;
}

export default function UniversityDatabasePage() {
  return (
    <PageShell>
      <Inner />
    </PageShell>
  );
}
