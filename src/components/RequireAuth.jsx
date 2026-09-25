"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { isFirebaseConfigured } from "@/lib/firebase";
import { FullLoader } from "./ui";
import SetupNotice from "./SetupNotice";

// Sends visitors to /login when signed out, and to /profile until the profile is finished.
export default function RequireAuth({ children, needProfile = true }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const profileDone = Boolean(profile?.profileComplete);

  useEffect(() => {
    if (!isFirebaseConfigured || loading) return;
    if (!user) router.replace("/login");
    else if (needProfile && !profileDone) router.replace("/profile");
  }, [user, loading, needProfile, profileDone, router]);

  if (!isFirebaseConfigured) return <SetupNotice />;
  if (loading || !user || (needProfile && !profileDone)) return <FullLoader />;
  return children;
}
