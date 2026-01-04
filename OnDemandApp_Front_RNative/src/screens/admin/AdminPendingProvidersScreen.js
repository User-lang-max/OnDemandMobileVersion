import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, Pressable, StyleSheet, ActivityIndicator, Alert, Modal, Linking } from "react-native";
import axiosClient from "../../api/axiosClient";
import { Check, X, Eye, FileText, Download, UserCheck, MapPin, Calendar, Trash2 } from "lucide-react-native";

export default function AdminPendingProvidersScreen() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await axiosClient.get("/admin/pending-providers");
      setProviders(res.data);
    } catch (err) {
      Alert.alert("Erreur", "Erreur chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id) => {
    Alert.alert("Confirmation", "Valider ce prestataire ?", [
        { text: "Annuler", style: "cancel" },
        { text: "Valider", onPress: async () => {
            try {
                await axiosClient.post(`/admin/validate-provider/${id}`);
                setProviders((prev) => prev.filter((p) => p.id !== id));
                setSelectedProvider(null);
            } catch (err) {
                Alert.alert("Erreur", "Validation échouée");
            }
        }}
    ]);
  };

  const handleReject = async (id) => {
    Alert.alert("Rejeter", "Supprimer cette candidature ?", [
        { text: "Annuler", style: "cancel" },
        { text: "Rejeter", style: 'destructive', onPress: async () => {
            try {
                await axiosClient.post(`/admin/reject-provider/${id}`);
                setProviders((prev) => prev.filter((p) => p.id !== id));
                setSelectedProvider(null);
            } catch (err) {
                Alert.alert("Erreur", "Rejet échoué");
            }
        }}
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Validations</Text>
        <Text style={styles.headerSubtitle}>Examiner les candidatures des nouveaux prestataires.</Text>
      </View>

      <View style={styles.contentPadding}>
        {loading ? (
            <ActivityIndicator size="large" color="#0d9488" style={{ marginTop: 40 }} />
        ) : providers.length === 0 ? (
            <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                    <UserCheck size={32} color="#9ca3af"/>
                </View>
                <Text style={styles.emptyTitle}>Tout est à jour</Text>
                <Text style={styles.emptySub}>Aucune candidature en attente.</Text>
            </View>
        ) : (
            <View style={styles.grid}>
                {providers.map(p => (
                    <View key={p.id} style={styles.card}>
                        <View style={styles.cardBody}>
                            <View style={styles.cardHeader}>
                                <Image 
                                    source={{ uri: p.photoUrl || `https://ui-avatars.com/api/?name=${p.fullName}&background=random` }}
                                    style={styles.avatar}
                                />
                                <View style={{ flex: 1, marginLeft: 16 }}>
                                    <Text style={styles.providerName}>{p.fullName}</Text>
                                    <Text style={styles.providerEmail}>{p.email}</Text>
                                    <View style={[styles.badge, p.emailConfirmed ? styles.badgeGreen : styles.badgeOrange]}>
                                        <Text style={[styles.badgeText, p.emailConfirmed ? styles.textGreen : styles.textOrange]}>
                                            {p.emailConfirmed ? 'Email Vérifié' : 'Email Non Vérifié'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.infoBlock}>
                                <View style={styles.infoItem}>
                                    <MapPin size={16} color="#0d9488"/>
                                    <Text style={styles.infoText}>{p.requestedZone || 'Non définie'}</Text>
                                </View>
                                <View style={styles.infoItem}>
                                    <FileText size={16} color="#2563eb"/>
                                    <Text style={styles.infoText}>{p.cvUrl ? 'CV Disponible' : 'CV Manquant'}</Text>
                                </View>
                            </View>

                            <View style={styles.actions}>
                                <Pressable onPress={() => setSelectedProvider(p)} style={styles.btnInspect}>
                                    <Eye size={16} color="#374151"/>
                                    <Text style={styles.btnInspectText}>Examiner</Text>
                                </Pressable>
                                <Pressable onPress={() => handleValidate(p.id)} style={styles.btnValidate}>
                                    <Check size={16} color="#fff"/>
                                    <Text style={styles.btnValidateText}>Valider</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        )}
      </View>

      {/* MODAL */}
      <Modal visible={!!selectedProvider} transparent animationType="slide" onRequestClose={() => setSelectedProvider(null)}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Dossier Candidature</Text>
                    <Pressable onPress={() => setSelectedProvider(null)} style={styles.closeBtn}>
                        <X size={20} color="#6b7280"/>
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.modalBody}>
                    <Text style={styles.sectionLabel}>Présentation</Text>
                    <View style={styles.bioBox}>
                        <Text style={styles.bioText}>"{selectedProvider?.bio || "Aucune description..."}"</Text>
                    </View>

                    <View style={styles.modalGrid}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionLabel}>Zone d'intervention</Text>
                            <View style={styles.iconText}>
                                <MapPin size={16} color="#0d9488"/>
                                <Text style={styles.valueText}>{selectedProvider?.requestedZone}</Text>
                            </View>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionLabel}>Entretien</Text>
                            <View style={styles.iconText}>
                                <Calendar size={16} color="#9333ea"/>
                                <Text style={styles.valueText}>{selectedProvider?.interviewDate ? new Date(selectedProvider.interviewDate).toLocaleDateString() : 'Non planifié'}</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.sectionLabel}>Pièces jointes</Text>
                    {selectedProvider?.cvUrl ? (
                        <Pressable onPress={() => Linking.openURL(selectedProvider.cvUrl)} style={styles.fileCard}>
                            <View style={styles.fileIconBox}><FileText size={20} color="#dc2626"/></View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.fileName}>Curriculum Vitae.pdf</Text>
                                <Text style={styles.fileSub}>Cliquer pour télécharger</Text>
                            </View>
                            <Download size={16} color="#9ca3af"/>
                        </Pressable>
                    ) : (
                        <Text style={styles.noFile}><X size={16}/> Aucun CV fourni</Text>
                    )}
                </ScrollView>

                <View style={styles.modalFooter}>
                    <Pressable onPress={() => handleReject(selectedProvider.id)} style={styles.btnReject}>
                        <Trash2 size={16} color="#dc2626"/>
                        <Text style={styles.btnRejectText}>Rejeter</Text>
                    </Pressable>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <Pressable onPress={() => setSelectedProvider(null)} style={styles.btnClose}>
                            <Text style={styles.btnCloseText}>Fermer</Text>
                        </Pressable>
                        <Pressable onPress={() => handleValidate(selectedProvider.id)} style={styles.btnVal}>
                            <Text style={styles.btnValText}>Valider </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: { backgroundColor: "#fff", padding: 32, borderBottomWidth: 1, borderColor: "#e5e7eb" },
  headerTitle: { fontSize: 30, fontWeight: "bold", color: "#111827" },
  headerSubtitle: { color: "#6b7280", marginTop: 4 },
  
  contentPadding: { padding: 32 },
  
  emptyState: { padding: 60, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#d1d5db' },
  emptyIcon: { width: 64, height: 64, backgroundColor: '#f9fafb', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  emptySub: { color: '#6b7280' },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  card: { flex: 1, minWidth: 300, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  cardBody: { padding: 24 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#fff' },
  providerName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  providerEmail: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  badgeGreen: { backgroundColor: '#f0fdf4' },
  badgeOrange: { backgroundColor: '#fff7ed' },
  badgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  textGreen: { color: '#15803d' },
  textOrange: { color: '#c2410c' },

  infoBlock: { marginTop: 16, gap: 8 },
  infoItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', padding: 8, borderRadius: 8, gap: 8 },
  infoText: { fontSize: 14, fontWeight: '500', color: '#4b5563' },
  
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btnInspect: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', padding: 10, borderRadius: 8, gap: 8 },
  btnInspectText: { fontWeight: 'bold', color: '#374151' },
  btnValidate: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d9488', padding: 10, borderRadius: 8, gap: 8 },
  btnValidateText: { fontWeight: 'bold', color: '#fff' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalContent: { backgroundColor: "#fff", width: "100%", maxWidth: 500, borderRadius: 16, overflow: "hidden", maxHeight: "90%" },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, backgroundColor: '#f9fafb', borderBottomWidth: 1, borderColor: '#f3f4f6' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  closeBtn: { padding: 4 },
  modalBody: { padding: 24 },
  
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  bioBox: { backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  bioText: { fontStyle: 'italic', color: '#374151' },
  
  modalGrid: { flexDirection: 'row', gap: 16 },
  iconText: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  valueText: { fontWeight: 'bold', color: '#1f2937' },
  
  fileCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, gap: 12 },
  fileIconBox: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 },
  fileName: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  fileSub: { fontSize: 12, color: '#0d9488' },
  noFile: { color: '#ef4444', fontWeight: '500', marginTop: 8 },
  
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, borderTopWidth: 1, borderColor: '#f3f4f6', backgroundColor: '#f9fafb' },
  btnReject: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#fee2e2', borderRadius: 8 },
  btnRejectText: { color: '#dc2626', fontWeight: 'bold' },
  btnClose: { paddingHorizontal: 16, paddingVertical: 10 },
  btnCloseText: { color: '#4b5563', fontWeight: 'bold' },
  btnVal: { backgroundColor: '#0d9488', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  btnValText: { color: '#fff', fontWeight: 'bold' },
});