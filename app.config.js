/* eslint-disable no-undef */
import "dotenv/config";

export default {
  expo: {
    name: "FitTrack",
    slug: "fittrack",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      rapidApiKey: process.env.RAPID_API_KEY,
      eas: {
        projectId: "e586b2fa-bf5e-4e5b-a3e7-e2ea8907ca51",
      },
    },
    android: {
      package: "com.fittrack.app",
      versionCode: 1,
    },
    // Add any other Expo config here
  },
};
