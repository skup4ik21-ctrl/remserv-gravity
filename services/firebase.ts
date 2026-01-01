import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Singleton initialization
console.log("Firebase config check:", {
  projectId: firebaseConfig.projectId,
  apiKey: firebaseConfig.apiKey ? "OK" : "MISSING",
  authDomain: firebaseConfig.authDomain ? "OK" : "MISSING"
});

const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

console.log("Firebase initialized successfully for project:", firebaseConfig.projectId);

// Secondary app for admin tasks (if needed)
const secondaryAppName = "SecondaryApp";
const secondaryApp: FirebaseApp = !getApps().find(a => a.name === secondaryAppName)
  ? initializeApp(firebaseConfig, secondaryAppName)
  : getApp(secondaryAppName);
const secondaryAuth: Auth = getAuth(secondaryApp);

export const isFirebaseConfigValid = () => {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
};

export { db, auth, secondaryAuth };
export default app;