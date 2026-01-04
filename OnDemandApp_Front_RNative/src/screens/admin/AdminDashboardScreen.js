import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, ActivityIndicator, StyleSheet, Dimensions
} from "react-native";
import axiosClient from "../../api/axiosClient";
import {
  Users, Briefcase, CreditCard, Activity, TrendingUp, DollarSign
} from "lucide-react-native";


import LineChart from "../../components/Charts_TEMP/LineChart";
import BarChart from "../../components/Charts_TEMP/BarChart";

const { width } = Dimensions.get("window");

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState({ users: 0, providers: 0, jobs: 0, payments: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState({ line: [], bar: [], barLabels: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [overview, jobs, payments, activity] = await Promise.all([
          axiosClient.get("/admin/overview"),
          axiosClient.get("/admin/jobs"),
          axiosClient.get("/admin/payments"),
          axiosClient.get("/admin/activity"),
        ]);
        
        setStats(overview.data);
        setRecentActivity(activity.data);

    
        const monthlyData = new Array(12).fill(0);
        jobs.data.forEach((j) => {
          const d = new Date(j.date || j.Date || j.createdAt);
          if (!isNaN(d.getTime())) monthlyData[d.getMonth()]++;
        });

        const revenueByService = {};
        payments.data.forEach((p) => {
          if (p.status === "captured" || p.status === "paid") {
            const s = p.service || "Autre";
            revenueByService[s] = (revenueByService[s] || 0) + p.amount;
          }
        });
        const sortedRevenue = Object.entries(revenueByService).sort((a, b) => b[1] - a[1]).slice(0, 5);

        setChartData({
          line: monthlyData,
          bar: sortedRevenue.map((i) => i[1]),
          barLabels: sortedRevenue.map((i) => i[0]),
        });

      } catch (e) { 
        console.error("Dashboard error", e); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchAll();
  }, []);

  if (loading) return (
      <View style={styles.center}><ActivityIndicator size="large" color="#0d9488" /></View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Tableau de Bord</Text>
        <Text style={styles.subtitle}>Bienvenue sur votre espace d'administration.</Text>
      </View>

      {/* STATS CARDS (GRID) */}
      <View style={styles.grid}>
        <StatCard 
          title="Utilisateurs" 
          value={stats.users} 
          icon={Users} 
          colorTheme="violet" 
        />
        <StatCard 
          title="Prestataires" 
          value={stats.providers} 
          icon={Briefcase} 
          colorTheme="blue" 
        />
        <StatCard 
          title="Commandes" 
          value={stats.jobs} 
          icon={Activity} 
          colorTheme="amber" 
        />
        <StatCard 
          title="Revenus" 
          value={`${stats.payments} MAD`} 
          icon={CreditCard} 
          colorTheme="emerald" 
        />
      </View>

      {/* CHARTS SECTION */}
      <View style={styles.chartsContainer}>
        {/* Line Chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Évolution des Revenus</Text>
          </View>
          <LineChart data={chartData.line} />
        </View>

        {/* Bar Chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Revenus par Service</Text>
          </View>
          <BarChart data={chartData.bar} labels={chartData.barLabels} />
        </View>
      </View>

      {/* RECENT ACTIVITY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activité Récente</Text>
        <View style={styles.activityGrid}>
          {recentActivity.slice(0, 6).map((act, i) => (
            <View key={i} style={styles.activityCard}>
              <View style={[
                styles.iconCircle, 
                act.type === 'payment' ? styles.bgEmerald : 
                act.type === 'job' ? styles.bgBlue : styles.bgViolet
              ]}>
                {act.type === 'payment' ? <DollarSign size={16} color={act.type==='payment'?'#059669':'#fff'}/> : 
                 act.type === 'job' ? <Briefcase size={16} color={act.type==='job'?'#2563eb':'#fff'}/> : 
                 <Users size={16} color={act.type==='user'?'#7c3aed':'#fff'}/>}
              </View>
              <View style={{flex: 1}}>
                <Text numberOfLines={2} style={styles.actMessage}>{act.message}</Text>
                <Text style={styles.actDate}>
                  {new Date(act.date).toLocaleDateString()} • {new Date(act.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

    </ScrollView>
  );
}


function StatCard({ title, value, icon: Icon, colorTheme }) {
  const themes = {
    blue: { bg: "#eff6ff", text: "#2563eb", iconBg: "#dbeafe" },     
    violet: { bg: "#f5f3ff", text: "#7c3aed", iconBg: "#ede9fe" },   
    amber: { bg: "#fffbeb", text: "#d97706", iconBg: "#fef3c7" },    
    emerald: { bg: "#ecfdf5", text: "#059669", iconBg: "#d1fae5" },  
  };
  const theme = themes[colorTheme] || themes.blue;

  return (
    <View style={styles.statCard}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <View>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
        <View style={[styles.statIconBox, { backgroundColor: theme.bg }]}>
          <Icon size={24} color={theme.text} />
        </View>
      </View>
      <View style={styles.trendRow}>
        <View style={styles.trendBadge}>
          <TrendingUp size={12} color="#16a34a" />
          <Text style={styles.trendText}>+12%</Text>
        </View>
        <Text style={styles.trendLabel}>vs mois dernier</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" }, 
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { padding: 24, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: "800", color: "#111827", marginBottom: 4 },
  subtitle: { fontSize: 16, color: "#64748b" },


  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: { 
    width: (width - 44) / 2, 
    backgroundColor: "white", 
    borderRadius: 16, 
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  statTitle: { fontSize: 11, fontWeight: "700", color: "#64748b", textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "900", color: "#0f172a" },
  statIconBox: { padding: 10, borderRadius: 12 },
  
  trendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  trendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  trendText: { fontSize: 10, fontWeight: 'bold', color: '#16a34a', marginLeft: 2 },
  trendLabel: { fontSize: 10, color: '#94a3b8' },


  chartsContainer: { padding: 16, gap: 20 },
  card: { backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e2e8f0", elevation: 2 },
  cardHeader: { marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },


  section: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#111827", marginBottom: 16 },
  activityGrid: { gap: 10 },
  activityCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc', 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#f1f5f9',
    gap: 12
  },
  iconCircle: { padding: 8, borderRadius: 20 },
  bgEmerald: { backgroundColor: '#d1fae5' }, 
  bgBlue: { backgroundColor: '#dbeafe' },    
  bgViolet: { backgroundColor: '#ede9fe' },  
  
  actMessage: { fontSize: 13, fontWeight: "600", color: "#1e293b" },
  actDate: { fontSize: 11, color: "#94a3b8", marginTop: 2, fontWeight: "bold", textTransform: 'uppercase' }
});