import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const firebaseConfig = {
  apiKey: 'XXX',
  authDomain: 'XXX.firebaseapp.com',
  projectId: 'XXX',
  appId: 'XXX'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


export { auth };
