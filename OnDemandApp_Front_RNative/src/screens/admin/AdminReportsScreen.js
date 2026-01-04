import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet, Dimensions
} from "react-native";
import axiosClient from "../../api/axiosClient";
import {
  TrendingUp, Users, Activity, DollarSign, Download, Calendar, CheckCircle, XCircle, FileText
} from "lucide-react-native";
import LineChart from "../../components/Charts_TEMP/LineChart";

const { width } = Dimensions.get("window");

export default function AdminReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, completionRate: 0, averageBasket: 0 });
  const [chartData, setChartData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobsRes, paymentsRes] = await Promise.all([
          axiosClient.get("/admin/jobs"), 
          axiosClient.get("/admin/payments"),
        ]);
        const jobs = jobsRes.data;
        const payments = paymentsRes.data;

        // Calcul des Stats
        const revenue = payments
          .filter((p) => p.status === "captured" || p.status === "paid")
          .reduce((acc, curr) => acc + curr.amount, 0);
          
        const ordersCount = jobs.length;
        const completedJobs = jobs.filter((j) => j.status === "completed").length;
        const rate = ordersCount > 0 ? ((completedJobs / ordersCount) * 100).toFixed(1) : 0;
        const avgBasket = ordersCount > 0 ? (revenue / ordersCount).toFixed(0) : 0;

        setStats({ 
            totalRevenue: revenue, 
            totalOrders: ordersCount, 
            completionRate: rate, 
            averageBasket: avgBasket 
        });

        // Données Graphe (Revenu par mois)
        const monthlyRevenue = new Array(12).fill(0);
        payments.forEach((p) => {
          if (p.status === "captured" || p.status === "paid") {
            const date = new Date(p.date || p.createdAt);
            if (!isNaN(date)) monthlyRevenue[date.getMonth()] += p.amount;
          }
        });
        setChartData(monthlyRevenue);
        
        // Dernières transactions
        setRecentTransactions(payments.slice(0, 5));

      } catch (error) { 
        console.error("Erreur chargement rapports:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="#0d9488" /></View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <View>
            <Text style={styles.headerTitle}>Rapports Financiers</Text>
            <View style={styles.headerSubtitleRow}>
                <Activity size={16} color="#64748b" />
                <Text style={styles.headerSubtitle}>Analyse détaillée de la performance</Text>
            </View>
        </View>
        
      </View>

      <View style={styles.content}>
        
        {/* KPI GRID */}
        <View style={styles.grid}>
          <ReportCard 
            title="Chiffre d'Affaires" 
            value={`${stats.totalRevenue.toLocaleString()} MAD`} 
            subValue="Total encaissé cette année" 
            icon={DollarSign} 
            colorTheme="emerald" 
          />
          <ReportCard 
            title="Total Commandes" 
            value={stats.totalOrders} 
            subValue="Missions créées" 
            icon={FileText} 
            colorTheme="blue" 
          />
          <ReportCard 
            title="Panier Moyen" 
            value={`${stats.averageBasket} MAD`} 
            subValue="Revenu par commande" 
            icon={Users} 
            colorTheme="violet" 
          />
          <ReportCard 
            title="Taux de Complétion" 
            value={`${stats.completionRate}%`} 
            subValue="Missions terminées avec succès" 
            icon={CheckCircle} 
            colorTheme="amber" 
          />
        </View>

        {/* CHART SECTION */}
        <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Croissance des Revenus</Text>
                <Text style={styles.cardSubtitle}>Évolution mensuelle du CA (MAD)</Text>
              </View>
              <View style={styles.yearBadge}>
                <Calendar size={14} color="#64748b" />
                <Text style={styles.yearText}> Par Année </Text>
              </View>
            </View>
            <View style={styles.chartWrapper}>
              <LineChart data={chartData} />
            </View>
        </View>

        {/* TRANSACTIONS SECTION */}
        <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
            <View style={styles.listHeader}>
                <Text style={styles.cardTitle}>Dernières Transactions</Text>
            </View>
            
            <View style={styles.listContent}>
                {recentTransactions.length === 0 ? (
                    <Text style={styles.emptyText}>Aucune transaction récente</Text>
                ) : (
                    recentTransactions.map((t, i) => (
                        <View key={i} style={styles.transactionRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                                <View style={[
                                    styles.iconBox, 
                                    (t.status === 'captured' || t.status === 'paid') ? styles.bgSuccess : styles.bgError
                                ]}>
                                    {(t.status === 'captured' || t.status === 'paid') 
                                        ? <CheckCircle size={18} color="#16a34a"/> 
                                        : <XCircle size={18} color="#dc2626"/>}
                                </View>
                                <View>
                                    <Text style={styles.transAmount}>{t.amount} MAD</Text>
                                    <Text style={styles.transService}>{t.service || 'Service'}</Text>
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.transDate}>{new Date(t.date).toLocaleDateString()}</Text>
                                <Text style={styles.transMethod}>{t.method || 'Carte'}</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>
            
            
        </View>

      </View>
    </ScrollView>
  );
}


const ReportCard = ({ title, value, subValue, icon: Icon, colorTheme }) => {
  const themes = {
    emerald: { bg: "#ecfdf5", text: "#059669", iconBg: "#d1fae5" },
    blue: { bg: "#eff6ff", text: "#2563eb", iconBg: "#dbeafe" },
    violet: { bg: "#f5f3ff", text: "#7c3aed", iconBg: "#ede9fe" },
    amber: { bg: "#fffbeb", text: "#d97706", iconBg: "#fef3c7" },
  };
  const theme = themes[colorTheme] || themes.blue;

  return (
    <View style={styles.kpiCard}>
      <View style={styles.kpiHeader}>
        <View style={[styles.kpiIcon, { backgroundColor: theme.text + '15' }]}> 
          
            <Icon size={24} color={theme.text} />
        </View>
        <View style={styles.trendBadge}>
            <TrendingUp size={12} color="#16a34a" />
            <Text style={styles.trendText}>+{Math.floor(Math.random() * 20)}%</Text>
        </View>
      </View>
      <View>
        <Text style={styles.kpiValue}>{value}</Text>
        <Text style={styles.kpiTitle}>{title}</Text>
        <Text style={styles.kpiSub}>{subValue}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },


  header: { padding: 24, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#111827", marginBottom: 4 },
  headerSubtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerSubtitle: { fontSize: 14, color: "#64748b" },
  
  exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d9488', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 8 },
  exportBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  content: { padding: 16, gap: 20 },


  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard: { 
    width: (width - 44) / 2, 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 2
  },
  kpiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  kpiIcon: { padding: 10, borderRadius: 12 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#dcfce7' },
  trendText: { fontSize: 10, fontWeight: 'bold', color: '#16a34a', marginLeft: 4 },
  
  kpiValue: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 4 },
  kpiTitle: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiSub: { fontSize: 11, color: '#94a3b8', marginTop: 4 },

  // CARD CHART
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  cardSubtitle: { fontSize: 13, color: '#64748b' },
  yearBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', gap: 6 },
  yearText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  chartWrapper: { alignItems: 'center' },

  // LISTE TRANSACTIONS
  listHeader: { padding: 20, borderBottomWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#f8fafc' },
  listContent: { padding: 20, gap: 12 },
  
  transactionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', backgroundColor: '#fff' },
  
  iconBox: { padding: 8, borderRadius: 10 },
  bgSuccess: { backgroundColor: '#dcfce7' }, 
  bgError: { backgroundColor: '#fee2e2' },   
  
  transAmount: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  transService: { fontSize: 12, color: '#64748b' },
  transDate: { fontSize: 12, fontWeight: '500', color: '#4b5563' },
  transMethod: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginTop: 2 },

  emptyText: { textAlign: 'center', color: '#9ca3af', padding: 20 },

  footerBtn: { padding: 16, backgroundColor: '#f9fafb', borderTopWidth: 1, borderColor: '#f1f5f9', alignItems: 'center' },
  footerBtnText: { fontSize: 13, fontWeight: 'bold', color: '#0d9488' },
});