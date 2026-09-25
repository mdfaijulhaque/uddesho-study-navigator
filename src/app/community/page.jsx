"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Globe2, Search, Users, BookOpen, Copy } from "lucide-react";
import PageShell from "@/components/PageShell";
import Flag from "@/components/Flag";
import { db } from "@/lib/firebase";
import { getCountry } from "@/data/countries";

export default function CommunityPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "publicResearch"), orderBy("updatedAt", "desc"));
    return onSnapshot(
      q,
      (snap) => {
        setItems(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data({ serverTimestamps: "estimate" }),
          }))
        );
      },
      (err) => console.error(err)
    );
  }, []);

  const filtered = items.filter((item) => {
    const text = `${item.countryName || ""} ${item.title || ""} ${item.authorName || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <PageShell>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-600 via-blue-500 to-mint-400 p-7 text-white shadow-lift sm:p-10">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-orange-400/30 blur-2xl" />
          <div className="absolute -bottom-14 left-1/3 h-40 w-40 rounded-full bg-red-400/25 blur-2xl" />

          <div className="relative max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur">
              <Users className="h-4 w-4" />
              Student-powered research
            </div>

            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
              Uddesho Community Research
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/90 sm:text-base">
              Learn from research shared by other students, then copy useful information into your own private workspace.
            </p>
          </div>
        </section>

        <section>
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
            <input
              className="input !pl-12"
              placeholder="Search country, research or student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </section>

        {filtered.length === 0 ? (
          <div className="card py-14 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-100 to-mint-100 text-blue-700">
              <Globe2 className="h-7 w-7" />
            </div>
            <h2 className="font-display mt-4 text-xl font-bold">
              No public research yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
              When students publish country research, it will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => {
              const country = getCountry(item.countryId);

              return (
                <Link
                  key={item.id}
                  href={`/community/${item.id}`}
                  className="card group transition hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {country && <Flag country={country} width={46} />}
                      <div>
                        <h2 className="font-display text-lg font-bold">
                          {item.countryName || country?.name || "Research"}
                        </h2>
                        <p className="text-xs text-ink-soft">
                          {item.anonymous ? "Anonymous Student" : item.authorName || "Uddesho Student"}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-mint-100 px-2.5 py-1 text-[11px] font-bold text-mint-800">
                      Public
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-2 text-sm text-ink-soft">
                    {item.description || "Student-shared university and country research."}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-blue-50 p-3">
                      <BookOpen className="mb-1 h-4 w-4 text-blue-600" />
                      <p className="text-xs font-bold text-ink-faint">Universities</p>
                      <p className="font-display text-lg font-bold text-blue-700">
                        {item.universityCount || 0}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-orange-50 p-3">
                      <Copy className="mb-1 h-4 w-4 text-orange-600" />
                      <p className="text-xs font-bold text-ink-faint">Copies</p>
                      <p className="font-display text-lg font-bold text-orange-700">
                        {item.copyCount || 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 text-sm font-bold text-blue-700 group-hover:underline">
                    View research →
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
