import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Image, Dimensions, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import axiosClient from '../../api/axiosClient';
import { useSignalR } from '../../context/SignalRContext';
import {
  Power, MapPin, Clock, Sparkles, Briefcase, ChevronRight, Bell, Calendar,
  TrendingUp, Star, Target, CheckCircle, AlertCircle, X, DollarSign, Wallet
} from 'lucide-react-native';

const { width } = Dimensions.get('window');


const StatusBadge = ({ status }) => {
  const stylesMap = {
    1: { label: "En Attente", bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
    2: { label: "Accepté", bg: "#CCFBF1", text: "#0F766E", border: "#99F6E4" },
    3: { label: "En Route", bg: "#FFEDD5", text: "#C2410C", border: "#FED7AA" },
    4: { label: "En Cours", bg: "#EDE9FE", text: "#6D28D9", border: "#DDD6FE" },
    5: { label: "Terminé", bg: "#F9FAFB", text: "#374151", border: "#E5E7EB" },
    6: { label: "Annulé", bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" },
    7: { label: "Confirmé", bg: "#dcfce7", text: "#15803d", border: "#86efac" }, 
  };
  const current = stylesMap[status] || { label: "Inconnu", bg: "#F3F4F6", text: "#6B7280", border: "#E5E7EB" };

  return (
    <View style={[styles.badge, { backgroundColor: current.bg, borderColor: current.border }]}>
      <Text style={[styles.badgeText, { color: current.text }]}>{current.label}</Text>
    </View>
  );
};

export default function ProviderDashboardScreen() {
  const navigation = useNavigation();
  const { connection } = useSignalR();
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [notifications] = useState([{ id: 1, text: "Bienvenue sur votre tableau de bord !", type: "info" }]);

  const fetchDashboardData = async () => {
    try {
      const [pRes, jRes] = await Promise.all([
        axiosClient.get('/provider/me').catch(() => ({ data: null })),
        axiosClient.get('/provider/jobs/assigned').catch(() => ({ data: [] }))
      ]);
      if (pRes.data) setProfile(pRes.data);
      if (jRes.data) setJobs(jRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (connection) {
      connection.off("JobAssigned");
      connection.on("JobAssigned", (data) => {
        Toast.show({ type: 'success', text1: 'Nouvelle Mission !', text2: `${data.price} MAD` });
        fetchDashboardData();
      });
    }
  }, [connection]);

  const toggleAvailability = async () => {
    if (!profile) return;
    const newState = !profile.isAvailable;
    try {
      await axiosClient.put('/provider/availability', { isAvailable: newState, lat: 33.5731, lng: -7.5898 });
      setProfile(prev => ({ ...prev, isAvailable: newState }));
      Toast.show({ type: 'success', text1: newState ? "Vous êtes EN LIGNE" : "Vous êtes HORS LIGNE" });
    } catch (e) { Toast.show({ type: 'error', text1: "Erreur connexion" }); }
  };

  const handleResponse = async (jobId, accepted) => {
    try {
      await axiosClient.post(`/orders/${jobId}/respond`, { accepted });
      Toast.show({ type: 'success', text1: accepted ? "Mission acceptée" : "Mission refusée" });
      fetchDashboardData();
    } catch (e) { Toast.show({ type: 'error', text1: "Erreur réponse" }); }
  };

  const stats = [
    { title: "Revenus du mois", value: `${profile?.caMoisCourant || 0} MAD`, change: "+12%", icon: TrendingUp, color: "#16A34A", bg: "#F0FDF4", border: "#DCFCE7" },
    { title: "Missions terminées", value: `${profile?.completedJobsMonth || 0}`, change: "+3", icon: CheckCircle, color: "#2563EB", bg: "#EFF6FF", border: "#DBEAFE" },
    { title: "Note moyenne", value: profile?.rating ? Number(profile.rating).toFixed(1) : "5.0", change: "+0.0", icon: Star, color: "#CA8A04", bg: "#FEFCE8", border: "#FEF9C3" },
    { title: "Taux d'acceptation", value: "95%", change: "+0%", icon: Target, color: "#7C3AED", bg: "#F5F3FF", border: "#EDE9FE" },
  ];

  const metrics = [
    { label: "Temps de réponse", value: "Instant", target: "≤5 min", status: "good", pct: 95 },
    { label: "Rayon d'action", value: `${profile?.rayonKm || 10} km`, target: "≤20 km", status: "good", pct: 90 },
    { label: "Satisfaction", value: "100%", target: "≥95%", status: "good", pct: 100 },
  ];

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* HEADER GRADIENT */}
        <LinearGradient
          colors={['#2563EB', '#0D9488']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={styles.pill}>
              <Briefcase size={14} color="white" />
              <Text style={styles.pillText}>Espace Prestataire</Text>
            </View>
            <View style={styles.datePill}>
              <Text style={styles.pillText}>Aujourd'hui</Text>
            </View>
          </View>

          <View style={styles.headerContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeTitle}>Bonjour, {profile?.providerName}</Text>
              <View style={styles.locationRow}>
                <MapPin size={16} color="#DBEAFE" />
                <Text style={styles.locationText}>Casablanca • {profile?.isAvailable ? "Prêt" : "Pause"}</Text>
                <View style={styles.ratingBadge}>
                  <Star size={12} fill="white" color="white" />
                  <Text style={styles.ratingText}>{profile?.rating ? Number(profile.rating).toFixed(1) : "5.0"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.headerActions}>
               <TouchableOpacity style={styles.iconBtn} onPress={() => setShowNotifications(true)}>
                 <Bell size={20} color="white" />
                 {notifications.length > 0 && <View style={styles.dot} />}
               </TouchableOpacity>
               <TouchableOpacity style={styles.iconBtn} onPress={() => setShowScheduleModal(true)}>
                 <Calendar size={20} color="white" />
               </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.toggleBtn, profile?.isAvailable ? styles.toggleOn : styles.toggleOff]}
            onPress={toggleAvailability}
            activeOpacity={0.9}
          >
             <View style={[styles.toggleIcon, { backgroundColor: profile?.isAvailable ? '#DBEAFE' : '#374151' }]}>
               <Power size={18} color={profile?.isAvailable ? '#2563EB' : '#9CA3AF'} />
             </View>
             <Text style={[styles.toggleText, { color: profile?.isAvailable ? '#1D4ED8' : '#D1D5DB' }]}>
               {profile?.isAvailable ? "EN LIGNE" : "HORS LIGNE"}
             </Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.content}>
          
          {/* STATS GRID */}
          <View style={styles.statsGrid}>
            {stats.map((stat, idx) => (
              <View key={idx} style={[styles.statCard, { backgroundColor: stat.bg, borderColor: stat.border }]}>
                <View style={styles.statHeader}>
                  <View>
                    <Text style={styles.statLabel}>{stat.title}</Text>
                    <Text style={styles.statValue}>{stat.value}</Text>
                  </View>
                  <View style={[styles.statIconBox, { borderColor: stat.border }]}>
                    <stat.icon size={18} color={stat.color} />
                  </View>
                </View>
                <Text style={[styles.statChange, { color: '#16A34A' }]}>{stat.change} <Text style={{color: '#64748b', fontWeight:'normal'}}>vs mois dernier</Text></Text>
              </View>
            ))}
          </View>

          {/* ACTIONS RAPIDES */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}><Sparkles size={18} color="#3B82F6"/> Actions rapides</Text>
            <View style={styles.quickActions}>
              {[
                { title: 'Disponibilité', icon: Calendar, color: '#2563EB', bg: '#EFF6FF', border: '#DBEAFE', action: () => setShowScheduleModal(true) },
                { title: 'Revenus', icon: DollarSign, color: '#16A34A', bg: '#F0FDF4', border: '#DCFCE7', action: () => Toast.show({type:'info', text1:'Bientôt disponible'}) },
                { title: 'Services', icon: Briefcase, color: '#7C3AED', bg: '#F5F3FF', border: '#EDE9FE', action: () => Toast.show({type:'info', text1:'Bientôt disponible'}) },
              ].map((item, i) => (
                <TouchableOpacity key={i} style={[styles.quickBtn, { backgroundColor: item.bg, borderColor: item.border }]} onPress={item.action}>
                  <View style={[styles.quickIcon, { backgroundColor: 'white', borderColor: item.border }]}>
                    <item.icon size={20} color={item.color} />
                  </View>
                  <Text style={styles.quickText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* INDICATEURS PERFORMANCE */}
          <View style={styles.metricsCard}>
            <Text style={styles.sectionTitle}><Target size={18} color="#3B82F6"/> Indicateurs</Text>
            <View style={styles.metricsGrid}>
               {metrics.map((m, i) => (
                 <View key={i} style={styles.metricItem}>
                    <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                      <Text style={styles.metricLabel}>{m.label}</Text>
                      <CheckCircle size={14} color="#22C55E" />
                    </View>
                    <View style={{flexDirection:'row', alignItems:'baseline', gap: 6}}>
                       <Text style={styles.metricValue}>{m.value}</Text>
                       <Text style={styles.metricTarget}>Obj: {m.target}</Text>
                    </View>
                    <View style={styles.progressBar}>
                       <View style={[styles.progressFill, { width: `${m.pct}%` }]} />
                    </View>
                 </View>
               ))}
            </View>
          </View>

          {/* LISTE DES MISSIONS */}
          <View style={styles.section}>
             <View style={styles.missionsHeader}>
                <Text style={styles.sectionTitle}><Briefcase size={18} color="#3B82F6"/> Missions Assignées</Text>
                <View style={styles.countBadge}><Text style={styles.countText}>{jobs.length}</Text></View>
             </View>

             {jobs.length === 0 ? (
               <View style={styles.emptyState}>
                 <Briefcase size={40} color="#CBD5E1" />
                 <Text style={styles.emptyTitle}>Aucune mission</Text>
                 <Text style={styles.emptySubtitle}>Restez en ligne pour recevoir des demandes.</Text>
               </View>
             ) : (
               jobs.map((job) => (
                 <View key={job.id} style={styles.jobCard}>
                    <View style={styles.jobHeader}>
                       <StatusBadge status={job.status} />
                       <View style={styles.timeRow}>
                         <Clock size={12} color="#94A3B8" />
                         <Text style={styles.timeText}>
                           {job.createdAt ? new Date(job.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}
                         </Text>
                       </View>
                    </View>

                    <Text style={styles.jobAddress}>{job.address}</Text>
                    <View style={styles.jobMeta}>
                       <View style={styles.metaItem}><MapPin size={14} color="#3B82F6"/><Text style={styles.metaText}>{job.distanceKm?.toFixed(1)} km</Text></View>
                       <View style={styles.metaItem}><TrendingUp size={14} color="#94A3B8"/><Text style={styles.metaText}>{job.clientName}</Text></View>
                    </View>

                    <View style={styles.jobFooter}>
                       <Text style={styles.jobPrice}>{job.price} <Text style={{fontSize:12, color:'#64748B'}}>MAD</Text></Text>
                       {job.status === 1 ? (
                         <View style={{flexDirection:'row', gap:8}}>
                            <TouchableOpacity onPress={() => handleResponse(job.id, false)} style={styles.rejectBtn}><X size={16} color="#DC2626"/><Text style={styles.rejectText}>Refuser</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => handleResponse(job.id, true)} style={styles.acceptBtn}><CheckCircle size={16} color="white"/><Text style={styles.acceptText}>Accepter</Text></TouchableOpacity>
                         </View>
                       ) : (
                         <TouchableOpacity onPress={() => navigation.navigate('ProviderJob', { id: job.id })} style={styles.detailsBtn}>
                            <Text style={styles.detailsText}>Voir détails</Text>
                            <ChevronRight size={16} color="#2563EB" />
                         </TouchableOpacity>
                       )}
                    </View>
                 </View>
               ))
             )}
          </View>

        </View>
      </ScrollView>

      {/* MODALS */}
      <Modal visible={showNotifications} transparent animationType="fade" onRequestClose={() => setShowNotifications(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNotifications(false)}>
           <View style={styles.notifModal}>
              <Text style={styles.modalTitle}>Notifications</Text>
              {notifications.map((n, i) => (
                <View key={i} style={styles.notifItem}>
                   <Text style={styles.notifText}>{n.text}</Text>
                </View>
              ))}
           </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showScheduleModal} transparent animationType="slide" onRequestClose={() => setShowScheduleModal(false)}>
         <View style={styles.modalOverlay}>
            <View style={styles.scheduleModal}>
               <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Planning Type</Text>
                  <TouchableOpacity onPress={() => setShowScheduleModal(false)}><X size={24} color="#64748B"/></TouchableOpacity>
               </View>
               <ScrollView style={{maxHeight: 400}}>
                  {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day) => (
                     <View key={day} style={styles.dayRow}>
                        <Text style={styles.dayText}>{day}</Text>
                        <View style={{flexDirection:'row', alignItems:'center', gap: 8}}>
                           <View style={styles.timeBox}><Text>09:00</Text></View>
                           <Text>-</Text>
                           <View style={styles.timeBox}><Text>18:00</Text></View>
                        </View>
                     </View>
                  ))}
               </ScrollView>
               <TouchableOpacity style={styles.saveBtn} onPress={() => setShowScheduleModal(false)}>
                  <Text style={styles.saveText}>Enregistrer</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  header: { paddingTop: 60, paddingBottom: 80, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  datePill: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pillText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { color: '#DBEAFE', fontSize: 13, fontWeight: '600' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  ratingText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', position: 'absolute', top: 8, right: 8 },

  toggleBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, marginTop: 20, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5
  },
  toggleOn: { backgroundColor: 'white' },
  toggleOff: { backgroundColor: '#1F2937' },
  toggleIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  toggleText: { fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },

  // Content
  content: { marginTop: -40, paddingHorizontal: 20 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: (width - 50) / 2, padding: 16, borderRadius: 16, borderWidth: 1 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginTop: 4 },
  statIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  statChange: { fontSize: 12, fontWeight: 'bold' },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickActions: { flexDirection: 'row', gap: 10 },
  quickBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  quickIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1 },
  quickText: { fontSize: 11, fontWeight: 'bold', color: '#1E293B', textAlign: 'center' },

  metricsCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricItem: { width: '48%', marginBottom: 10, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  metricLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  metricValue: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  metricTarget: { fontSize: 10, color: '#94A3B8' },
  progressBar: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, marginTop: 8 },
  progressFill: { height: 6, backgroundColor: '#22C55E', borderRadius: 3 },

  missionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  countBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  countText: { color: '#1D4ED8', fontWeight: 'bold', fontSize: 12 },
  
  emptyState: { alignItems: 'center', padding: 30, backgroundColor: 'white', borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginTop: 10 },
  emptySubtitle: { fontSize: 12, color: '#64748B' },

  jobCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  
  jobAddress: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  jobMeta: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  jobPrice: { fontSize: 18, fontWeight: 'bold', color: '#0D9488' },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  detailsText: { color: '#2563EB', fontWeight: 'bold', fontSize: 12 },
  
  rejectBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#FECACA' },
  rejectText: { color: '#DC2626', fontWeight: 'bold', fontSize: 12 },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  acceptText: { color: 'white', fontWeight: 'bold', fontSize: 12 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  notifModal: { backgroundColor: 'white', borderRadius: 16, width: '100%', padding: 20, maxWidth: 350 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  notifItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  notifText: { fontSize: 14, color: '#334155' },
  
  scheduleModal: { backgroundColor: 'white', borderRadius: 16, width: '100%', padding: 20, maxHeight: 500 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dayText: { fontWeight: 'bold', color: '#334155' },
  timeBox: { backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  saveBtn: { backgroundColor: '#2563EB', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  saveText: { color: 'white', fontWeight: 'bold' }
});