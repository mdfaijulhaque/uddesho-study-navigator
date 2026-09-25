"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dices, GraduationCap, Plus } from "lucide-react";
import PageShell from "@/components/PageShell";
import Flag from "@/components/Flag";
import { FullLoader } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useUserCollection } from "@/lib/hooks";
import { computeProgress, tsMillis } from "@/lib/db";
import { getCountry } from "@/data/countries";

function Overview() {
  const router = useRouter();
  const { profile } = useAuth();
  const countries = useUserCollection("countries");
  const unis = useUserCollection("universities");

  // First time here with no countries? Go and roll one.
  useEffect(() => {
    if (!countries.loading && !countries.error && countries.items.length === 0) router.replace("/roll");
  }, [countries.loading, countries.error, countries.items.length, router]);

  if (countries.loading || unis.loading) return <FullLoader label="Opening your research..." />;

  const started = countries.items
    .map((c) => ({ ...c, data: getCountry(c.countryId || c.id) }))
    .filter((c) => c.data)
    .sort((a, b) => tsMillis(b.updatedAt) - tsMillis(a.updatedAt));

  const startedIds = new Set(started.map((c) => c.data.id));
  const suggestions = (profile?.study?.preferredCountries || []).filter((id) => !startedIds.has(id)).map(getCountry).filter(Boolean);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Hi {(profile?.name || "there").split(" ")[0]}, here's your research</h1>
          <p className="mt-1 text-ink-soft">Pick a country to continue, or roll a new one.</p>
        </div>
        <Link href="/roll" className="btn btn-primary">
          <Dices className="h-4 w-4" /> Roll a new country
        </Link>
      </div>

      {countries.error && (
        <p className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          We couldn't load your countries. Check that the Firestore rules from the project are published.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {started.map(({ data, ...c }) => {
          const uniCount = unis.items.filter((u) => u.countryId === data.id).length;
          const progress = computeProgress(c.checklist, uniCount);
          return (
            <Link key={data.id} href={`/research/${data.id}`} className="card group flex flex-col gap-5 transition hover:-translate-y-1 hover:shadow-lift">
              <div className="flex items-center gap-4">
                <Flag country={data} width={56} />
                <div className="min-w-0">
                  <h2 className="font-display truncate text-xl font-bold">{data.name}</h2>
                  <p className="flex items-center gap-1.5 text-sm text-ink-soft">
                    <GraduationCap className="h-4 w-4" /> {uniCount} {uniCount === 1 ? "university" : "universities"}
                  </p>
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-xs font-bold">
                  <span className="text-ink-soft">Research progress</span>
                  <span className={progress >= 100 ? "text-mint-700" : "text-blue-700"}>{progress}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full transition-all duration-700 ${progress >= 100 ? "bg-mint-400" : "bg-blue-600"}`} style={{ width: `${progress}%` }} />
                </div>
              </div>
            </Link>
          );
        })}

        <Link href="/roll" className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-200 p-6 text-ink-soft transition hover:border-blue-300 hover:text-blue-700">
          <Plus className="h-7 w-7" />
          <span className="text-sm font-bold">Discover another country</span>
        </Link>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-lg font-bold">From your preferred countries</h2>
          <p className="mb-3 text-sm text-ink-soft">You haven't started these yet.</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((c) => (
              <Link key={c.id} href={`/research/${c.id}`} className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 text-sm font-bold ring-1 ring-inset ring-slate-200 transition hover:ring-blue-300">
                <Flag country={c} width={24} className="!rounded-full !shadow-none" />
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResearchIndexPage() {
  return (
    <PageShell>
      <Overview />
    </PageShell>
  );
}
