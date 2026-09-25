import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDCikWbA7LImXQROX0tjhM657kvP_rIWTw",
  authDomain: "uddesho-c26ec.firebaseapp.com",
  projectId: "uddesho-c26ec",
  storageBucket: "uddesho-c26ec.firebasestorage.app",
  messagingSenderId: "164957876871",
  appId: "1:164957876871:web:348f88bca21dcec6c47e22",
};

export const isFirebaseConfigured = true;

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, storage, googleProvider };
