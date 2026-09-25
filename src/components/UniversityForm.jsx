"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDoc } from "firebase/firestore";
import { ArrowLeft, Award, BookOpen, Coins, GraduationCap, ListPlus, MessageSquareText, Plus, Save, School, Trash2, X } from "lucide-react";
import Flag from "./Flag";
import { ErrorNote, FullLoader, Input, Section, Select, Spinner, StarRating, Textarea } from "./ui";
import { useAuth } from "@/lib/auth-context";
import { DECISION_STATUSES, deleteUniversity, emptyUniversity, newId, saveUniversity, userSubDoc } from "@/lib/db";
import { CURRENCY_CODES } from "@/data/countries";

const DEGREES = ["Diploma / Foundation", "Bachelor's", "Master's", "PhD"];
const SUGGESTED_FIELDS = [
  "Professor contact", "Research area", "Application portal", "Housing options", "Campus size",
  "Intake months", "Part-time work rules", "Alumni contact",
];

const uid8 = () => Math.random().toString(36).slice(2, 10);

export default function UniversityForm({ country, uniId }) {
  const router = useRouter();
  const { user } = useAuth();
  const isNew = !uniId;
  const backHref = `/research/${country.id}/universities`;

  const [form, setForm] = useState({ ...emptyUniversity, currency: country.currencyCode });
  const [loading, setLoading] = useState(!isNew);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(userSubDoc(user.uid, "universities", uniId));
        if (cancelled) return;
        if (!snap.exists()) return setNotFound(true);
        const d = snap.data();
        setForm({
          ...emptyUniversity,
          ...Object.fromEntries(Object.keys(emptyUniversity).map((k) => [k, d[k] ?? emptyUniversity[k]])),
          customFields: (d.customFields || []).map((f) => ({ id: f.id || uid8(), label: f.label || "", value: f.value || "" })),
        });
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("We couldn't load this university.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isNew, uniId, user.uid]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  // ----- custom fields -----
  const addField = (label = "") => setForm((f) => ({ ...f, customFields: [...f.customFields, { id: uid8(), label, value: "" }] }));
  const updateField = (id, patch) => setForm((f) => ({ ...f, customFields: f.customFields.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const removeField = (id) => setForm((f) => ({ ...f, customFields: f.customFields.filter((c) => c.id !== id) }));

  async function save(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Please enter the university name.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = Object.fromEntries(Object.keys(emptyUniversity).map((k) => [k, form[k]]));
      data.name = form.name.trim();
      data.customFields = form.customFields
        .filter((f) => f.label.trim() || f.value.trim())
        .map((f) => ({ id: f.id, label: f.label.trim(), value: f.value }));
      const id = uniId || newId(user.uid, "universities");
      await saveUniversity(user.uid, id, data, country, isNew);
      router.push(backHref);
    } catch (err) {
      console.error(err);
      setError(err?.code === "permission-denied" ? "Firebase blocked this save. Publish the Firestore rules from firestore.rules and try again." : "We couldn't save. Check your connection and try again.");
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete ${form.name || "this university"}? This also removes it from your tracker.`)) return;
    setSaving(true);
    try {
      await deleteUniversity(user.uid, uniId);
      router.push(backHref);
    } catch (err) {
      console.error(err);
      setError("We couldn't delete it. Try again.");
      setSaving(false);
    }
  }

  if (loading) return <FullLoader label="Opening university..." />;
  if (notFound) {
    return (
      <div className="card text-center">
        <h1 className="font-display text-xl font-bold">This university doesn't exist</h1>
        <Link href={backHref} className="btn btn-primary mt-4">Back to database</Link>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl space-y-5">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-blue-700">
        <ArrowLeft className="h-4 w-4" /> University database
      </Link>

      <div className="flex items-center gap-4">
        <Flag country={country} width={52} />
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{isNew ? `Add a university in ${country.name}` : form.name || "Edit university"}</h1>
          <p className="text-sm text-ink-soft">Fill in what you know. Everything can be changed later.</p>
        </div>
      </div>

      <ErrorNote>{error}</ErrorNote>

      <Section icon={School} tone="blue" title="The university">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input className="sm:col-span-2" label="University name *" value={form.name} onChange={set("name")} placeholder="e.g. University of Tokyo" autoFocus={isNew} />
          <Input label="City" value={form.city} onChange={set("city")} placeholder="e.g. Tokyo" />
          <Input label="Ranking" value={form.ranking} onChange={set("ranking")} placeholder="e.g. QS #28" />
          <Input className="sm:col-span-2" label="Website" value={form.website} onChange={set("website")} placeholder="https://..." type="url" />
        </div>
      </Section>

      <Section icon={BookOpen} tone="orange" title="Program">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Degree" value={form.degree} onChange={set("degree")} options={DEGREES} placeholder="Choose one" />
          <Input label="Subject" value={form.subject} onChange={set("subject")} placeholder="e.g. Computer Science" />
          <Input label="Department" value={form.department} onChange={set("department")} placeholder="e.g. Faculty of Engineering" />
          <Input label="Language" value={form.language} onChange={set("language")} placeholder="e.g. English" />
          <Input label="Duration" value={form.duration} onChange={set("duration")} placeholder="e.g. 2 years" />
        </div>
      </Section>

      <Section icon={GraduationCap} tone="mint" title="Admission requirements">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="GPA requirement" value={form.gpaReq} onChange={set("gpaReq")} placeholder="e.g. 3.5 / 4.0" />
          <Input label="IELTS" value={form.ielts} onChange={set("ielts")} placeholder="e.g. 6.5" />
          <Input label="SAT" value={form.sat} onChange={set("sat")} placeholder="e.g. 1300 or Not required" />
          <Input label="Entrance exam" value={form.entranceExam} onChange={set("entranceExam")} placeholder="e.g. EJU, or None" />
        </div>
      </Section>

      <Section icon={Coins} tone="orange" title="Cost">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Currency" value={form.currency} onChange={set("currency")} options={CURRENCY_CODES} className="sm:col-span-2" />
          <Input label="Application fee" value={form.applicationFee} onChange={set("applicationFee")} placeholder="One time" inputMode="decimal" />
          <Input label="Tuition fee" value={form.tuitionFee} onChange={set("tuitionFee")} placeholder="Per year" inputMode="decimal" />
          <Input label="Living cost" value={form.livingCost} onChange={set("livingCost")} placeholder="Per month" inputMode="decimal" />
        </div>
      </Section>

      <Section icon={Award} tone="mint" title="Scholarship" subtitle="Leave the name empty if there isn't one.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Scholarship name" value={form.scholarshipName} onChange={set("scholarshipName")} placeholder="e.g. MEXT Scholarship" />
          <Input label="Amount" value={form.scholarshipAmount} onChange={set("scholarshipAmount")} placeholder="e.g. Full tuition + monthly stipend" />
          <Textarea className="sm:col-span-2" label="Eligibility" value={form.scholarshipEligibility} onChange={set("scholarshipEligibility")} placeholder="Who can apply?" />
          <Input label="Deadline" type="date" value={form.scholarshipDeadline} onChange={set("scholarshipDeadline")} />
        </div>
      </Section>

      <Section icon={MessageSquareText} tone="red" title="My review">
        <div className="grid gap-4 sm:grid-cols-2">
          <Textarea label="Pros" value={form.pros} onChange={set("pros")} placeholder="What do you like?" />
          <Textarea label="Cons" value={form.cons} onChange={set("cons")} placeholder="What worries you?" />
          <div>
            <span className="label">My rating</span>
            <StarRating value={form.rating} onChange={set("rating")} />
          </div>
          <Select label="Decision status" value={form.status} onChange={set("status")} options={DECISION_STATUSES} />
        </div>
      </Section>

      <Section icon={ListPlus} tone="blue" title="Custom fields" subtitle="Track anything else. Add as many as you like.">
        {form.customFields.length === 0 && (
          <p className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-ink-soft">
            Nothing here yet. Try “Professor contact” or “Research area”.
          </p>
        )}
        <datalist id="custom-field-suggestions">
          {SUGGESTED_FIELDS.map((s) => <option key={s} value={s} />)}
        </datalist>
        <ul className="space-y-3">
          {form.customFields.map((f) => (
            <li key={f.id} className="grid grid-cols-[1fr_auto] gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[1fr_1.4fr_auto]">
              <input className="input !bg-white" list="custom-field-suggestions" value={f.label} onChange={(e) => updateField(f.id, { label: e.target.value })} placeholder="Field name" aria-label="Field name" />
              <button type="button" onClick={() => removeField(f.id)} className="btn btn-danger btn-sm row-span-1 self-center sm:order-3" aria-label="Remove field">
                <X className="h-4 w-4" />
              </button>
              <input className="input !bg-white col-span-2 sm:col-span-1 sm:order-2" value={f.value} onChange={(e) => updateField(f.id, { value: e.target.value })} placeholder="Value" aria-label="Field value" />
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => addField()} className="btn btn-ghost mt-4">
          <Plus className="h-4 w-4" /> Add Custom Field
        </button>
      </Section>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {!isNew ? (
          <button type="button" onClick={remove} disabled={saving} className="btn btn-danger">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        ) : <span />}
        <div className="flex gap-3">
          <Link href={backHref} className="btn btn-ghost">Cancel</Link>
          <button type="submit" disabled={saving} className="btn btn-success btn-lg">
            {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />} Save university
          </button>
        </div>
      </div>
    </form>
  );
}
