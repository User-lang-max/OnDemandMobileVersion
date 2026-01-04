import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Écrans
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import Verify2FAScreen from '../screens/auth/Verify2FAScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import ProviderOnboardingScreen from '../screens/provider/ProviderOnboardingScreen'; 

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Verify2FA" component={Verify2FAScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    
      <Stack.Screen name="ProviderOnboarding" component={ProviderOnboardingScreen} />
    </Stack.Navigator>
  );
}