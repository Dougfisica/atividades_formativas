// Configuração do Firebase
// IMPORTANTE: Substitua pelos valores do seu projeto Firebase

const firebaseConfig = {
  apiKey: "AIzaSyBkyMYpvmjBvhVUde-sjAXbUEfSZY6GrFw",
  authDomain: "afagricola-3680e.firebaseapp.com",
  projectId: "afagricola-3680e",
  storageBucket: "afagricola-3680e.firebasestorage.app",
  messagingSenderId: "396313868819",
  appId: "1:396313868819:web:aad66219db855ea3d45de6",
  measurementId: "G-VW2PS0YZJM"
};

// Inicializar Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const app = initializeApp(firebaseConfig);

// Exportar serviços Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app; 