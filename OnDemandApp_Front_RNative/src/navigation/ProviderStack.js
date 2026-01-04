import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LayoutDashboard, ListTodo, History, Wallet, User } from "lucide-react-native";


import ProviderDashboardScreen from "../screens/provider/ProviderDashboardScreen";
import ProviderServicesScreen from "../screens/provider/ProviderServicesScreen";
import ProviderHistoryScreen from "../screens/provider/ProviderHistoryScreen";
import WalletScreen from "../screens/provider/WalletScreen";
import ProfileScreen from "../screens/shared/ProfileScreen";


import ProviderJobDetailsScreen from "../screens/provider/ProviderJobDetailsScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


function ProviderTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0d9488",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: { height: 60, paddingBottom: 10, paddingTop: 10 }
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={ProviderDashboardScreen}
        options={{
          tabBarLabel: "Accueil",
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={24} />
        }}
      />
      <Tab.Screen
        name="Services"
        component={ProviderServicesScreen}
        options={{
          tabBarLabel: "Services",
          tabBarIcon: ({ color }) => <ListTodo color={color} size={24} />
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarLabel: "Revenus",
          tabBarIcon: ({ color }) => <Wallet color={color} size={24} />
        }}
      />
      <Tab.Screen
        name="History"
        component={ProviderHistoryScreen}
        options={{
          tabBarLabel: "Historique",
          tabBarIcon: ({ color }) => <History color={color} size={24} />
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profil",
          tabBarIcon: ({ color }) => <User color={color} size={24} />
        }}
      />
    </Tab.Navigator>
  );
}


export default function ProviderStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
   
      <Stack.Screen
        name="ProviderTabs"
        component={ProviderTabs}
      />

     
      <Stack.Screen
        name="ProviderJob"
        component={ProviderJobDetailsScreen}
      />
    </Stack.Navigator>
  );
}
