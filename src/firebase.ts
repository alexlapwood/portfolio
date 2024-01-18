// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDqeXXp0bhOnJACxzzN_O4XjcI18vYtT3Y",
  authDomain: "alex-lapwood.firebaseapp.com",
  projectId: "alex-lapwood",
  storageBucket: "alex-lapwood.appspot.com",
  messagingSenderId: "330021183178",
  appId: "1:330021183178:web:188b56fb87ad0681cade33",
  measurementId: "G-P35V2H4PXW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);
