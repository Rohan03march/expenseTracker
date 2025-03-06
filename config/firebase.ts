// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import {initializeAuth,getReactNativePersistence} from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Firestore, getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpk__-Zc9-Vf2QGoPpvJTjNJWlImNc-F4",
  authDomain: "expense-teacker-54992.firebaseapp.com",
  projectId: "expense-teacker-54992",
  storageBucket: "expense-teacker-54992.firebasestorage.app",
  messagingSenderId: "770469233393",
  appId: "1:770469233393:web:44a6945edd3c8b4ce15f50"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//auth 
export const auth = initializeAuth(app,{
    persistence: getReactNativePersistence(AsyncStorage)
})

//db
export const firestore = getFirestore(app);