import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image
} from 'react-native';
import axiosClient from '../../api/axiosClient';
import {
  History, CheckCircle, XCircle, Clock, CreditCard, MapPin, User, Calendar, ChevronRight, Download, Filter
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProviderHistoryScreen() {
  const navigation = useNavigation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    axiosClient.get('/orders/provider-history')
      .then(res => setJobs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const completed = jobs.filter(j => j.statusCode === 4).length;
 
    const cancelled = jobs.filter(j => j.statusCode === 5 || j.statusCode === 6).length;
    const totalRevenue = jobs
      .filter(j => j.statusCode === 4)
      .reduce((s, j) => s + (parseFloat(j.price) || 0), 0);
    return { total: jobs.length, completed, cancelled, totalRevenue: Math.round(totalRevenue) };
  }, [jobs]);

  const filteredJobs = jobs.filter(j => {
    if (filter === 'completed') return j.statusCode === 4;
    if (filter === 'cancelled') return j.statusCode === 5 || j.statusCode === 6;
    return true;
  });

  if (loading) return (
    <View style={styles.center}>
       <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#EFF6FF', '#FFFFFF']} style={styles.header}>
        <View style={styles.headerTop}>
           <View>
             <Text style={styles.title}><History size={24} color="#2563EB" /> Historique</Text>
             <Text style={styles.subtitle}>Vos missions terminées ou annulées</Text>
           </View>
           <TouchableOpacity style={styles.exportBtn}>
             <Download size={18} color="#4B5563" />
           </TouchableOpacity>
        </View>

        {/* STATS CARDS */}
        <View style={styles.statsRow}>
           <View style={styles.statCard}>
              <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                 <Text style={styles.statLabel}>Total</Text>
                 <View style={[styles.iconBox, {backgroundColor:'#EFF6FF'}]}><History size={16} color="#2563EB"/></View>
              </View>
              <Text style={styles.statValue}>{stats.total}</Text>
           </View>
           <View style={styles.statCard}>
              <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                 <Text style={styles.statLabel}>Fini</Text>
                 <View style={[styles.iconBox, {backgroundColor:'#F0FDF4'}]}><CheckCircle size={16} color="#16A34A"/></View>
              </View>
              <Text style={[styles.statValue, {color:'#16A34A'}]}>{stats.completed}</Text>
           </View>
           <View style={styles.statCard}>
              <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                 <Text style={styles.statLabel}>Annulé</Text>
                 <View style={[styles.iconBox, {backgroundColor:'#FEF2F2'}]}><XCircle size={16} color="#DC2626"/></View>
              </View>
              <Text style={[styles.statValue, {color:'#DC2626'}]}>{stats.cancelled}</Text>
           </View>
        </View>
      </LinearGradient>

      {/* FILTRES */}
      <View style={styles.filterRow}>
         {['all', 'completed', 'cancelled'].map(f => (
           <TouchableOpacity 
             key={f} 
             style={[styles.filterPill, filter === f && styles.filterPillActive, f==='completed' && filter===f && {backgroundColor:'#DCFCE7'}, f==='cancelled' && filter===f && {backgroundColor:'#FEE2E2'}]}
             onPress={() => setFilter(f)}
           >
             <Text style={[
               styles.filterText, 
               filter === f && styles.filterTextActive,
               f==='completed' && filter===f && {color:'#166534'},
               f==='cancelled' && filter===f && {color:'#991B1B'}
             ]}>
               {f === 'all' ? 'Toutes' : f === 'completed' ? 'Terminées' : 'Annulées'} ({f === 'all' ? jobs.length : f === 'completed' ? stats.completed : stats.cancelled})
             </Text>
           </TouchableOpacity>
         ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filteredJobs.length === 0 ? (
          <View style={styles.emptyState}>
             <History size={48} color="#CBD5E1" />
             <Text style={styles.emptyText}>Aucune mission trouvée</Text>
          </View>
        ) : (
          filteredJobs.map((job, idx) => (
            <TouchableOpacity 
              key={job.id} 
              style={styles.card}
              onPress={() => navigation.navigate('ProviderJob', { id: job.id })}
              activeOpacity={0.9}
            >
               <View style={styles.cardHeader}>
                  <View style={[styles.statusIcon, job.statusCode === 4 ? styles.statusSuccess : (job.statusCode===5||job.statusCode===6) ? styles.statusError : styles.statusInfo]}>
                     {job.statusCode === 4 ? <CheckCircle size={20} color="#16A34A"/> : (job.statusCode===5||job.statusCode===6) ? <XCircle size={20} color="#DC2626"/> : <Clock size={20} color="#2563EB"/>}
                  </View>
                  <View style={{flex:1}}>
                     <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                        <Text style={styles.jobTitle}>{job.serviceName}</Text>
                        <Text style={[styles.statusTag, job.statusCode === 4 ? {backgroundColor:'#DCFCE7', color:'#166534'} : {backgroundColor:'#FEE2E2', color:'#991B1B'}]}>
                           {job.statusCode === 4 ? "TERMINÉE" : "ANNULÉE"}
                        </Text>
                     </View>
                     
                     <View style={styles.metaRow}>
                        <View style={styles.metaItem}><User size={12} color="#64748B"/><Text style={styles.metaText}>{job.clientName}</Text></View>
                        <View style={styles.metaItem}><Calendar size={12} color="#64748B"/><Text style={styles.metaText}>{new Date(job.createdAt).toLocaleDateString()}</Text></View>
                     </View>
                  </View>
               </View>

               <View style={styles.cardDivider}/>

               <View style={styles.cardFooter}>
                  <Text style={styles.price}>{job.price} MAD</Text>
                  <View style={{flexDirection:'row', gap: 10}}>
                     <View style={styles.btnSmall}><Text style={styles.btnSmallText}>Détails</Text><ChevronRight size={14} color="#2563EB"/></View>
                  </View>
               </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 50, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingBottom: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', flexDirection: 'row', alignItems: 'center' },
  subtitle: { color: '#6B7280', fontSize: 13, marginTop: 4 },
  exportBtn: { padding: 10, backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', shadowColor:'#000', shadowOpacity:0.03, elevation: 1 },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 6 },
  iconBox: { padding: 4, borderRadius: 6 },

  filterRow: { flexDirection: 'row', paddingHorizontal: 20, marginVertical: 16, gap: 10 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB' },
  filterPillActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#1D4ED8' },

  list: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', marginTop: 40, padding: 40, backgroundColor: 'white', borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB' },
  emptyText: { marginTop: 10, color: '#94A3B8', fontWeight: 'bold' },

  card: { backgroundColor: 'white', borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 16, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  cardHeader: { flexDirection: 'row', gap: 12 },
  statusIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  statusSuccess: { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' },
  statusError: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  statusInfo: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  
  jobTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  statusTag: { fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#64748B' },

  cardDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 18, fontWeight: 'bold', color: '#2563EB' },
  btnSmall: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnSmallText: { fontSize: 12, fontWeight: 'bold', color: '#2563EB' }
});