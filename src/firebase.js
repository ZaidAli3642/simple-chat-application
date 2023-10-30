// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD941UZOVTnOGdYYm-AWIbrCTWyTObGcpE",
  authDomain: "real-horse-6fc35.firebaseapp.com",
  projectId: "real-horse-6fc35",
  storageBucket: "real-horse-6fc35.appspot.com",
  messagingSenderId: "58448884577",
  appId: "1:58448884577:web:994de08bd5eae3d9ca0b20",
  measurementId: "G-S4R3YR6QVH",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const database = getDatabase(app);
