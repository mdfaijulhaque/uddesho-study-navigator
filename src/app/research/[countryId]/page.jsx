"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, doc, getDocs, onSnapshot, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import {
  ArrowLeft, Check, ClipboardList, Coins, GraduationCap, Landmark, Languages, NotebookPen, Plane, Plus, Share2, Table2, Wallet,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import Flag from "@/components/Flag";
import { EmptyState, ProgressRing, StatusBadge } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useUserCollection } from "@/lib/hooks";
import { CHECKLIST, computeProgress, ensureCountry, userSubDoc } from "@/lib/db";
import { db } from "@/lib/firebase";
import { getCountry } from "@/data/countries";

const INFO = [
  { key: "capital", label: "Capital", icon: Landmark, tone: "bg-blue-50 text-blue-700" },
  { key: "currency", label: "Currency", icon: Coins, tone: "bg-orange-100 text-orange-700" },
  { key: "language", label: "Language", icon: Languages, tone: "bg-mint-100 text-mint-800" },
  { key: "education", label: "Education system", icon: GraduationCap, tone: "bg-blue-50 text-blue-700" },
  { key: "visa", label: "Visa", icon: Plane, tone: "bg-red-100 text-red-600" },
  { key: "livingCost", label: "Living cost", icon: Wallet, tone: "bg-orange-100 text-orange-700" },
];

const message = (p) =>
  p === 0 ? "Let's get started."
  : p < 50 ? "Good start. Keep going."
  : p < 100 ? "Almost there."
  : "Research complete. Time to plan your applications.";

function Hub({ country }) {
  const { user, profile } = useAuth();
  const uid = user.uid;
  const countryRef = userSubDoc(uid, "countries", country.id);

  const unis = useUserCollection("universities");
  const myUnis = unis.items.filter((u) => u.countryId === country.id);

  const [checklist, setChecklist] = useState({});
  const [notes, setNotes] = useState("");
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error
  const [publishState, setPublishState] = useState("idle"); // idle | publishing | published | error
  const notesLoaded = useRef(false);
  const timer = useRef(null);
  const pending = useRef(null);

  useEffect(() => {
    ensureCountry(uid, country).catch((e) => console.error(e));
    const unsub = onSnapshot(
      userSubDoc(uid, "countries", country.id),
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        setChecklist(d.checklist || {});
        if (!notesLoaded.current) {
          setNotes(d.notes || "");
          notesLoaded.current = true;
        }
      },
      (e) => console.error(e)
    );
    return unsub;
  }, [uid, country]);

  // Save any unsaved note when leaving the page
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (pending.current !== null) {
        setDoc(userSubDoc(uid, "countries", country.id), { notes: pending.current, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
      }
    },
    [uid, country.id]
  );

  function onNotes(value) {
    setNotes(value);
    setSaveState("saving");
    pending.current = value;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await setDoc(countryRef, { notes: value, updatedAt: serverTimestamp() }, { merge: true });
        pending.current = null;
        setSaveState("saved");
      } catch (e) {
        console.error(e);
        setSaveState("error");
      }
    }, 800);
  }

  async function toggle(id) {
    const next = { ...checklist, [id]: !checklist[id] };
    setChecklist(next);
    try {
      await setDoc(countryRef, { checklist: next, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  }

  async function publishResearch() {
    if (!myUnis.length) {
      window.alert("Add at least one university before publishing your research.");
      return;
    }

    const ok = window.confirm(
      `Publish your ${country.name} university research to the Uddesho Community?\n\nYour profile, academic results, personal country notes, application tracker and documents will NOT be shared. University custom fields will be included.`
    );
    if (!ok) return;

    setPublishState("publishing");
    try {
      const researchId = `${uid}_${country.id}`;
      const publicRef = doc(db, "publicResearch", researchId);
      const existing = await getDocs(collection(publicRef, "universities"));
      const batch = writeBatch(db);

      // Remove the previous published university snapshot so re-publishing is always current.
      existing.forEach((d) => batch.delete(d.ref));

      const safeUniversity = (u) => ({
        ownerUid: uid,
        sourceUniversityId: u.id,
        name: u.name || "",
        city: u.city || "",
        website: u.website || "",
        ranking: u.ranking || "",
        degree: u.degree || "",
        subject: u.subject || "",
        department: u.department || "",
        language: u.language || "",
        duration: u.duration || "",
        gpaReq: u.gpaReq || "",
        ielts: u.ielts || "",
        sat: u.sat || "",
        entranceExam: u.entranceExam || "",
        currency: u.currency || "USD",
        applicationFee: u.applicationFee || "",
        tuitionFee: u.tuitionFee || "",
        livingCost: u.livingCost || "",
        scholarshipName: u.scholarshipName || "",
        scholarshipAmount: u.scholarshipAmount || "",
        scholarshipEligibility: u.scholarshipEligibility || "",
        scholarshipDeadline: u.scholarshipDeadline || "",
        customFields: Array.isArray(u.customFields) ? u.customFields : [],
        countryId: country.id,
        countryName: country.name,
        countryCode: country.code,
        updatedAt: serverTimestamp(),
      });

      batch.set(
        publicRef,
        {
          ownerUid: uid,
          countryId: country.id,
          countryName: country.name,
          countryCode: country.code,
          title: `${country.name} Study Research`,
          authorName: (profile?.name || user.displayName || "Uddesho Student").trim().split(/\s+/)[0],
          anonymous: false,
          allowCopy: true,
          description: `${myUnis.length} university${myUnis.length === 1 ? "" : "ies"} researched for ${country.name}.`,
          universityCount: myUnis.length,
          copyCount: 0,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      myUnis.forEach((u) => {
        batch.set(doc(publicRef, "universities", u.id), safeUniversity(u));
      });

      await batch.commit();
      setPublishState("published");
      window.alert("Published to Uddesho Community.");
    } catch (e) {
      console.error("Could not publish research", e);
      setPublishState("error");
      window.alert(`Could not publish: ${e?.message || "Unknown error"}`);
    }
  }

  const progress = computeProgress(checklist, myUnis.length);
  const base = `/research/${country.id}`;

  return (
    <div className="space-y-6">
      <Link href="/research" className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-blue-700">
        <ArrowLeft className="h-4 w-4" /> My research
      </Link>

      {/* header */}
      <div className="card flex flex-col gap-6 sm:flex-row sm:items-center">
        <Flag country={country} width={96} />
        <div className="flex-1">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{country.name} Research Hub</h1>
          <p className="mt-1 text-ink-soft">{message(progress)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`${base}/universities/new`} className="btn btn-primary">
              <Plus className="h-4 w-4" /> Add University
            </Link>
            <Link href={`${base}/universities`} className="btn btn-ghost">
              <Table2 className="h-4 w-4" /> University database
            </Link>
            <button
              type="button"
              onClick={publishResearch}
              disabled={publishState === "publishing" || myUnis.length === 0}
              className="btn btn-success"
              title={myUnis.length === 0 ? "Add a university first" : "Share university research with the Uddesho Community"}
            >
              <Share2 className="h-4 w-4" />
              {publishState === "publishing" ? "Publishing..." : publishState === "published" ? "Published" : "Publish Research"}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:flex-col sm:gap-1">
          <ProgressRing value={progress} size={104} />
          <span className="text-xs font-bold text-ink-soft">Research progress</span>
        </div>
      </div>

      {/* country information */}
      <div>
        <h2 className="font-display mb-3 text-xl font-bold">Country information</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INFO.map(({ key, label, icon: Icon, tone }) => (
            <div key={key} className="card !p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <h3 className="text-sm font-bold text-ink-soft">{label}</h3>
              </div>
              <p className={`leading-relaxed ${key === "capital" || key === "currency" ? "font-display text-xl font-bold" : "text-sm"}`}>{country[key]}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-faint">A general guide only. Always confirm rules and costs on official government and university websites.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* progress checklist */}
        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Research checklist</h2>
            <span className={`badge ${progress >= 100 ? "bg-mint-100 text-mint-800" : "bg-blue-50 text-blue-700"}`}>{progress}%</span>
          </div>
          <div className="mb-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full transition-all duration-700 ${progress >= 100 ? "bg-mint-400" : "bg-blue-600"}`} style={{ width: `${progress}%` }} />
          </div>
          <ul className="space-y-2">
            {CHECKLIST.map((item) => {
              const done = item.auto ? myUnis.length >= 3 : !!checklist[item.id];
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => !item.auto && toggle(item.id)}
                    disabled={item.auto}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                      done ? "bg-mint-50 text-mint-800" : "hover:bg-slate-50"
                    } ${item.auto ? "cursor-default" : ""}`}
                    aria-pressed={done}
                  >
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg ring-2 transition ${done ? "bg-mint-400 text-ink ring-mint-400" : "bg-white ring-slate-200"}`}>
                      {done && <Check className="h-4 w-4" strokeWidth={3} />}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.auto && <span className="text-xs font-bold text-ink-faint">{Math.min(myUnis.length, 3)}/3</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* personal notes */}
        <section className="card flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display flex items-center gap-2 text-lg font-bold">
              <NotebookPen className="h-5 w-5 text-orange-500" /> Personal notes
            </h2>
            <span className={`text-xs font-bold ${saveState === "error" ? "text-red-600" : "text-ink-faint"}`}>
              {saveState === "saving" && "Saving..."}
              {saveState === "saved" && "Saved"}
              {saveState === "error" && "Couldn't save"}
            </span>
          </div>
          <textarea
            className="input min-h-[240px] flex-1"
            value={notes}
            onChange={(e) => onNotes(e.target.value)}
            placeholder={`What have you learned about ${country.name}? Deadlines, questions, links, things to ask a university...`}
          />
        </section>
      </div>

      {/* universities */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">Universities in {country.name}</h2>
          {myUnis.length > 0 && (
            <Link href={`${base}/universities`} className="text-sm font-bold text-blue-600 hover:underline">
              Open database
            </Link>
          )}
        </div>
        {myUnis.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No universities yet"
            text="Found a university that looks interesting? Add it and keep every detail in one place."
            action={
              <Link href={`${base}/universities/new`} className="btn btn-primary">
                <Plus className="h-4 w-4" /> Add University
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myUnis.slice(0, 6).map((u) => (
              <Link key={u.id} href={`${base}/universities/${u.id}`} className="card flex items-center justify-between gap-3 !p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
                <div className="min-w-0">
                  <p className="truncate font-bold">{u.name}</p>
                  <p className="truncate text-xs text-ink-soft">{[u.city, u.subject].filter(Boolean).join(" - ") || "Tap to add details"}</p>
                </div>
                <StatusBadge status={u.status} />
              </Link>
            ))}
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <Link href="/tracker" className="btn btn-ghost btn-sm">
            <ClipboardList className="h-4 w-4" /> Go to application tracker
          </Link>
        </div>
      </section>
    </div>
  );
}

function CountryPage() {
  const { countryId } = useParams();
  const country = getCountry(Array.isArray(countryId) ? countryId[0] : countryId);

  if (!country) {
    return (
      <EmptyState
        title="We couldn't find that country"
        text="Roll the dice to discover one."
        action={
          <Link href="/roll" className="btn btn-primary">
            Roll a country
          </Link>
        }
      />
    );
  }
  return <Hub country={country} />;
}

export default function CountryResearchPage() {
  return (
    <PageShell>
      <CountryPage />
    </PageShell>
  );
}
