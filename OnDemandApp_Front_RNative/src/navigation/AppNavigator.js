import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

import AuthStack from './AuthStack';
import ClientStack from './ClientStack';
import ProviderStack from './ProviderStack';
import AdminStack from './AdminStack';
import ProviderOnboardingScreen from '../screens/provider/ProviderOnboardingScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  return (
    <NavigationContainer>
     <Stack.Navigator screenOptions={{ headerShown: false }}>
  {!user && <Stack.Screen name="Auth" component={AuthStack} />}

  {user?.role === 'provider_pending_onboarding' && (
    <Stack.Screen name="ProviderOnboarding" component={ProviderOnboardingScreen} />
  )}

  {user?.role === 'admin' && <Stack.Screen name="Admin" component={AdminStack} />}
  {user?.role === 'client' && <Stack.Screen name="Client" component={ClientStack} />}
  {user?.role === 'provider' && <Stack.Screen name="Provider" component={ProviderStack} />}


  {!user?.role && (
    <Stack.Screen name="AuthFallback" component={AuthStack} />
  )}
</Stack.Navigator>
    </NavigationContainer>
  );
}