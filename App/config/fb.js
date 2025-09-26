// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import Constants from 'expo-constants';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: Constants.manifest.extra.ApiKey,
    authDomain: Constants.manifest.extra.AuthDomain,
    projectId: Constants.manifest.extra.ProjectId,
    storageBucket: Constants.manifest.extra.StorageBucket,
    messagingSenderId: Constants.manifest.extra.MessagingSenderId,
    appId: Constants.manifest.extra.AppId,
    measurementId: Constants.manifest.extra.MeasurementId
};

initializeApp(firebaseConfig);
export const database = getFirestore();