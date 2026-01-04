import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, TextInput, Dimensions, Image
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axiosClient from '../../api/axiosClient';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import {
  ArrowLeft, MapPin, Clock, User, MessageCircle, Send, X, Play, CheckSquare, Wallet, ShieldCheck, AlertTriangle
} from 'lucide-react-native';
import ActiveJobTracking from '../../components/maps/ActiveJobTracking';

const { width } = Dimensions.get('window');


const ChatSheet = ({ visible, onClose, jobId, clientName }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (visible && jobId) {
       axiosClient.get(`/orders/${jobId}`).then(res => setMessages(res.data.messages || []));
    }
  }, [visible, jobId]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      await axiosClient.post(`/orders/${jobId}/messages`, { content: text });
      setMessages([...messages, { content: text, isMe: true, sentAt: new Date() }]);
      setText('');
    } catch (e) { Toast.show({type:'error', text1:'Erreur envoi'}); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
         <View style={styles.chatSheet}>
            <View style={styles.chatHeader}>
               <View style={{flexDirection:'row', alignItems:'center', gap: 10}}>
                  <View style={styles.chatAvatar}><Text style={{color:'white', fontWeight:'bold'}}>{clientName?.[0]}</Text></View>
                  <View><Text style={styles.chatName}>{clientName}</Text><Text style={styles.chatOnline}>En ligne</Text></View>
               </View>
               <TouchableOpacity onPress={onClose}><X size={24} color="#9CA3AF"/></TouchableOpacity>
            </View>
            <ScrollView style={styles.chatBody} contentContainerStyle={{padding: 16}}>
               {messages.length === 0 && <Text style={{textAlign:'center', color:'#9CA3AF', marginTop: 50}}>Démarrez la conversation...</Text>}
               {messages.map((m, i) => (
                 <View key={i} style={[styles.msgBubble, m.isMe ? styles.msgMe : styles.msgOther]}>
                    <Text style={[styles.msgText, m.isMe && {color:'white'}]}>{m.content}</Text>
                 </View>
               ))}
            </ScrollView>
            <View style={styles.chatInputRow}>
               <TextInput style={styles.chatInput} placeholder="Votre message..." value={text} onChangeText={setText} />
               <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}><Send size={18} color="white"/></TouchableOpacity>
            </View>
         </View>
      </View>
    </Modal>
  );
};

export default function ProviderJobDetailsScreen({ route }) {
  const { id } = route.params;
  const navigation = useNavigation();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  const fetchJob = async () => {
    try {
      const res = await axiosClient.get(`/orders/${id}`);
      setJob(res.data);
    } catch {
      Toast.show({ type: 'error', text1: 'Erreur chargement' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJob(); }, [id]);

  const updateStatus = async (status) => {
    try {
      await axiosClient.post(`/orders/${id}/status`, { status });
      Toast.show({ type: 'success', text1: 'Statut mis à jour' });
      fetchJob();
    } catch {
      Toast.show({ type: 'error', text1: 'Action impossible' });
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0D9488"/></View>;
  if (!job) return null;

  const showTracking = [2, 3, 7, 4].includes(job.statusCode);

  return (
    <View style={styles.container}>
     
       <LinearGradient colors={['#0D9488', '#2563EB']} style={styles.header} start={{x:0, y:0}} end={{x:1, y:1}}>
          <View style={styles.headerTop}>
             <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backPill}>
                <ArrowLeft size={16} color="white" />
                <Text style={{color:'white', fontWeight:'bold', fontSize:12}}>Retour</Text>
             </TouchableOpacity>
          </View>
          <View style={styles.headerContent}>
             <View>
                <View style={{flexDirection:'row', alignItems:'center', gap: 6, marginBottom: 4}}>
                   <Clock size={14} color="#A5F3FC"/>
                   <Text style={{color:'#A5F3FC', fontWeight:'bold', fontSize:12}}>CMD #{job.id.substring(0,8).toUpperCase()}</Text>
                </View>
                <Text style={styles.serviceTitle}>{job.serviceName}</Text>
             </View>
             {!showChat && (
                <TouchableOpacity style={styles.chatFloat} onPress={() => setShowChat(true)}>
                   <MessageCircle size={20} color="#2563EB"/>
                   <Text style={{color:'#2563EB', fontWeight:'bold', fontSize:12}}>Chat</Text>
                </TouchableOpacity>
             )}
          </View>
       </LinearGradient>

       <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.mainCard}>
             
             {/* SECTION ADRESSE */}
             <View style={styles.addressRow}>
                <View style={styles.addressIcon}><MapPin size={24} color="#0D9488"/></View>
                <View style={{flex:1}}>
                   <Text style={styles.label}>ADRESSE D'INTERVENTION</Text>
                   <Text style={styles.addressVal}>{job.address}</Text>
                </View>
             </View>

             <View style={styles.divider}/>

             {/* INFO GRID */}
             <View style={styles.grid}>
                <View style={styles.infoBox}>
                   <View style={styles.avatar}><User size={20} color="#2563EB"/></View>
                   <View>
                      <Text style={styles.label}>CLIENT</Text>
                      <Text style={styles.infoVal}>{job.clientName}</Text>
                   </View>
                </View>
                <LinearGradient colors={['#F0FDFA', '#EFF6FF']} style={[styles.infoBox, {borderWidth:1, borderColor:'#CCFBF1'}]}>
                   <View style={[styles.avatar, {backgroundColor:'white'}]}><Wallet size={20} color="#0D9488"/></View>
                   <View>
                      <Text style={[styles.label, {color:'#0F766E'}]}>REVENU NET</Text>
                      <Text style={[styles.infoVal, {color:'#0F766E'}]}>{job.price} MAD</Text>
                   </View>
                </LinearGradient>
             </View>

             <View style={styles.timelineBox}>
                 <Text style={styles.label}>CHRONOLOGIE DE LA MISSION</Text>
                 <View style={{flexDirection:'row', justifyContent:'space-between', marginTop: 10}}>
                     <View>
                         <Text style={styles.timeLabel}>Début</Text>
                
                         <Text style={styles.timeVal}>
                             {job.createdAt ? new Date(job.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                         </Text>
                     </View>
                     <View style={{alignItems:'flex-end'}}>
                         <Text style={styles.timeLabel}>Fin estimée</Text>
             
                         <Text style={styles.timeVal}>
                             {job.statusCode === 4 ? "Terminé" : "En cours..."}
                         </Text>
                     </View>
                 </View>
           
                 <View style={styles.timeBar}>
                     <View style={[styles.timeFill, { width: job.statusCode === 4 ? '100%' : (job.statusCode===3 ? '50%' : '5%') }]} />
                 </View>
             </View>

    
             <View style={styles.actions}>
                {job.statusCode === 2 && (
                   <View style={[styles.alertBox, {backgroundColor:'#FFFBEB', borderColor:'#FEF3C7'}]}>
                      <AlertTriangle size={24} color="#D97706"/>
                      <View style={{flex:1}}>
                         <Text style={{fontWeight:'bold', color:'#92400E'}}>Paiement en attente</Text>
                         <Text style={{fontSize:12, color:'#92400E'}}>Attendez la confirmation du paiement avant de démarrer.</Text>
                      </View>
                   </View>
                )}

                {job.statusCode === 7 && (
                   <View style={[styles.alertBox, {backgroundColor:'#EFF6FF', borderColor:'#DBEAFE', flexDirection:'column', alignItems:'center', textAlign:'center'}]}>
                      <Text style={{color:'#1E40AF', fontWeight:'bold', marginBottom:10}}>Le client a payé. Vous pouvez y aller.</Text>
                      <TouchableOpacity style={[styles.btnLarge, {backgroundColor:'#2563EB'}]} onPress={() => updateStatus('in_progress')}>
                         <Play size={20} color="white" fill="white"/>
                         <Text style={styles.btnLargeText}>Démarrer la mission</Text>
                      </TouchableOpacity>
                   </View>
                )}

                {(job.statusCode === 3 || job.statusCode === 4) && job.statusCode !== 4 && (
                   <View style={{gap: 10}}>
                      <View style={styles.statusPill}>
                         <ActivityIndicator size="small" color="#3B82F6" />
                         <Text style={{color:'#1D4ED8', fontWeight:'bold'}}>Mission en cours...</Text>
                      </View>
                      <TouchableOpacity style={[styles.btnLarge, {backgroundColor:'#16A34A'}]} onPress={() => updateStatus('completed')}>
                         <CheckSquare size={20} color="white"/>
                         <Text style={styles.btnLargeText}>Marquer comme terminée</Text>
                      </TouchableOpacity>
                   </View>
                )}
                
                {job.statusCode === 4 && (
                    <View style={[styles.alertBox, {backgroundColor:'#F0FDF4', borderColor:'#DCFCE7', flexDirection:'column', alignItems:'center'}]}>
                        <ShieldCheck size={40} color="#16A34A" />
                        <Text style={{fontSize:18, fontWeight:'bold', color:'#166534', marginTop:8}}>Mission Accomplie !</Text>
                        <Text style={{color:'#15803D'}}>Les fonds sont débloqués.</Text>
                    </View>
                )}
             </View>

             {/* TRACKING */}
             {showTracking && (
                <View style={styles.trackingSection}>
                   <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:10}}>
                      <View style={{flexDirection:'row', gap:8}}>
                         <MapPin size={18} color="#0D9488"/>
                         <Text style={{fontWeight:'bold', color:'#1F2937'}}>Tracking GPS</Text>
                      </View>
                      <View style={styles.liveBadge}><Text style={{fontSize:10, fontWeight:'bold', color:'#6B7280'}}>ACTIF</Text></View>
                   </View>
                   <View style={styles.mapBox}>
                      <ActiveJobTracking job={job} isProvider={true} />
                   </View>
                </View>
             )}

          </View>
       </ScrollView>

       <ChatSheet visible={showChat} onClose={() => setShowChat(false)} jobId={job.id} clientName={job.clientName}/>
       <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 50, paddingBottom: 60, paddingHorizontal: 20 },
  headerTop: { marginBottom: 20 },
  backPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start' },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  serviceTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  chatFloat: { backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, elevation: 4 },
  
  content: { marginTop: -40, paddingHorizontal: 16, paddingBottom: 40 },
  mainCard: { backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, elevation: 3 },
  
  addressRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  addressIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#F0FDFA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#CCFBF1' },
  label: { fontSize: 10, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 4 },
  addressVal: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 24 },

  grid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  infoBox: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, elevation: 1 },
  infoVal: { fontSize: 16, fontWeight: 'bold', color: '#111827' },

  timelineBox: { marginBottom: 24, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  timeLabel: { fontSize: 12, color: '#64748B', marginBottom: 2 },
  timeVal: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  timeBar: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  timeFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 3 },

  actions: { marginBottom: 24 },
  alertBox: { padding: 20, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 16 },
  btnLarge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, width: '100%', elevation: 4 },
  btnLargeText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  statusPill: { backgroundColor: '#EFF6FF', padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#DBEAFE' },

  trackingSection: { paddingTop: 24, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  liveBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  mapBox: { height: 300, borderRadius: 16, overflow: 'hidden', backgroundColor: '#E5E7EB' },

  // Chat Sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  chatSheet: { height: '70%', backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  chatHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  chatName: { fontWeight: 'bold', color: '#111827' },
  chatOnline: { fontSize: 10, color: '#16A34A', fontWeight: 'bold' },
  chatBody: { flex: 1, backgroundColor: '#F9FAFB' },
  msgBubble: { padding: 12, borderRadius: 16, marginBottom: 10, maxWidth: '80%' },
  msgMe: { backgroundColor: '#2563EB', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  msgOther: { backgroundColor: 'white', alignSelf: 'flex-start', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#E5E7EB' },
  msgText: { fontSize: 14, color: '#374151' },
  chatInputRow: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', gap: 10 },
  chatInput: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 16, height: 44 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' }
});