"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { serverTimestamp, setDoc } from "firebase/firestore";
import { ArrowLeft, ArrowRight, Briefcase, Camera, Check, GraduationCap, Rocket, UserRound } from "lucide-react";
import PageShell from "@/components/PageShell";
import { ErrorNote, Input, Section, Select, Spinner, Textarea } from "@/components/ui";
import Flag from "@/components/Flag";
import { useAuth } from "@/lib/auth-context";
import { storage } from "@/lib/firebase";
import { userDocRef } from "@/lib/db";
import { COUNTRIES } from "@/data/countries";

const STEPS = [
  { title: "About you", icon: UserRound, tone: "blue", bar: "bg-blue-600" },
  { title: "Academics", icon: GraduationCap, tone: "orange", bar: "bg-orange-500" },
  { title: "Study plan", icon: Briefcase, tone: "red", bar: "bg-red-500" },
  { title: "Your future", icon: Rocket, tone: "mint", bar: "bg-mint-400" },
];

const DEGREES = ["Diploma / Foundation", "Bachelor's", "Master's", "PhD"];
const SCHOLARSHIP = [
  { value: "full", label: "I need a full scholarship" },
  { value: "partial", label: "A partial scholarship would help" },
  { value: "none", label: "Not required" },
];
const YES_MAYBE_NO = [
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
];

const ACADEMIC_LEVELS = [
  { value: "secondary", label: "Secondary / SSC / O Level / Equivalent" },
  { value: "higher_secondary", label: "Higher Secondary / HSC / A Level / Equivalent" },
  { value: "diploma", label: "Diploma / Foundation" },
  { value: "bachelor", label: "Bachelor's" },
  { value: "master", label: "Master's" },
  { value: "phd", label: "PhD / Doctorate" },
  { value: "other", label: "Other" },
];

// Shrinks the picture to at most 512px before uploading, so it is fast on mobile data.
async function resizeImage(file, max = 512) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  } finally {
    URL.revokeObjectURL(url);
  }
}

function ProfileForm() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const isEdit = Boolean(profile?.profileComplete);
  const fileRef = useRef(null);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(profile?.photoURL || user?.photoURL || "");

  const [form, setForm] = useState(() => {
    let startName = "";
    try { startName = sessionStorage.getItem("uddesho_new_name") || ""; } catch {}
    return {
      name: profile?.name || user?.displayName || startName,
      academicRecords:
        Array.isArray(profile?.academic?.records) && profile.academic.records.length
          ? profile.academic.records
          : [
              ...(profile?.academic?.sscGpa
                ? [{ level: "secondary", institution: "", result: String(profile.academic.sscGpa), scale: "5.00", passingYear: "" }]
                : []),
              ...(profile?.academic?.hscGpa
                ? [{ level: "higher_secondary", institution: "", result: String(profile.academic.hscGpa), scale: "5.00", passingYear: "" }]
                : []),
            ],
      ielts: profile?.academic?.ielts ?? "",
      sat: profile?.academic?.sat ?? "",
      otherQualifications: profile?.academic?.otherQualifications ?? "",
      subject: profile?.study?.subject ?? "",
      degreeLevel: profile?.study?.degreeLevel ?? "",
      preferredCountries: profile?.study?.preferredCountries ?? [],
      budget: profile?.study?.budget ?? "",
      scholarship: profile?.study?.scholarship ?? "",
      careerGoal: profile?.future?.careerGoal ?? "",
      prInterest: profile?.future?.prInterest ?? "",
      researchInterest: profile?.future?.researchInterest ?? "",
      researchArea: profile?.future?.researchArea ?? "",
    };
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const addAcademicRecord = () =>
    setForm((f) => ({
      ...f,
      academicRecords: [
        ...(f.academicRecords || []),
        { level: "", institution: "", result: "", scale: "", passingYear: "" },
      ],
    }));

  const updateAcademicRecord = (index, key, value) =>
    setForm((f) => ({
      ...f,
      academicRecords: (f.academicRecords || []).map((record, i) =>
        i === index ? { ...record, [key]: value } : record
      ),
    }));

  const removeAcademicRecord = (index) =>
    setForm((f) => ({
      ...f,
      academicRecords: (f.academicRecords || []).filter((_, i) => i !== index),
    }));

  const toggleCountry = (id) =>
    setForm((f) => ({
      ...f,
      preferredCountries: f.preferredCountries.includes(id)
        ? f.preferredCountries.filter((c) => c !== id)
        : [...f.preferredCountries, id],
    }));

  function onPickPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    setError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function next() {
    if (step === 0 && !form.name.trim()) return setError("Please enter your name to continue.");
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function save() {
    if (!form.name.trim()) {
      setStep(0);
      return setError("Please enter your name to continue.");
    }
    setSaving(true);
    setError("");
    try {
      let photoURL = profile?.photoURL || user?.photoURL || "";
      let photoWarning = false;
      if (photoFile) {
        try {
          if (!storage) throw new Error("no storage");
          const blob = await resizeImage(photoFile);
          const r = storageRef(storage, `users/${user.uid}/profile.jpg`);
          await uploadBytes(r, blob, { contentType: "image/jpeg" });
          photoURL = await getDownloadURL(r);
        } catch (err) {
          console.error("Photo upload failed", err);
          photoWarning = true;
        }
      }

      await setDoc(
        userDocRef(user.uid),
        {
          name: form.name.trim(),
          email: user.email || "",
          photoURL,
          academic: {
            records: (form.academicRecords || [])
              .map((record) => ({
                level: record.level || "",
                institution: (record.institution || "").trim(),
                result: (record.result || "").trim(),
                scale: (record.scale || "").trim(),
                passingYear: (record.passingYear || "").trim(),
              }))
              .filter((record) => record.level || record.institution || record.result || record.scale || record.passingYear),
            ielts: form.ielts, sat: form.sat,
            otherQualifications: form.otherQualifications,
          },
          study: {
            subject: form.subject, degreeLevel: form.degreeLevel,
            preferredCountries: form.preferredCountries, budget: form.budget, scholarship: form.scholarship,
          },
          future: {
            careerGoal: form.careerGoal, prInterest: form.prInterest,
            researchInterest: form.researchInterest, researchArea: form.researchArea,
          },
          profileComplete: true,
          ...(profile ? {} : { createdAt: serverTimestamp() }),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await refreshProfile();
      if (photoWarning) {
        // The rest of the profile is saved. Explain the photo issue, then move on.
        alert("Your profile is saved, but the picture couldn't be uploaded. Make sure Firebase Storage is enabled, then try again from your profile page.");
      }
      router.push(isEdit ? "/research" : "/roll");
    } catch (err) {
      console.error(err);
      setError(
        err?.code === "permission-denied"
          ? "Firebase blocked this save. Publish the Firestore rules from the project's firestore.rules file, then try again."
          : "We couldn't save your profile. Check your connection and try again."
      );
      setSaving(false);
    }
  }

  const last = step === STEPS.length - 1;
  const initial = (form.name || "S").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{isEdit ? "Your profile" : "Let's set up your profile"}</h1>
        <p className="mt-1 text-ink-soft">
          {isEdit ? "Keep your details up to date." : "A few quick questions so your workspace fits you. It takes about two minutes."}
        </p>
      </div>

      {/* step tabs: each colour is one bar of the logo */}
      <ol className="mb-6 grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => (i <= step || isEdit ? setStep(i) : null)}
              className="group block w-full text-left"
              aria-current={i === step ? "step" : undefined}
            >
              <span className={`block h-1.5 rounded-full transition-all ${i <= step ? s.bar : "bg-slate-200"}`} />
              <span className={`mt-2 flex items-center gap-1.5 text-xs font-bold ${i === step ? "text-ink" : "text-ink-faint"}`}>
                {i < step ? <Check className="h-3.5 w-3.5 text-mint-600" /> : <s.icon className="h-3.5 w-3.5" />}
                <span className="truncate">{s.title}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Section icon={UserRound} tone="blue" title="About you" subtitle="Your name and a picture, so it feels like yours.">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-mint-400 text-4xl font-extrabold text-white ring-4 ring-white shadow-lift"
              aria-label="Choose profile picture"
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
              <span className="absolute inset-0 grid place-items-center bg-ink/50 opacity-0 transition group-hover:opacity-100">
                <Camera className="h-6 w-6" />
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
            <div className="text-center sm:text-left">
              <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost btn-sm">
                <Camera className="h-4 w-4" /> {photoPreview ? "Change picture" : "Add a picture"}
              </button>
              <p className="mt-2 text-xs text-ink-faint">Optional. JPG or PNG.</p>
            </div>
          </div>
          <Input className="mt-6" label="Your name" value={form.name} onChange={set("name")} placeholder="Full name" autoComplete="name" />
        </Section>
      )}

      {step === 1 && (
        <Section icon={GraduationCap} tone="orange" title="Academics" subtitle="Add only the academic records that apply to you. This works for school, bachelor's, master's and PhD applicants.">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-ink">Academic records</h3>
              <p className="mt-1 text-xs text-ink-faint">Add SSC/HSC, O/A Levels, Diploma, Bachelor's, Master's or any equivalent qualification.</p>
            </div>
            <button type="button" onClick={addAcademicRecord} className="btn btn-ghost btn-sm">
              + Add record
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {(form.academicRecords || []).length === 0 && (
              <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 p-5 text-center">
                <p className="text-sm font-bold text-ink">No academic record added yet</p>
                <p className="mt-1 text-xs text-ink-faint">Use “Add record” to add the qualifications relevant to you.</p>
              </div>
            )}

            {(form.academicRecords || []).map((record, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-ink">Academic record {index + 1}</p>
                  <button type="button" onClick={() => removeAcademicRecord(index)} className="text-xs font-bold text-red-600 hover:underline">
                    Remove
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Select label="Level" value={record.level || ""} onChange={(value) => updateAcademicRecord(index, "level", value)} options={ACADEMIC_LEVELS} placeholder="Choose level" />
                  <Input label="Institution" value={record.institution || ""} onChange={(value) => updateAcademicRecord(index, "institution", value)} placeholder="School, college or university" />
                  <Input label="Result / GPA / CGPA" value={record.result || ""} onChange={(value) => updateAcademicRecord(index, "result", value)} placeholder="e.g. 4.42 or 3.75" inputMode="decimal" />
                  <Input label="Scale / Maximum" value={record.scale || ""} onChange={(value) => updateAcademicRecord(index, "scale", value)} placeholder="e.g. 5.00, 4.00, 10.00 or 100" />
                  <Input label="Passing year" value={record.passingYear || ""} onChange={(value) => updateAcademicRecord(index, "passingYear", value)} placeholder="e.g. 2024" inputMode="numeric" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Input label="IELTS" value={form.ielts} onChange={set("ielts")} placeholder="Overall band, e.g. 7.0" />
            <Input label="SAT" value={form.sat} onChange={set("sat")} placeholder="Score, e.g. 1350" />
          </div>
          <Textarea className="mt-4" label="Other qualifications" value={form.otherQualifications} onChange={set("otherQualifications")} placeholder="TOEFL, PTE, GRE / GMAT, olympiads, certificates, projects, work experience..." />
        </Section>
      )}

      {step === 2 && (
        <Section icon={Briefcase} tone="red" title="Study plan" subtitle="What and where you would like to study.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Preferred subject" value={form.subject} onChange={set("subject")} placeholder="e.g. Computer Science" />
            <Select label="Degree level" value={form.degreeLevel} onChange={set("degreeLevel")} options={DEGREES} placeholder="Choose one" />
            <Input label="Yearly budget (USD)" value={form.budget} onChange={set("budget")} placeholder="e.g. 8000" inputMode="numeric" hint="Tuition and living together, per year." />
            <Select label="Scholarship requirement" value={form.scholarship} onChange={set("scholarship")} options={SCHOLARSHIP} placeholder="Choose one" />
          </div>

          <div className="mt-6">
            <span className="label">Preferred countries</span>
            <p className="mb-3 text-xs text-ink-faint">Pick any you already like. You can still roll for surprises later.</p>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((c) => {
                const on = form.preferredCountries.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleCountry(c.id)}
                    aria-pressed={on}
                    className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-xs font-bold transition ${
                      on ? "bg-blue-600 text-white shadow-glow-blue" : "bg-white text-ink ring-1 ring-inset ring-slate-200 hover:ring-blue-300"
                    }`}
                  >
                    <Flag country={c} width={22} className="!rounded-full !shadow-none" />
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>
      )}

      {step === 3 && (
        <Section icon={Rocket} tone="mint" title="Your future" subtitle="Where you want this journey to lead.">
          <Textarea label="Career goal" value={form.careerGoal} onChange={set("careerGoal")} placeholder="What do you want to be doing in 10 years?" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Select label="Interested in permanent residency (PR)?" value={form.prInterest} onChange={set("prInterest")} options={YES_MAYBE_NO} placeholder="Choose one" />
            <Select label="Interested in research?" value={form.researchInterest} onChange={set("researchInterest")} options={YES_MAYBE_NO} placeholder="Choose one" />
          </div>
          {form.researchInterest && form.researchInterest !== "no" && (
            <Input className="mt-4" label="Research areas" value={form.researchArea} onChange={set("researchArea")} placeholder="e.g. Artificial intelligence, renewable energy" />
          )}
        </Section>
      )}

      <div className="mt-5">
        <ErrorNote>{error}</ErrorNote>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" onClick={() => { setError(""); setStep((s) => Math.max(s - 1, 0)); }} disabled={step === 0 || saving} className="btn btn-ghost">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {last ? (
          <button type="button" onClick={save} disabled={saving} className="btn btn-success btn-lg">
            {saving && <Spinner className="h-4 w-4" />} Continue
          </button>
        ) : (
          <button type="button" onClick={next} className="btn btn-primary">
            Next <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <PageShell needProfile={false} width="max-w-3xl">
      <ProfileForm />
    </PageShell>
  );
}
