import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput, StatusBar, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosClient from '../../api/axiosClient';
import ActiveJobTracking from '../../components/maps/ActiveJobTracking'; 
import { 
    Phone, MessageCircle, MapPin, CheckCircle, CreditCard, Send, 
    FileText, ArrowLeft, Calendar, Clock, Shield, Star, User, ChevronRight,
    Navigation, Wallet, AlertCircle, Map
} from 'lucide-react-native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ClientOrderDetailsScreen({ route, navigation }) {
    const { orderId } = route.params;
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('details');
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        fetchDetails();
    }, [orderId]);

    const fetchDetails = async () => {
        try {
            const res = await axiosClient.get(`/orders/${orderId}`);
            setJob(res.data);
           
            if (res.data.statusCode === 3) setActiveTab('map');
        } catch (e) {
            console.error(e);
            Alert.alert("Erreur", "Impossible de charger la commande");
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        try {
            await axiosClient.post(`/orders/${orderId}/messages`, { content: newMessage });
            setNewMessage('');
            fetchDetails(); 
        } catch (e) { Alert.alert("Erreur envoi"); }
    };

    const getStatusStyle = (status) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('pending') || s === '1') return { bg: ['#fef3c7', '#fde68a'], text: '#92400e', label: 'En attente', icon: Clock };
        if (s.includes('assigned') || s === '2') return { bg: ['#dbeafe', '#bfdbfe'], text: '#1e40af', label: 'Acceptée', icon: CheckCircle };
        if (s.includes('inprogress') || s === '3') return { bg: ['#e0e7ff', '#c7d2fe'], text: '#3730a3', label: 'En cours', icon: Navigation };
        if (s.includes('completed') || s === '4') return { bg: ['#dcfce7', '#bbf7d0'], text: '#166534', label: 'Terminée', icon: CheckCircle };
        if (s.includes('cancelled') || s.includes('rejected')) return { bg: ['#fee2e2', '#fecaca'], text: '#991b1b', label: 'Annulée', icon: AlertCircle };
        return { bg: ['#f3f4f6', '#e5e7eb'], text: '#374151', label: s, icon: FileText };
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#0d9488"/>
            <Text style={styles.loadingText}>Chargement...</Text>
        </View>
    );

    if (!job) return null;

    const statusStyle = getStatusStyle(job.status || job.statusCode?.toString());

    const statusLower = (job.status || '').toString().toLowerCase();
    const statusCode = job.statusCode;

    const isAccepted = statusCode === 2 || statusLower.includes('assigned') || statusLower.includes('accepted');
    const isRejected = statusCode === 6 || statusLower.includes('rejected');
    const isCancelled = statusCode === 5 || statusLower.includes('cancelled');

  
    const isPaid = !!(job.isPaid || job.paid || (job.paymentStatus && (job.paymentStatus === 'paid' || job.paymentStatus === 'captured')));
    const shouldEncouragePay = isAccepted && !isPaid;

    const isTracking = job.statusCode === 2 || job.statusCode === 3 || job.statusCode === 7; 

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
            
            <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.headerGradient}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Détails Commande</Text>
                    <View style={{width: 40}} />
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.mainCard}>
                    <View style={styles.serviceHeader}>
                        <LinearGradient colors={['#f0fdfa', '#ccfbf1']} style={styles.iconBox}>
                            <FileText size={26} color="#0d9488" />
                        </LinearGradient>
                        <View style={{flex: 1}}>
                            <Text style={styles.serviceTitle}>{job.serviceName || "Service"}</Text>
                            <View style={styles.dateRow}>
                                <Calendar size={14} color="#64748b" />
                                <Text style={styles.dateText}>
                                    {job.createdAt ? format(new Date(job.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr }) : ''}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.priceContainer}>
                            <Text style={styles.priceLabel}>Total</Text>
                            <Text style={styles.price}>{job.price} MAD</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <LinearGradient colors={statusStyle.bg} style={styles.statusBadge}>
                        <statusStyle.icon size={16} color={statusStyle.text} />
                        <Text style={[styles.statusText, { color: statusStyle.text, marginLeft: 6 }]}>{statusStyle.label}</Text>
                    </LinearGradient>

             
                    {(isRejected || isCancelled || shouldEncouragePay) && (
                        <View style={[
                            styles.banner,
                            isRejected || isCancelled ? styles.bannerDanger : styles.bannerSuccess
                        ]}>
                            <View style={styles.bannerRow}>
                                {isRejected || isCancelled ? (
                                    <AlertCircle size={18} color={isRejected || isCancelled ? '#991b1b' : '#0d9488'} />
                                ) : (
                                    <CheckCircle size={18} color="#0d9488" />
                                )}
                                <Text style={[
                                    styles.bannerText,
                                    isRejected || isCancelled ? { color: '#991b1b' } : { color: '#0d9488' }
                                ]}>
                                    {isRejected
                                        ? "Le prestataire a refusé votre commande. Vous pouvez en créer une nouvelle ou choisir un autre service."
                                        : isCancelled
                                            ? "Cette commande a été annulée."
                                            : "Votre commande a été acceptée  Procédez au paiement pour confirmer l’intervention."
                                    }
                                </Text>
                            </View>

                            {shouldEncouragePay && (
                                <TouchableOpacity
                                    style={styles.bannerPayBtn}
                                    onPress={() => navigation.navigate('Payment', { job })}
                                    activeOpacity={0.9}
                                >
                                    <CreditCard size={18} color="#ffffff" />
                                    <Text style={styles.bannerPayText}>Payer maintenant</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </LinearGradient>

                <View style={styles.tabContainer}>
                    {['details', 'map', 'chat'].map(t => (
                        <TouchableOpacity 
                            key={t} 
                            style={[styles.tabBtn, activeTab === t && styles.activeTabBtn]}
                            onPress={() => setActiveTab(t)}
                            disabled={t === 'map' && !isTracking}
                            activeOpacity={0.8}
                        >
                            {t === 'details' ? <FileText size={18} color={activeTab === t ? '#0d9488' : '#94a3b8'} /> :
                             t === 'map' ? <Map size={18} color={activeTab === t ? '#0d9488' : (!isTracking ? '#cbd5e1' : '#94a3b8')} /> :
                             <MessageCircle size={18} color={activeTab === t ? '#0d9488' : '#94a3b8'} />}
                            <Text style={[styles.tabText, activeTab === t && styles.activeTabText, t === 'map' && !isTracking && {color:'#cbd5e1'}]}>
                                {t === 'details' ? 'Infos' : t === 'map' ? 'Suivi' : 'Chat'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                
                {activeTab === 'details' && (
                    <View style={styles.tabContent}>
                        <View style={styles.infoCard}>
                            <View style={styles.sectionHeader}>
                                <User size={18} color="#0d9488" />
                                <Text style={styles.sectionTitle}>PRESTATAIRE</Text>
                            </View>
                            <View style={styles.providerRow}>
                                <LinearGradient colors={['#334155', '#1e293b']} style={styles.avatar}>
                                    <User size={24} color="white" />
                                </LinearGradient>
                                <View style={{flex:1, marginLeft: 15}}>
                                    <View style={styles.providerInfo}>
                                        <Text style={styles.providerName}>{job.providerName || 'Recherche en cours...'}</Text>
                                        <Shield size={16} color="#059669" fill="#059669" />
                                    </View>
                                    <View style={styles.ratingRow}>
                                        <Star size={14} color="#fbbf24" fill="#fbbf24" />
                                        <Text style={styles.ratingText}>{job.providerRating || '5.0'} (Vérifié)</Text>
                                    </View>
                                </View>
                                {job.providerPhone && (
                                    <TouchableOpacity style={styles.callBtn}>
                                        <Phone size={20} color="#ffffff"/>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={styles.infoCard}>
                            <View style={styles.sectionHeader}>
                                <MapPin size={18} color="#0d9488" />
                                <Text style={styles.sectionTitle}>LIEU D'INTERVENTION</Text>
                            </View>
                            <View style={styles.addressRow}>
                                <MapPin size={22} color="#64748b" style={{marginTop: 2}} />
                                <View style={{flex: 1}}>
                                    <Text style={styles.addressText}>{job.address || "Adresse GPS"}</Text>
                                    <Text style={styles.addressNote}>Localisation exacte partagée</Text>
                                </View>
                            </View>
                        </View>

                        
                    </View>
                )}

                {activeTab === 'map' && (
                    <View style={styles.mapContainer}>
                       
                        <View style={{flex: 1, width: '100%', height: '100%'}}>
                             <ActiveJobTracking job={job} isProvider={false} />
                        </View>
                    </View>
                )}

                {activeTab === 'chat' && (
                    <View style={styles.chatContainer}>
                        {job.messages?.length === 0 ? (
                            <View style={styles.emptyChat}>
                                <MessageCircle size={48} color="#e2e8f0" />
                                <Text style={styles.emptyChatText}>Aucun message pour le moment.</Text>
                            </View>
                        ) : (
                            job.messages?.map((msg, i) => (
                                <LinearGradient
                                    key={i}
                                    colors={msg.isMe ? ['#0d9488', '#0891b2'] : ['#ffffff', '#f8fafc']}
                                    style={[styles.msgBubble, msg.isMe ? styles.msgMe : styles.msgOther]}
                                >
                                    <Text style={msg.isMe ? styles.msgTextMe : styles.msgTextOther}>{msg.content || msg.text}</Text>
                                    <Text style={msg.isMe ? styles.msgTimeMe : styles.msgTimeOther}>
                                        {format(new Date(msg.timestamp || new Date()), 'HH:mm')}
                                    </Text>
                                </LinearGradient>
                            ))
                        )}
                        
                        <View style={styles.inputBar}>
                            <View style={styles.inputContainer}>
                                <TextInput 
                                    style={styles.inputField} 
                                    placeholder="Écrire un message..."
                                    placeholderTextColor="#94a3b8"
                                    value={newMessage}
                                    onChangeText={setNewMessage}
                                    multiline
                                />
                            </View>
                            <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
                                <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFill}/>
                                <Send color="white" size={20} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
    loadingText: { marginTop: 12, color: '#64748b', fontSize: 14 },
    
    headerGradient: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 8 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 50, paddingBottom: 24 },
    backButton: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
    
    content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 24 },
    mainCard: { backgroundColor: 'white', borderRadius: 24, padding: 24, marginBottom: 24, elevation: 6 },
    serviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    iconBox: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    serviceTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    dateText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
    priceContainer: { alignItems: 'flex-end' },
    priceLabel: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' },
    price: { fontSize: 22, fontWeight: 'bold', color: '#0d9488' },
    divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 20 },
    statusBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    statusText: { fontWeight: 'bold', fontSize: 13, textTransform: 'uppercase' },

   
    banner: { marginTop: 16, borderRadius: 16, padding: 14, borderWidth: 1 },
    bannerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    bannerText: { flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 18 },
    bannerSuccess: { backgroundColor: '#f0fdfa', borderColor: '#ccfbf1' },
    bannerDanger: { backgroundColor: '#fef2f2', borderColor: '#fee2e2' },
    bannerPayBtn: { marginTop: 12, backgroundColor: '#0d9488', borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
    bannerPayText: { color: '#fff', fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },

    tabContainer: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16, padding: 6, marginBottom: 24, elevation: 2 },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
    activeTabBtn: { backgroundColor: '#f8fafc' },
    tabText: { fontWeight: '600', color: '#64748b', fontSize: 14 },
    activeTabText: { color: '#0f172a', fontWeight: '700' },

    tabContent: { gap: 16 },
    infoCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
    providerRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    providerInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    providerName: { fontSize: 17, fontWeight: 'bold', color: '#1e293b' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ratingText: { color: '#475569', fontSize: 13, fontWeight: '600' },
    callBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#0d9488', alignItems: 'center', justifyContent: 'center' },

    addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    addressText: { flex: 1, fontSize: 16, color: '#334155', fontWeight: '500' },
    addressNote: { fontSize: 12, color: '#94a3b8', marginTop: 4 },

    actionButton: { flexDirection: 'row', backgroundColor: '#0d9488', paddingVertical: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 12, overflow: 'hidden' },
    actionButtonText: { color: 'white', fontWeight: 'bold', fontSize: 17 },

    mapContainer: { height: 400, width: '100%', borderRadius: 20, overflow: 'hidden', backgroundColor: '#cbd5e1', elevation: 4 },

    chatContainer: { flex: 1, minHeight: 400 },
    emptyChat: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyChatText: { fontSize: 16, fontWeight: '600', color: '#475569', marginTop: 16 },
    msgBubble: { maxWidth: '80%', padding: 16, borderRadius: 20, marginBottom: 12 },
    msgMe: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    msgOther: { alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#f1f5f9' },
    msgTextMe: { color: 'white', fontSize: 15 },
    msgTextOther: { color: '#1e293b', fontSize: 15 },
    msgTimeMe: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4, textAlign: 'right' },
    msgTimeOther: { color: '#94a3b8', fontSize: 11, marginTop: 4 },
    
    inputBar: { flexDirection: 'row', marginTop: 20, gap: 12, alignItems: 'flex-end' },
    inputContainer: { flex: 1, backgroundColor: '#ffffff', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 12, elevation: 4 },
    inputField: { flex: 1, fontSize: 15, color: '#1e293b', maxHeight: 100 },
    sendButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }
});
