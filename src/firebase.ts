import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
// Use the legacy .appspot.com domain which is often less likely to be blocked than the new .firebasestorage.app
const legacyBucket = firebaseConfig.storageBucket.replace('.firebasestorage.app', '.appspot.com');
export const storage = getStorage(app, `gs://${legacyBucket}`);
export const googleProvider = new GoogleAuthProvider();
