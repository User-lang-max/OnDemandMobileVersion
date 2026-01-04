import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import axiosClient from "../../api/axiosClient";
import { Layers, Plus, Edit3, Trash } from "lucide-react-native";

export default function AdminCatalogScreen() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient
      .get("/catalog/tree")
      .then((res) => setCategories(res.data))
      .catch(() => Alert.alert("Erreur", "Erreur catalogue"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={styles.container}>
    
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Catalogue</Text>
        <Text style={styles.headerSubtitle}>Organisation des catégories et métiers.</Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Layers size={20} color="#0d9488" />
              <Text style={styles.cardTitle}>Structure du Catalogue</Text>
            </View>
            
          </View>

          <View style={styles.listContainer}>
            {loading && <ActivityIndicator size="large" color="#0d9488" />}
            
            {categories.map((cat) => (
              <View key={cat.id} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <View style={styles.catInfo}>
                    <Text style={styles.catEmoji}>{cat.icon}</Text>
                    <Text style={styles.catName}>{cat.name}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{cat.services?.length || 0}</Text>
                    </View>
                  </View>
                 
                </View>

         
                {cat.services && cat.services.length > 0 && (
                  <View style={styles.servicesGrid}>
                    {cat.services.map((srv) => (
                      <View key={srv.id} style={styles.serviceItem}>
                        <Text style={styles.serviceName}>{srv.name}</Text>
                      
                      </View>
                    ))}
                  
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: { backgroundColor: "#0f766e", paddingHorizontal: 32, paddingTop: 40, paddingBottom: 80 },
  headerTitle: { fontSize: 30, fontWeight: "bold", color: "#fff", marginBottom: 8 },
  headerSubtitle: { color: "#ccfbf1" },
  
  contentContainer: { paddingHorizontal: 32, marginTop: -40, paddingBottom: 40 },
  card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#f3f4f6", padding: 24, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 20, fontWeight: "bold", color: "#1f2937" },
  
  newButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#111827", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 8 },
  newButtonText: { color: "#fff", fontWeight: "bold" },
  
  listContainer: { gap: 16 },
  
  categoryItem: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, overflow: "hidden" },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f9fafb", padding: 16 },
  catInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  catEmoji: { fontSize: 24 },
  catName: { fontSize: 16, fontWeight: "bold", color: "#1f2937" },
  badge: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, color: "#6b7280" },
  iconButton: { padding: 8, backgroundColor: "#fff", borderRadius: 8 },
  
  servicesGrid: { padding: 16, backgroundColor: "#fff", gap: 12 },
  serviceItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderWidth: 1, borderColor: "#f3f4f6", borderRadius: 8 },
  serviceName: { fontSize: 14, fontWeight: "500", color: "#374151" },
  serviceActions: { flexDirection: "row", gap: 8 },
  actionIcon: { padding: 4 },
  
  addServiceItem: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderWidth: 1, borderColor: "#d1d5db", borderStyle: 'dashed', borderRadius: 8, gap: 4 },
  addServiceText: { fontSize: 14, color: "#9ca3af" },
});