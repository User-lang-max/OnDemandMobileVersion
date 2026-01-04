import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosClient from '../api/axiosClient';

import * as Google from 'expo-auth-session/providers/google';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword,  sendEmailVerification } from 'firebase/auth';


import { firebaseAuth } from '../services/firebase';

const AuthContext = createContext(null);



const atob = (input) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input.replace(/=+$/, '');
  let output = '';
  for (let bc = 0, bs = 0, buffer, i = 0;
       (buffer = str.charAt(i++));
       ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
       bc++ % 4)
         ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6))
         : 0) {
    buffer = chars.indexOf(buffer);
  }
  return output;
};

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};



async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig.extra.eas.projectId,
  });

  console.log(' MON TOKEN EXPO :', token.data);
  return token.data;
}



export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [request, response, promptAsync] =
    Google.useIdTokenAuthRequest({
      clientId:
        '33455046464-d7aprdnd638jeei7rhn39qvdq37q5ct6.apps.googleusercontent.com',
      useProxy: true,
    });



  const saveUserToken = async (token) => {
    await AsyncStorage.setItem('token', token);

    const decoded = parseJwt(token);
    if (!decoded) return;

    const role =
      decoded.role ||
      decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      'client';

    setUser({
      id: decoded.sub || decoded.nameid,
      email: decoded.email || decoded.unique_name,
      role,
    });
  };



  useEffect(() => {
    const load = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) await saveUserToken(token);
      setLoading(false);
    };
    load();
  }, []);



  const register = async (
    email,
    fullName,
    password,
    role,
    providerCategoryCode = null,
    cvUrl = null,
    photoUrl = null
  ) => {
    const { createUserWithEmailAndPassword, sendEmailVerification, signOut } =
      await import('firebase/auth');

    const cred = await createUserWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    );

    await sendEmailVerification(cred.user);
    const firebaseToken = await cred.user.getIdToken();

    try {
      const res = await axiosClient.post(
        '/auth/firebase-login',
        {
          fullName,
          role,
          providerCategoryCode,
          cvUrl,
          photoUrl,
        },
        {
          headers: { Authorization: `Bearer ${firebaseToken}` },
        }
      );

      if (res.data?.token) {
        await saveUserToken(res.data.token);

        const expoToken = await registerForPushNotificationsAsync();
        if (expoToken) {
          await axiosClient.post('/notifications/register-token', {
            token: expoToken,
          });
        }

        return { success: true, role: res.data.role };
      }
    } catch (err) {
      if (err?.response?.data?.error === 'EmailNonVerifie') {
        await signOut(firebaseAuth);
        return { success: true, requiresEmailVerification: true };
      }
      throw err;
    }

    await signOut(firebaseAuth);
    return { success: true, requiresEmailVerification: true };
  };

  
  const login = async (email, password) => {
    try {

      const res = await axiosClient.post('/auth/login', { email, password });
      await saveUserToken(res.data.token);
      return { success: true, role: res.data.role };

    } catch (err) {

      if (
        err?.response?.status === 401 &&
        err?.response?.data?.error === 'UseFirebaseLogin'
      ) {
        try {
          const userCred = await signInWithEmailAndPassword(
            firebaseAuth,
            email,
            password
          );

          await userCred.user.reload();
          const firebaseToken = await userCred.user.getIdToken(true);

          const resFirebase = await axiosClient.post(
            '/auth/firebase-login',
            {},
            {
              headers: {
                Authorization: `Bearer ${firebaseToken}`,
              },
            }
          );

          await saveUserToken(resFirebase.data.token);
          return { success: true, role: resFirebase.data.role };

        } catch (firebaseErr) {
          if (
            err?.response?.status === 401 &&
            err?.response?.data?.error === 'EmailNonVerifie'
          ) {
            return { requiresEmailVerification: false };
          }
        }
      }

      throw err;
    }
  };

  const loginWithFirebase = async (email, password) => {

  const userCred = await signInWithEmailAndPassword(
    firebaseAuth,
    email,
    password
  );


  const firebaseToken = await userCred.user.getIdToken(true);


  const res = await axiosClient.post(
    '/auth/firebase-login',
    {},
    {
      headers: {
        Authorization: `Bearer ${firebaseToken}`,
      },
    }
  );


  await saveUserToken(res.data.token);

  return { success: true, role: res.data.role };
};



  const loginWithGoogle = async () => {
    const result = await promptAsync();
    if (result.type !== 'success') return;

    const credential = GoogleAuthProvider.credential(
      result.params.id_token
    );

    const userCred = await signInWithCredential(
      firebaseAuth,
      credential
    );

    const firebaseToken = await userCred.user.getIdToken();

    const res = await axiosClient.post(
      '/auth/firebase-login',
      {},
      {
        headers: { Authorization: `Bearer ${firebaseToken}` },
      }
    );

    if (res.data.token) {
      await saveUserToken(res.data.token);
    }
  };



  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithFirebase, 
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);