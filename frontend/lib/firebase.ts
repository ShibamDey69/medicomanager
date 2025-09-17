import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDHWWTR6Oo3fq63aj6eBQf7k3X-l4BBEwg",
  authDomain: "meico-90999.firebaseapp.com",
  projectId: "meico-90999",
  storageBucket: "meico-90999.firebasestorage.app",
  messagingSenderId: "199303279298",
  appId: "1:199303279298:web:5a503ce636ae32c6ccc15b",
  measurementId: "G-RLLVF6EX80"
};


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export default app;