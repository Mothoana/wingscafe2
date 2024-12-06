// Firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDQkwY6Kgv17NhZ2kFGwc0jYnh2Lq4DVu0",
  authDomain: "annam-7d519.firebaseapp.com",
  projectId: "annam-7d519",
  storageBucket: "annam-7d519.appspot.com",  // Corrected here
  messagingSenderId: "408560434367",
  appId: "1:408560434367:web:67a128a1f6dd1db7581a0a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase Authentication and Firestore references
const auth = getAuth(app);
const db = getFirestore(app);

// Export auth and db, no need to export 'app' unless you need it somewhere.
export { auth, db };
