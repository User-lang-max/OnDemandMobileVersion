import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  Pressable, 
  Modal, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  Dimensions
} from 'react-native';
import axiosClient from '../../api/axiosClient';
import { 
  DollarSign, 
  Search, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  CreditCard, 
  X, 
  Printer, 
  ArrowUpRight 
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AdminPaymentsScreen() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await axiosClient.get('/admin/payments');
      setPayments(res.data);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger les paiements.");
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const totalRevenue = payments
    .filter(p => p.status === 'captured' || p.status === 'paid')
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const successCount = payments
    .filter(p => p.status === 'captured' || p.status === 'paid')
    .length;

  // Filtre
  const filtered = payments.filter(p => 
    (p.client?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.transactionId || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusInfo = (status) => {
    switch(status) {
      case 'captured':
      case 'paid':
        return { bg: '#f0fdf4', text: '#115e59', border: '#ccfbf1', icon: CheckCircle, label: 'Succès' };
      case 'failed':
        return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', icon: XCircle, label: 'Échoué' };
      case 'pending':
        return { bg: '#fffbeb', text: '#92400e', border: '#fde68a', icon: Clock, label: 'En attente' };
      default:
        return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb', icon: Clock, label: status };
    }
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0d9488" />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      
      {/* HEADER & STATS */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.pageTitle}>Paiements</Text>
            <Text style={styles.pageSubtitle}>Gérez et suivez toutes les transactions.</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
             {/* Card Revenue */}
             <View style={[styles.statCard, styles.statCardGreen]}>
                <View style={styles.statIconWrapper}>
                   <DollarSign size={20} color="#0f766e" />
                </View>
                <View>
                   <Text style={styles.statLabel}>Revenu Total</Text>
                   <Text style={[styles.statValue, { color: '#0f766e' }]}>{totalRevenue.toLocaleString()} MAD</Text>
                </View>
             </View>

             {/* Card Transactions */}
             <View style={[styles.statCard, styles.statCardBlue]}>
                <View style={[styles.statIconWrapper, { backgroundColor: '#dbeafe' }]}>
                   <ArrowUpRight size={20} color="#1e40af" />
                </View>
                <View>
                   <Text style={styles.statLabel}>Transactions</Text>
                   <Text style={[styles.statValue, { color: '#1e40af' }]}>{successCount}</Text>
                </View>
             </View>
        </View>
      </View>

      <View style={styles.contentPadding}>
        <View style={styles.card}>
            
            {/* TOOLBAR */}
            <View style={styles.toolbar}>
                <View style={styles.searchContainer}>
                    <Search size={20} color="#9ca3af" style={styles.searchIcon} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Rechercher client, ID..."
                        placeholderTextColor="#9ca3af"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
                
            </View>

            {/* TABLEAU AVEC SCROLL HORIZONTAL */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tableMinSize}>
          
                <View style={styles.tableHeader}>
                   
                    <Text style={[styles.th, { width: 140 }]}>Transaction</Text>
                    <Text style={[styles.th, { width: 150 }]}>Client</Text>
                    <Text style={[styles.th, { width: 75, textAlign: 'right' }]}>Montant</Text>
                    <Text style={[styles.th, { width: 160, textAlign: 'center' }]}>Statut</Text>
                    <Text style={[styles.th, { width: 140 }]}>Date</Text>
                    <Text style={[styles.th, { width: 60 }]}></Text>
                </View>

               
                {filtered.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Search size={40} color="#e5e7eb" />
                        <Text style={styles.emptyText}>Aucune transaction trouvée.</Text>
                    </View>
                ) : (
                    filtered.map((payment) => {
                        const statusInfo = getStatusInfo(payment.status);
                        return (
                            <View key={payment.id} style={styles.tableRow}>
                               
                                <View style={{ width: 140 }}>
                                    <View style={styles.idRow}>
                                        <CreditCard size={14} color="#6b7280" />
                                        <Text style={styles.idText} numberOfLines={1}>
                                            {payment.service || payment.id.substring(0,8).toUpperCase()}
                                        </Text>
                                    </View>
                                </View>

                                {/* Client */}
                                <View style={{ width: 85 }}>
                                    <Text style={styles.clientName} numberOfLines={1}>{payment.client?.name || 'Inconnu'}</Text>
                                   
                                </View>

                                {/* Montant */}
                                <View style={{ width: 140, alignItems: 'flex-end' }}>
                                    <Text style={styles.amountText}>{payment.amount} MAD</Text>
                                </View>

                                {/* Statut */}
                                <View style={{ width: 160, alignItems: 'center' }}>
                                    <View style={[styles.badge, { backgroundColor: statusInfo.bg, borderColor: statusInfo.border }]}>
                                        <statusInfo.icon size={12} color={statusInfo.text} />
                                        <Text style={[styles.badgeText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
                                    </View>
                                </View>

                                {/* Date */}
                                <View style={{ width: 140 }}>
                                   <Text style={styles.dateText}>{new Date(payment.date).toLocaleDateString()}</Text>
                                </View>

                                {/* Actions */}
                                <View style={{ width: 60, alignItems: 'flex-end' }}>
                                    <Pressable onPress={() => setSelectedPayment(payment)} style={styles.actionBtn}>
                                        <Eye size={18} color="#0d9488" />
                                    </Pressable>
                                </View>
                            </View>
                        );
                    })
                )}
              </View>
            </ScrollView>
        </View>
      </View>

      {/* MODAL REÇU */}
      <Modal visible={!!selectedPayment} transparent animationType="fade" onRequestClose={() => setSelectedPayment(null)}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Pressable onPress={() => setSelectedPayment(null)} style={styles.closeBtn}>
                    <X size={24} color="#9ca3af" />
                </Pressable>

                <View style={styles.modalHeader}>
                    <View style={styles.successIconBox}>
                        <CheckCircle size={32} color="#0d9488" />
                    </View>
                    <Text style={styles.modalAmount}>{selectedPayment?.amount}.00 MAD</Text>
                    <Text style={styles.modalStatus}>Paiement réussi</Text>
                    <Text style={styles.modalId}>{selectedPayment?.transactionId}</Text>
                </View>

                <View style={styles.modalBody}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Client</Text>
                        <Text style={styles.detailValue}>{selectedPayment?.client?.name}</Text>
                    </View>
                    <View style={styles.divider} />
                    
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Service</Text>
                        <Text style={styles.detailValue}>{selectedPayment?.service}</Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date</Text>
                        <Text style={styles.detailValue}>
                            {selectedPayment ? new Date(selectedPayment.date).toLocaleString() : ''}
                        </Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Méthode</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <CreditCard size={16} color="#111827" />
                            <Text style={styles.detailValue}>{selectedPayment?.method || 'Carte Bancaire'}</Text>
                        </View>
                    </View>
                </View>

            </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  container: { flex: 1, backgroundColor: '#f9fafb' },
  
  
  header: { backgroundColor: '#fff', padding: 32, paddingBottom: 40, borderBottomWidth: 1, borderColor: '#e5e7eb' },
  pageTitle: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 8, textAlign: 'center' },
  pageSubtitle: { fontSize: 16, color: '#6b7280', marginBottom: 24, textAlign: 'center' },
  

  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 16, 
    flexWrap: 'wrap' 
  },
  statCard: { 
    width: '75%', 
    maxWidth: 260, 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  statCardGreen: { backgroundColor: '#f0fdfa', borderColor: '#ccfbf1' },
  statCardBlue: { backgroundColor: '#eff6ff', borderColor: '#dbeafe' },
  
  statIconWrapper: { padding: 10, backgroundColor: '#ccfbf1', borderRadius: 10 }, 
  statLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontWeight: '800', marginTop: 4 }, 

  contentPadding: { padding: 32, marginTop: -20 },
  

  card: { backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  

  toolbar: { padding: 24, borderBottomWidth: 1, borderColor: '#f3f4f6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, height: 50, flex: 1, marginRight: 20 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 15, color: '#1f2937' },
  
  exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 8 },
  exportBtnText: { fontWeight: '700', color: '#374151', fontSize: 14 },

 
  tableMinSize: { minWidth: 700 }, 
  tableHeader: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  th: { fontSize: 13, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  tableRow: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 24, borderBottomWidth: 1, borderColor: '#f9fafb', alignItems: 'center' },
  
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  idText: { fontFamily: 'monospace', fontSize: 13, fontWeight: '600', color: '#374151' },
  dateText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  
  clientName: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  serviceName: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  
  amountText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, gap: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  
  actionBtn: { padding: 10, backgroundColor: '#f0fdfa', borderRadius: 10 },

  emptyState: { padding: 60, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: '#9ca3af' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', width: '100%', maxWidth: 480, borderRadius: 24, padding: 0, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  
  closeBtn: { position: 'absolute', top: 20, right: 20, zIndex: 10, padding: 8, backgroundColor: '#f3f4f6', borderRadius: 20 },
  
  modalHeader: { alignItems: 'center', padding: 40, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f3f4f6', borderStyle: 'dashed' },
  successIconBox: { width: 64, height: 64, backgroundColor: '#f0fdfa', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  modalAmount: { fontSize: 32, fontWeight: '800', color: '#111827' },
  modalStatus: { fontSize: 16, color: '#059669', fontWeight: '600', marginTop: 8 },
  modalId: { fontSize: 13, color: '#9ca3af', fontFamily: 'monospace', marginTop: 8 },
  
  modalBody: { padding: 32, backgroundColor: '#f9fafb' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 12 },
  detailLabel: { fontSize: 15, color: '#6b7280', fontWeight: '500' },
  detailValue: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  
  modalFooter: { padding: 24, flexDirection: 'row', gap: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e5e7eb' },
  printBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, gap: 10 },
  printBtnText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  downloadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#0d9488', borderRadius: 14, gap: 10 },
  downloadBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});