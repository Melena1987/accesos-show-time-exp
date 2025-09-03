// FIX: Switched to Firebase v8 API compatibility to resolve initialization error.
// FIX: Using compat imports for Firebase v9 to support v8 syntax.
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";

// Your web app's Firebase configuration provided by you
const firebaseConfig = {
  apiKey: "AIzaSyB2JIkV_iy-50cXPpUfRilDFSRuoGxv07Q",
  authDomain: "accesos-show-time-v2.firebaseapp.com",
  projectId: "accesos-show-time-v2",
  storageBucket: "accesos-show-time-v2.firebasestorage.app",
  messagingSenderId: "120193853370",
  appId: "1:120193853370:web:8f883aea22f68304eb5f83"
};

// Initialize Firebase
// FIX: Used v8 namespaced `firebase.initializeApp` and added a check to prevent re-initialization.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
// FIX: Used v8 `firebase.firestore()` to get the Firestore instance.
const db = firebase.firestore();
const auth = firebase.auth();

// Enable offline persistence
// FIX: Switched to the v8 method `db.enablePersistence()`
db.enablePersistence()
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

export { db, auth };