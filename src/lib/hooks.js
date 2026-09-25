"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";

// Live list of everything in one of the current user's sub-collections.
export function useUserCollection(name) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid || !db) {
      setItems([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, "users", uid, name),
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Could not load ${name}`, err);
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid, name]);

  return { items, loading, error };
}
