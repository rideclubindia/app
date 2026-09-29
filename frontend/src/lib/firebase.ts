import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const appAdminSupportConfig = {
  apiKey: "AIzaSyBxlOKc5WHyJHhwJkelngoTCtpq-O4-5HQ",
  authDomain: "app.rideclub.in",
  projectId: "laksham-ride",
  storageBucket: "laksham-ride.firebasestorage.app",
  messagingSenderId: "883531790562",
  appId: "1:883531790562:web:a722ccf2311aba9e9fc6bb",
  measurementId: "G-54ZSF3ER23"
};

const websiteConfig = {
  apiKey: "AIzaSyD4KcLlkh9BIQZ18EnVbeHA1DhEUHP86gw",
  authDomain: "rideclubindia-project.firebaseapp.com",
  projectId: "rideclubindia-project",
  storageBucket: "rideclubindia-project.firebasestorage.app",
  messagingSenderId: "70361102417",
  appId: "1:70361102417:web:8298b529f21d5f27e52070",
  measurementId: "G-56RHD4ECYL"
};

const hostname = window.location.hostname;
const isWebsite = hostname === 'rideclub.in' || hostname === 'www.rideclub.in' || hostname.includes('rideclubindia-project');

const firebaseConfig = isWebsite ? websiteConfig : appAdminSupportConfig;

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
