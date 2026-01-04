import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';


WebBrowser.maybeCompleteAuthSession();

const firebaseConfig = {
  apiKey: "AIzaSyD8vP4qOZ2HHVLLnDMa8l2M9XtUCiMMkVA",
  authDomain: "ondemandapp-2ff62.firebaseapp.com",
  projectId: "ondemandapp-2ff62",
  appId: "1:33455046464:web:e46ecada2f23dd15b484a5"
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
