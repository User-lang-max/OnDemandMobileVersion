import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { SignalRProvider } from './src/context/SignalRContext';
import * as Notifications from 'expo-notifications';

import AppNavigator from './src/navigation/AppNavigator';

LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

export default function App() {
  useEffect(() => {

    const sub1 =
      Notifications.addNotificationReceivedListener(notification => {
        console.log(' Notification reçue', notification);
      });


    const sub2 =
      Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        console.log(' Notification cliquée', data);
      });

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SignalRProvider>
          <AppNavigator />
        </SignalRProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
