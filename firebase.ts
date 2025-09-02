import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Your web app's Firebase configuration provided by you
const firebaseConfig = {
  apiKey: "AIzaSyCOuRcd0ijQ4JVMZaWDWwOXVTZxYOsBRVI",
  authDomain: "accesos-show-time-8528a.firebaseapp.com",
  projectId: "accesos-show-time-8528a",
  storageBucket: "accesos-show-time-8528a.firebasestorage.app",
  messagingSenderId: "14955721313",
  appId: "1:14955721313:web:79c3d4a6c15f77e2fbf020"
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