import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBxlOKc5WHyJHhwJkelngoTCtpq-O4-5HQ",
  authDomain: "app.rideclub.in",
  projectId: "laksham-ride",
  storageBucket: "laksham-ride.firebasestorage.app",
  messagingSenderId: "883531790562",
  appId: "1:883531790562:web:a722ccf2311aba9e9fc6bb",
  measurementId: "G-54ZSF3ER23"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
