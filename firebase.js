// Import the functions you need from the SDKs you need
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBmTN84KCTkF3BnsXeLWyIZHjN5UedVqPU",
  authDomain: "asobell-app.firebaseapp.com",
  projectId: "asobell-app",
  storageBucket: "asobell-app.firebasestorage.app",
  messagingSenderId: "201391011268",
  appId: "1:201391011268:web:0a461843fd39d90c922091"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);