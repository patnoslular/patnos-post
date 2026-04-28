import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase yapılandırması silindiği için boş bir yapılandırma ile başlatıyoruz
// Uygulama Supabase üzerinden çalıştığı için bu dosya sadece referans hatası vermemesi içindir.
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "placeholder-id",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  firestoreDatabaseId: "(default)"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
