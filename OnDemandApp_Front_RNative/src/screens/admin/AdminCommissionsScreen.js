import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert
} from "react-native";
import axiosClient from "../../api/axiosClient";
import {
  DollarSign,
  PieChart,
  Search,
  Filter,
  ArrowUpRight,
  Briefcase
} from "lucide-react-native";

export default function AdminCommissionsScreen() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ total: 0, average: 0, count: 0 });

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      const res = await axiosClient.get("/admin/commissions?rate=0.15");
      setData(res.data);
      const total = res.data.reduce((acc, curr) => acc + (curr.platformFee || 0), 0);
      const count = res.data.length;
      setStats({
        total,
        count,
        average: count > 0 ? (total / count).toFixed(2) : 0
      });
    } catch {
      Alert.alert("Erreur", "Erreur chargement commissions");
    } finally {
      setLoading(false);
    }
  };

  const filtered = data.filter((item) => {
    const providerName = item.provider || "";
    const serviceName = item.service || "";
    const term = searchTerm.toLowerCase();
    return (
      providerName.toLowerCase().includes(term) ||
      serviceName.toLowerCase().includes(term)
    );
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 56 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Commissions</Text>
        <Text style={styles.headerSubtitle}>Suivi des revenus nets de la plateforme</Text>
      </View>

      <View style={styles.contentPadding}>

        {/* STATS */}
        <View style={styles.statsWrapper}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.gradientCard]}>
              <View style={styles.statHeader}>
                <DollarSign size={18} color="#fff" />
                <ArrowUpRight size={12} color="#fff" />
              </View>
              <Text style={styles.statValueWhite}>{stats.total.toLocaleString()} MAD</Text>
              <Text style={styles.statLabelWhite}>Gains cumulés</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Briefcase size={18} color="#2563eb" />
              </View>
              <Text style={styles.statValue}>{stats.count}</Text>
              <Text style={styles.statLabel}>Prestations</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.fullWidthCard]}>
            <View style={styles.statHeader}>
              <PieChart size={18} color="#9333ea" />
            </View>
            <Text style={styles.statValue}>{stats.average} MAD</Text>
            <Text style={styles.statLabel}>Gain moyen / job</Text>
          </View>
        </View>

        {/* TABLE */}
        <View style={styles.tableCard}>
          <View style={styles.toolbar}>
            <View style={styles.searchContainer}>
              <Search size={16} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher prestataire ou service..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholderTextColor="#9ca3af"
              />
            </View>
            
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={styles.tableMinWidth}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colHeader, { width: 130 }]}>Date & ID</Text>
                <Text style={[styles.colHeader, { width: 130 }]}>Service</Text>
                <Text style={[styles.colHeader, { width: 130 }]}>Prestataire</Text>
                <Text style={[styles.colHeader, { width: 30, textAlign: "right" }]}>Job</Text>
                <Text style={[styles.colHeader, { width: 120, textAlign: "right" }]}>Comm.</Text>
                <Text style={[styles.colHeader, { width: 120, textAlign: "right" }]}>Net</Text>
              </View>

              {loading ? (
                <ActivityIndicator style={{ padding: 40 }} size="large" />
              ) : (
                filtered.map((item, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <View style={{ width: 130 }}>
                      <Text style={styles.rowDate}>
                        {new Date(item.date).toLocaleDateString()}
                      </Text>
                      <Text style={styles.rowId}>
                        #{item.jobId?.toString().substring(0, 8)}
                      </Text>
                    </View>

                    <View style={{ width: 130 }}>
                      <Text style={styles.rowService}>{item.service}</Text>
                    </View>

                    <View style={{ width: 70 }}>
                      <Text style={styles.rowProvider}>{item.provider}</Text>
                    </View>

                    <View style={{ width: 120, alignItems: "flex-end" }}>
                      <Text style={styles.rowAmount}>{item.totalPrice} MAD</Text>
                    </View>

                    <View style={{ width: 120, alignItems: "flex-end" }}>
                      <Text style={styles.rowFee}>+{item.platformFee} MAD</Text>
                    </View>

                    <View style={{ width: 120, alignItems: "flex-end" }}>
                      <Text style={styles.rowNet}>{item.providerNet} MAD</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },

  header: { backgroundColor: "#fff", padding: 28, borderBottomWidth: 1, borderColor: "#e5e7eb" },
  headerTitle: { fontSize: 28, fontWeight: "bold" },
  headerSubtitle: { color: "#6b7280" },

  contentPadding: { padding: 28 },

  statsWrapper: { gap: 16, marginBottom: 32 },
  statsRow: { flexDirection: "row", gap: 16 },

  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#f3f4f6"
  },
  gradientCard: { backgroundColor: "#0d9488", borderColor: "#0f766e" },
  fullWidthCard: { width: "100%" },

  statHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },

  statValue: { fontSize: 18, fontWeight: "bold" },
  statLabel: { fontSize: 11, color: "#6b7280" },
  statValueWhite: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  statLabelWhite: { fontSize: 11, color: "#ccfbf1" },

  tableCard: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#f3f4f6" },
  toolbar: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
    flexDirection: "row",
    justifyContent: "space-between"
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 10,
    width: 260
  },
  searchInput: { flex: 1, paddingVertical: 6 },

  filterBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6
  },
  filterText: { fontSize: 12, fontWeight: "bold" },

  tableMinWidth: { minWidth: 760 },

  tableHeader: { flexDirection: "row", padding: 14, borderBottomWidth: 1, borderColor: "#e5e7eb" },
  colHeader: { fontSize: 11, fontWeight: "bold", color: "#9ca3af" },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
    alignItems: "center"
  },

  rowDate: { fontSize: 12, fontWeight: "bold" },
  rowId: { fontSize: 10, color: "#9ca3af", fontFamily: "monospace" },
  rowService: { fontSize: 13 },
  rowProvider: { fontSize: 13 },
  rowAmount: { fontSize: 13 },
  rowFee: { fontSize: 13, fontWeight: "bold", color: "#0d9488" },
  rowNet: { fontSize: 13, fontWeight: "500" }
});
