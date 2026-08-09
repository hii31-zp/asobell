import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBmTN84KCTkF3BnsXeLWyIZHjN5UedVqPU",
  authDomain: "asobell-app.firebaseapp.com",
  projectId: "asobell-app",
  storageBucket: "asobell-app.firebasestorage.app",
  messagingSenderId: "201391011268",
  appId: "1:201391011268:web:0a461843fd39d90c922091",
  measurementId: "G-XJV6X79WF0",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
