"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { ArrowLeft, BookOpen, Check, Copy, ExternalLink, GraduationCap, ShieldCheck } from "lucide-react";
import PageShell from "@/components/PageShell";
import Flag from "@/components/Flag";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { newId, saveUniversity } from "@/lib/db";
import { getCountry } from "@/data/countries";

const show = (v) => v !== undefined && v !== null && String(v).trim() !== "";

function Info({ label, value }) {
  if (!show(value)) return null;
  return (
    <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-100">
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{String(value)}</p>
    </div>
  );
}

export default function CommunityResearchDetail() {
  const { researchId } = useParams();
  const id = Array.isArray(researchId) ? researchId[0] : researchId;
  const { user } = useAuth();

  const [research, setResearch] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState("");
  const [copied, setCopied] = useState({});

  useEffect(() => {
    if (!id || !db) return undefined;
    const ref = doc(db, "publicResearch", id);
    const unsubResearch = onSnapshot(
      ref,
      (snap) => {
        setResearch(snap.exists() ? { id: snap.id, ...snap.data({ serverTimestamps: "estimate" }) } : null);
        setLoading(false);
      },
      () => setLoading(false)
    );
    const unsubUnis = onSnapshot(collection(ref, "universities"), (snap) => {
      setUniversities(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) })));
    });
    return () => {
      unsubResearch();
      unsubUnis();
    };
  }, [id]);

  const country = useMemo(() => getCountry(research?.countryId), [research?.countryId]);

  async function copyOne(uni) {
    if (!user || !country) return;
    setCopying(uni.id);
    try {
      const privateId = newId(user.uid, "universities");
      const { ownerUid, sourceUniversityId, updatedAt, ...data } = uni;
      await saveUniversity(user.uid, privateId, data, country, true);
      setCopied((x) => ({ ...x, [uni.id]: true }));
    } catch (e) {
      console.error(e);
      window.alert(`Could not copy university: ${e?.message || "Unknown error"}`);
    } finally {
      setCopying("");
    }
  }

  async function copyAll() {
    if (!user || !country || universities.length === 0) return;
    const ok = window.confirm(`Copy ${universities.length} ${country.name} universities into your private research workspace?`);
    if (!ok) return;
    setCopying("all");
    try {
      for (const uni of universities) {
        const privateId = newId(user.uid, "universities");
        const { ownerUid, sourceUniversityId, updatedAt, ...data } = uni;
        await saveUniversity(user.uid, privateId, data, country, true);
      }
      setCopied(Object.fromEntries(universities.map((u) => [u.id, true])));
      window.alert("Research copied to your private workspace.");
    } catch (e) {
      console.error(e);
      window.alert(`Copy stopped: ${e?.message || "Unknown error"}`);
    } finally {
      setCopying("");
    }
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <Link href="/community" className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-blue-700">
          <ArrowLeft className="h-4 w-4" /> Community
        </Link>

        {loading ? (
          <div className="card py-16 text-center text-sm font-semibold text-ink-soft">Loading community research...</div>
        ) : !research || !country ? (
          <div className="card py-16 text-center">
            <h1 className="font-display text-2xl font-bold">Research not found</h1>
            <p className="mt-2 text-sm text-ink-soft">It may have been unpublished by its owner.</p>
          </div>
        ) : (
          <>
            <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-600 via-blue-500 to-mint-400 p-7 text-white shadow-lift sm:p-9">
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-orange-400/30 blur-2xl" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                <Flag country={country} width={86} />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold text-white/90">
                    <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">Student-shared research</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">
                      <ShieldCheck className="h-3.5 w-3.5" /> Private profile not shared
                    </span>
                  </div>
                  <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{research.title || `${country.name} Research`}</h1>
                  <p className="mt-2 text-sm text-white/90">Shared by {research.anonymous ? "Anonymous Student" : research.authorName || "Uddesho Student"}</p>
                </div>
                <button onClick={copyAll} disabled={copying === "all" || universities.length === 0} className="btn bg-white text-blue-700 shadow-soft hover:-translate-y-0.5">
                  <Copy className="h-4 w-4" /> {copying === "all" ? "Copying..." : "Copy all to My Research"}
                </button>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold">Universities</h2>
                <p className="text-sm text-ink-soft">Check the official university source before applying; community research can become outdated.</p>
              </div>
              <span className="badge bg-orange-100 text-orange-700"><BookOpen className="h-3.5 w-3.5" /> {universities.length} shared</span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {universities.map((uni) => (
                <article key={uni.id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-xl font-bold">{uni.name || "University"}</h3>
                      <p className="mt-1 text-sm text-ink-soft">{[uni.city, uni.subject, uni.degree].filter(Boolean).join(" · ") || country.name}</p>
                    </div>
                    <GraduationCap className="h-6 w-6 shrink-0 text-blue-600" />
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <Info label="Ranking" value={uni.ranking} />
                    <Info label="IELTS" value={uni.ielts} />
                    <Info label="SAT" value={uni.sat} />
                    <Info label="GPA requirement" value={uni.gpaReq} />
                    <Info label="Application fee" value={uni.applicationFee ? `${uni.currency || ""} ${uni.applicationFee}` : ""} />
                    <Info label="Tuition" value={uni.tuitionFee ? `${uni.currency || ""} ${uni.tuitionFee}` : ""} />
                    <Info label="Living cost" value={uni.livingCost ? `${uni.currency || ""} ${uni.livingCost}` : ""} />
                    <Info label="Scholarship" value={uni.scholarshipName} />
                    <Info label="Scholarship amount" value={uni.scholarshipAmount} />
                    <Info label="Scholarship deadline" value={uni.scholarshipDeadline} />
                    <Info label="Language" value={uni.language} />
                    <Info label="Duration" value={uni.duration} />
                  </div>

                  {Array.isArray(uni.customFields) && uni.customFields.length > 0 && (
                    <div className="mt-4 rounded-2xl bg-mint-50 p-4">
                      <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-mint-800">Student research details</p>
                      <div className="space-y-2">
                        {uni.customFields.slice(0, 100).map((f, i) => (
                          <div key={`${f?.label || f?.name || "field"}-${i}`} className="text-sm">
                            <span className="font-bold">{f?.label || f?.name || "Detail"}: </span>
                            <span className="text-ink-soft">{String(f?.value ?? "")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {uni.website && (
                      <a href={uni.website} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                        Official website <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button onClick={() => copyOne(uni)} disabled={copying === uni.id || copied[uni.id]} className="btn btn-success btn-sm">
                      {copied[uni.id] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied[uni.id] ? "Copied" : copying === uni.id ? "Copying..." : "Copy to My Research"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
