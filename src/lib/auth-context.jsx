"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  dataError: null,
  refreshProfile: async () => null,
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  const loadProfile = useCallback(async (u) => {
    if (!u || !db) {
      setProfile(null);
      return null;
    }
    try {
      const snap = await getDoc(doc(db, "users", u.uid));
      const data = snap.exists() ? snap.data() : null;
      setProfile(data);
      setDataError(null);
      return data;
    } catch (err) {
      console.error("Could not load profile", err);
      setDataError(err);
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return undefined;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // keep `loading` true until the profile has been read, so pages never
        // make a redirect decision with a half-loaded state
        setLoading(true);
        await loadProfile(u);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [loadProfile]);

  const refreshProfile = useCallback(() => loadProfile(auth?.currentUser), [loadProfile]);

  const logout = useCallback(async () => {
    if (auth) await signOut(auth);
  }, []);

  const value = useMemo(
    () => ({ user, profile, loading, dataError, refreshProfile, logout }),
    [user, profile, loading, dataError, refreshProfile, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
