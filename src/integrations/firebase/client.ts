import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const requiredEnv = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingKeys = Object.entries(requiredEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

const createUnavailableProxy = <T extends object>(serviceName: string): T =>
  new Proxy(
    {},
    {
      get() {
        throw new Error(
          `[Firebase] ${serviceName} não está disponível porque as variáveis de ambiente obrigatórias não foram definidas. ` +
            `Configure os valores VITE_FIREBASE_* (faltando: ${missingKeys.join(", ") || "desconhecido"}) e reinicie o servidor.`
        );
      },
      apply() {
        throw new Error(
          `[Firebase] ${serviceName} não está disponível porque as variáveis de ambiente obrigatórias não foram definidas. ` +
            `Configure os valores VITE_FIREBASE_* (faltando: ${missingKeys.join(", ") || "desconhecido"}) e reinicie o servidor.`
        );
      },
    }
  ) as T;

if (missingKeys.length > 0) {
  console.error(
    `Firebase configuration is incomplete. Missing keys: ${missingKeys.join(", ")}. ` +
      "Set the VITE_FIREBASE_* environment variables to initialize Firebase correctly."
  );
}

const firebaseConfig: FirebaseOptions = {
  apiKey: requiredEnv.apiKey,
  authDomain: requiredEnv.authDomain,
  projectId: requiredEnv.projectId,
  storageBucket: requiredEnv.storageBucket,
  messagingSenderId: requiredEnv.messagingSenderId,
  appId: requiredEnv.appId,
};

const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

if (measurementId) {
  Object.assign(firebaseConfig, { measurementId });
}

const app = missingKeys.length === 0 ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) : null;

export const isFirebaseConfigured = app !== null;

export const firebaseApp = (app ?? createUnavailableProxy<FirebaseApp>("Firebase App")) satisfies FirebaseApp;
export const firebaseAuth = app ? getAuth(app) : createUnavailableProxy<Auth>("Firebase Auth");
export const firebaseFirestore = app ? getFirestore(app) : createUnavailableProxy<Firestore>("Firebase Firestore");
export const firebaseStorage = app ? getStorage(app) : createUnavailableProxy<FirebaseStorage>("Firebase Storage");
