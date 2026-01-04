import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Package, User } from 'lucide-react-native';


import ClientHomeScreen from '../screens/client/ClientHomeScreen';
import ServicesScreen from '../screens/client/ServicesScreen';
import OrdersScreen from '../screens/client/OrdersScreen';
import OrderDetailsScreen from '../screens/client/OrderDetailsScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import PaymentScreen from '../screens/client/PaymentScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0d9488',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { paddingBottom: 5, height: 60 } 
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={ClientHomeScreen} 
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="OrdersTab" 
        component={OrdersScreen} 
        options={{
          tabBarLabel: 'Commandes',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}


export default function ClientStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      <Stack.Screen name="ClientTabs" component={ClientTabs} />
    
      <Stack.Screen name="Services" component={ServicesScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
    </Stack.Navigator>
  );
}