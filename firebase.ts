import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Your web app's Firebase configuration provided by you
const firebaseConfig = {
  apiKey: "AIzaSyB2JIKv_iy-50cXPufRiLDFSRuoGxv07Q",
  authDomain: "accesos-show-time-v2.firebaseapp.com",
  projectId: "accesos-show-time-v2",
  storageBucket: "accesos-show-time-v2.firebasestorage.app",
  messagingSenderId: "120193853370",
  appId: "1:120193853370:web:8f883aea22f68304eb5f83"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one.
      // This is a normal scenario, no need to panic.
      console.warn('Firestore persistence failed: Multiple tabs open.');
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the
      // features required to enable persistence
      console.error('Firestore persistence is not available in this browser.');
    }
  });

export { db };