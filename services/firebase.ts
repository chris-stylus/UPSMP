import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB9c924IZT6JG_vO7EO9KeLjz4j-XzOqQo",
  authDomain: "upsjmp.firebaseapp.com",
  projectId: "upsjmp",
  storageBucket: "upsjmp.firebasestorage.app",
  messagingSenderId: "358130978975",
  appId: "1:358130978975:web:fdeb7ca49b6d6b3fe7d2aa",
  measurementId: "G-QR2MF7NQB0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
