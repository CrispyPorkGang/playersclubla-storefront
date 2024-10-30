// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmoVysAjiUB6IwHuWhOoPBaH6nR18_cck",
  authDomain: "user-auth-2db3b.firebaseapp.com",
  projectId: "user-auth-2db3b",
  storageBucket: "user-auth-2db3b.appspot.com",
  messagingSenderId: "92355443920",
  appId: "1:92355443920:web:a296ca7dc65f03108572d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)