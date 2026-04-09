import { initializeApp } from "firebase/app";
import { getDatabase, ref } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyBwgMG6fOHbI43bNkB6ZwylvBDmt7Kr7Hk",
    authDomain: "service-59f79.firebaseapp.com",
    projectId: "service-59f79",
    storageBucket: "service-59f79.firebasestorage.app",
    messagingSenderId: "893383656987",
    appId: "1:893383656987:web:32d37e8bbf7ede8a17dabe",
    measurementId: "G-4ZC155ZC6L"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const videosRef = ref(database, 'videos');
export const slidersRef = ref(database, 'sliders');
export const adsRef = ref(database, 'ads'); // For the random ads mentioned in requirement 8
