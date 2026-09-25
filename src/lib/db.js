import { collection, deleteDoc, doc, getDoc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

/*
  Every student has a private workspace:

  users/{uid}                      -> profile (name, academic, study, future ...)
  users/{uid}/countries/{id}       -> notes + research checklist for each country
  users/{uid}/universities/{id}    -> universities the student adds (+ custom fields)
  users/{uid}/scholarships/{id}    -> scholarship saved from a university (same id)
  users/{uid}/applications/{id}    -> application tracker entry (same id as the university)
*/

export const userDocRef = (uid) => doc(db, "users", uid);
export const userCol = (uid, name) => collection(db, "users", uid, name);
export const userSubDoc = (uid, name, id) => doc(db, "users", uid, name, id);

// ---------- helpers ----------
export const tsMillis = (t) => (t && typeof t.toMillis === "function" ? t.toMillis() : 0);

export const newId = (uid, name) => doc(userCol(uid, name)).id;

// ---------- countries ----------
export const CHECKLIST = [
  { id: "visa", label: "I understand the visa steps" },
  { id: "cost", label: "I checked tuition and living costs" },
  { id: "unis", label: "I added 3 or more universities", auto: true },
  { id: "scholarships", label: "I looked for scholarships" },
  { id: "requirements", label: "I compared admission requirements" },
  { id: "shortlist", label: "I shortlisted my top choices" },
];

export function computeProgress(checklist = {}, uniCount = 0) {
  const done = CHECKLIST.filter((i) => (i.auto ? uniCount >= 3 : checklist[i.id])).length;
  return Math.round((done / CHECKLIST.length) * 100);
}

export async function ensureCountry(uid, country) {
  const ref = userSubDoc(uid, "countries", country.id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      countryId: country.id,
      name: country.name,
      code: country.code,
      notes: "",
      checklist: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// ---------- universities ----------
export const DECISION_STATUSES = ["Considering", "Shortlisted", "Dream School", "Applying", "Dropped"];

export const emptyUniversity = {
  name: "", city: "", website: "", ranking: "",
  degree: "", subject: "", department: "", language: "", duration: "",
  gpaReq: "", ielts: "", sat: "", entranceExam: "",
  currency: "USD", applicationFee: "", tuitionFee: "", livingCost: "",
  scholarshipName: "", scholarshipAmount: "", scholarshipEligibility: "", scholarshipDeadline: "",
  pros: "", cons: "", rating: 0, status: "Considering",
  customFields: [],
};

// Save a university and keep its scholarship (if any) in the scholarships collection.
export async function saveUniversity(uid, id, data, country, isNew) {
  const batch = writeBatch(db);
  const uniRef = userSubDoc(uid, "universities", id);
  const payload = {
    ...data,
    countryId: country.id,
    countryName: country.name,
    countryCode: country.code,
    updatedAt: serverTimestamp(),
  };
  if (isNew) payload.createdAt = serverTimestamp();
  batch.set(uniRef, payload, { merge: true });

  const schRef = userSubDoc(uid, "scholarships", id);
  if (data.scholarshipName?.trim()) {
    batch.set(
      schRef,
      {
        universityId: id,
        universityName: data.name,
        countryId: country.id,
        countryName: country.name,
        name: data.scholarshipName,
        amount: data.scholarshipAmount,
        eligibility: data.scholarshipEligibility,
        deadline: data.scholarshipDeadline,
        currency: data.currency,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    batch.delete(schRef);
  }
  await batch.commit();
}

export async function deleteUniversity(uid, id) {
  const batch = writeBatch(db);
  batch.delete(userSubDoc(uid, "universities", id));
  batch.delete(userSubDoc(uid, "scholarships", id));
  batch.delete(userSubDoc(uid, "applications", id));
  await batch.commit();
}

// ---------- applications ----------
export const STAGES = ["Planning", "Preparing", "Applied", "Interview", "Offer", "Rejected"];

export const DOC_CHECKLIST = [
  { id: "sop", label: "Statement of purpose" },
  { id: "lor", label: "Recommendation letters" },
  { id: "transcripts", label: "Transcripts and certificates" },
  { id: "english", label: "IELTS / English proof" },
  { id: "passport", label: "Passport copy" },
  { id: "cv", label: "CV / Resume" },
  { id: "finance", label: "Financial documents" },
  { id: "fee", label: "Application fee paid" },
];

export async function addToTracker(uid, uni) {
  await setDoc(
    userSubDoc(uid, "applications", uni.id),
    {
      universityId: uni.id,
      universityName: uni.name,
      countryId: uni.countryId,
      countryName: uni.countryName,
      countryCode: uni.countryCode || "",
      stage: "Planning",
      deadline: "",
      notes: "",
      checklist: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export const removeFromTracker = (uid, id) => deleteDoc(userSubDoc(uid, "applications", id));
