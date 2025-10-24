// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import Constants from 'expo-constants';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: Constants.expoConfig.extra.apiKey,
    authDomain: Constants.expoConfig.extra.authDomain,
    projectId: Constants.expoConfig.extra.projectId,
    storageBucket: Constants.expoConfig.extra.storageBucket,
    messagingSenderId: Constants.expoConfig.extra.messagingSenderId,
    appId: Constants.expoConfig.extra.appId,
};
// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Realtime Database
export const db = getDatabase(app);

// Exportar helpers
export { ref, onValue };