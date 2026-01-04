import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";

import {
  LogOut,
  User,
  ShieldCheck,
  Info,
  Settings,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";

export default function AdminSettingsScreen() {
  const { logout, user } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres</Text>
        <Text style={styles.subtitle}>Configuration et informations administrateur</Text>
      </View>

      {/* PROFIL ADMIN */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <User size={18} color="#0f172a" />
          <Text style={styles.sectionTitle}>Profil administrateur</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Nom</Text>
            <Text style={styles.value}>{user?.fullName || "Administrateur"}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email || "admin@ondemand.app"}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Rôle</Text>
            <Text style={styles.value}>Administrateur</Text>
          </View>
        </View>
      </View>

      {/* SÉCURITÉ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ShieldCheck size={18} color="#0f172a" />
          <Text style={styles.sectionTitle}>Sécurité</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.infoText}>
            Votre session est protégée par authentification sécurisée.
          </Text>
          <Text style={styles.infoSubText}>
            Pour votre sécurité, pensez à vous déconnecter après chaque utilisation
            sur un appareil partagé.
          </Text>
        </View>
      </View>

      {/* APPLICATION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Info size={18} color="#0f172a" />
          <Text style={styles.sectionTitle}>À propos de l’application</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Nom</Text>
            <Text style={styles.value}>OnDemandApp</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Version</Text>
            <Text style={styles.value}>1.0.0</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Environnement</Text>
            <Text style={styles.value}>Production</Text>
          </View>
        </View>
      </View>

      {/* LOGOUT (CONSERVÉ) */}
      <View style={styles.logoutContainer}>
        <Pressable style={styles.logoutBtn} onPress={logout}>
          <LogOut size={20} color="#fff" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </Pressable>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  header: {
    padding: 28,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#64748b",
  },

  section: {
    paddingHorizontal: 24,
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  value: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 14,
  },

  infoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 6,
  },
  infoSubText: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },

  logoutContainer: {
    marginTop: 40,
    paddingHorizontal: 24,
  },
  logoutBtn: {
    backgroundColor: "#dc2626",
    paddingVertical: 16,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  logoutText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
  },
});
