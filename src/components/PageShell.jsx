"use client";

import RequireAuth from "./RequireAuth";
import AppHeader from "./AppHeader";

// Wrapper for every page that needs a signed-in student.
export default function PageShell({ children, needProfile = true, width = "max-w-6xl" }) {
  return (
    <RequireAuth needProfile={needProfile}>
      <AppHeader />
      <main className={`mx-auto w-full ${width} px-4 pb-10 pt-6 sm:px-6 sm:pt-8`}>{children}</main>
    </RequireAuth>
  );
}
