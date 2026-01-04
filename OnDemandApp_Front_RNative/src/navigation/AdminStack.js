import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { LayoutDashboard, BarChart3, Users, ShieldAlert, Briefcase, DollarSign, Percent, Layers, Wrench, Settings } from "lucide-react-native";

import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminReportsScreen from "../screens/admin/AdminReportsScreen";
import AdminUsersScreen from "../screens/admin/AdminUsersScreen";
import AdminPendingProvidersScreen from "../screens/admin/AdminPendingProvidersScreen";
import AdminJobsScreen from "../screens/admin/AdminJobsScreen";
import AdminPaymentsScreen from "../screens/admin/AdminPaymentsScreen";
import AdminCommissionsScreen from "../screens/admin/AdminCommissionsScreen";
import AdminCatalogScreen from "../screens/admin/AdminCatalogScreen";
import AdminServicesScreen from "../screens/admin/AdminServicesScreen";
import AdminSettingsScreen from "../screens/admin/AdminSettingsScreen";

const Drawer = createDrawerNavigator();

export default function AdminStack() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerTintColor: "#0d9488",
        drawerActiveTintColor: "#0d9488",
        drawerInactiveTintColor: "#64748b",
      }}
    >
      {/* Vue d'ensemble */}
      <Drawer.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          title: "Dashboard",
          drawerIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="Reports"
        component={AdminReportsScreen}
        options={{
          title: "Rapports & Analytics",
          drawerIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />

      {/* Gestion */}
      <Drawer.Screen
        name="Users"
        component={AdminUsersScreen}
        options={{
          title: "Utilisateurs",
          drawerIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="PendingProviders"
        component={AdminPendingProvidersScreen}
        options={{
          title: "Validations Pro",
          drawerIcon: ({ color, size }) => <ShieldAlert color={color} size={size} />,
        }}
      />

      {/* Plateforme */}
      <Drawer.Screen
        name="Jobs"
        component={AdminJobsScreen}
        options={{
          title: "Commandes",
          drawerIcon: ({ color, size }) => <Briefcase color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="Payments"
        component={AdminPaymentsScreen}
        options={{
          title: "Finances",
          drawerIcon: ({ color, size }) => <DollarSign color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="Commissions"
        component={AdminCommissionsScreen}
        options={{
          title: "Commissions",
          drawerIcon: ({ color, size }) => <Percent color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="Catalog"
        component={AdminCatalogScreen}
        options={{
          title: "Catalogue",
          drawerIcon: ({ color, size }) => <Layers color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="Services"
        component={AdminServicesScreen}
        options={{
          title: "Services",
          drawerIcon: ({ color, size }) => <Wrench color={color} size={size} />,
        }}
      />

      {/* Système */}
      <Drawer.Screen
        name="Settings"
        component={AdminSettingsScreen}
        options={{
          title: "Paramètres",
          drawerIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Drawer.Navigator>
  );
}
