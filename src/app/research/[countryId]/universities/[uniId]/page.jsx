"use client";

import { useParams } from "next/navigation";
import PageShell from "@/components/PageShell";
import UniversityForm from "@/components/UniversityForm";
import { getCountry } from "@/data/countries";

function Inner() {
  const { countryId, uniId } = useParams();
  const country = getCountry(countryId);
  if (!country) return <p className="text-ink-soft">Country not found.</p>;
  return <UniversityForm key={uniId} country={country} uniId={uniId} />;
}

export default function EditUniversityPage() {
  return (
    <PageShell width="max-w-4xl">
      <Inner />
    </PageShell>
  );
}
