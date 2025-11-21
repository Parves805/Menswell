
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// These variables are loaded from .env file by Next.js
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let isFirebaseConfigured = false;

// Check if all required Firebase config values are present and valid
if (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
) {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        firestore = getFirestore(app);
        isFirebaseConfigured = true;
    } catch (e) {
        console.error("Firebase initialization failed:", e);
        // Fallback to unconfigured state
        app = {} as FirebaseApp;
        auth = {} as Auth;
        firestore = {} as Firestore;
        isFirebaseConfigured = false;
    }
} else {
    // Silently fail if config is not set, the UI will adapt by disabling auth features.
    app = {} as FirebaseApp;
    auth = {} as Auth;
    firestore = {} as Firestore;
    isFirebaseConfigured = false;

    if (typeof window !== 'undefined') {
        console.warn("\n[Menswell] WARNING: Firebase configuration is missing or incomplete.");
        console.warn("[Menswell] Google Authentication will be disabled.");
        console.warn("[Menswell] Please ensure all NEXT_PUBLIC_FIREBASE_* variables are set in your .env or .env.local file.\n");
    }
}

export { app, auth, firestore, isFirebaseConfigured };
