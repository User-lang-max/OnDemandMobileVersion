import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  Alert,
} from "react-native";
import axiosClient from "../../api/axiosClient";
import {
  Briefcase,
  MapPin,
  Search,
  ArrowRight,
  X,
  Navigation,
} from "lucide-react-native";

export default function AdminJobsScreen() {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("");
  
  // Modal State
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    axiosClient.get('/admin/jobs').then(res => setJobs(res.data));
  }, []);

  const filtered = jobs.filter(j => 
    (j.client?.name || "").toLowerCase().includes(filter.toLowerCase()) || 
    (j.service || "").toLowerCase().includes(filter.toLowerCase())
  );

  
  const getSteps = (status) => {
      const steps = [
          { label: 'Créée', done: true },
          { label: 'Attribuée', done: status !== 'pending' && status !== 'cancelled' },
          { label: 'En cours', done: status === 'inprogress' || status === 'completed' },
          { label: 'Terminée', done: status === 'completed' }
      ];
      if (status === 'cancelled') return [{ label: 'Annulée', done: true, error: true }];
      return steps;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "completed": return { bg: "#f0fdf4", text: "#15803d", dot: "#16a34a", border: "#dcfce7" };
      case "cancelled": return { bg: "#fef2f2", text: "#b91c1c", dot: "#dc2626", border: "#fee2e2" };
      case "pending": return { bg: "#fffbeb", text: "#b45309", dot: "#d97706", border: "#fef3c7" };
      default: return { bg: "#eff6ff", text: "#1d4ed8", dot: "#2563eb", border: "#dbeafe" };
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Commandes</Text>
        <Text style={styles.headerSubtitle}>Supervision des missions et interventions.</Text>
      </View>

      <View style={styles.contentPadding}>
        <View style={styles.card}>
          {/* Search Header */}
          <View style={styles.searchHeader}>
            <View style={styles.searchContainer}>
              <Search size={18} color="#9ca3af" style={styles.searchIcon} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Rechercher (Client, Service, ID)..."
                value={filter}
                onChangeText={setFilter}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

           <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.columnHeader, { width: 60 }]}>Pro+Cl</Text>
              <Text style={[styles.columnHeader, { flex: 2 }]}></Text>
              <Text style={[styles.columnHeader, { width: 80 }]}>Prix</Text>
              <Text style={[styles.columnHeader, { width: 100 }]}>Statut</Text>
              <Text style={[styles.columnHeader, { width: 40, textAlign: 'right' }]}>Act.</Text>
            </View>

            {filtered.map(job => {
              const statusStyle = getStatusStyle(job.status);
              return (
                <View key={job.id} style={styles.tableRow}>
                  <View style={{ width: 60 }}>
                    <Text style={styles.refText}>
                      {job.client?.name} &&
                    </Text>
                    <Text style={styles.refText}>
                      {job.provider?.name || '—'}
                    </Text>
                  </View>

                  <View style={{ flex: 2, paddingRight: 8 }}>
                    <Text style={styles.serviceText}>{job.service}</Text>
                    <View style={styles.locationRow}>
                   
                      <Text style={styles.addressText}>
                        {job.address ? job.address.substring(0, 20) + '...' : 'Adresse masquée'}
                      </Text>
                    </View>

                    <View style={styles.avatarRow}>
                      <View style={[styles.avatarCircle, { backgroundColor: '#dbeafe' }]}>
                        <Text style={[styles.avatarText, { color: '#2563eb' }]}>{job.client?.name?.[0]}</Text>
                      </View>
                      {job.provider ? (
                        <View style={[styles.avatarCircle, { backgroundColor: '#ccfbf1', marginLeft: -8 }]}>
                          <Text style={[styles.avatarText, { color: '#0d9488' }]}>{job.provider?.name?.[0]}</Text>
                        </View>
                      ) : (
                        <View style={[styles.avatarCircle, { backgroundColor: '#f3f4f6', marginLeft: -8 }]}>
                          <Text style={[styles.avatarText, { color: '#9ca3af' }]}>?</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={{ width: 80 }}>
                    <Text style={styles.priceText}>{job.price} MAD</Text>
                  </View>

                  <View style={{ width: 100 }}>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>{job.status}</Text>
                    </View>
                  </View>

                  <View style={{ width: 40, alignItems: 'flex-end' }}>
                    <Pressable onPress={() => setSelectedJob(job)} style={styles.actionButton}>
                      <ArrowRight size={18} color="#9ca3af"/>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* MODAL DETAIL JOB */}
      <Modal
        visible={!!selectedJob}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedJob(null)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                {/* Header */}
                <View style={styles.modalHeader}>
                    <View>
                        <View style={styles.modalTitleRow}>
                            <Briefcase size={20} color="#0d9488"/>
                            <Text style={styles.modalTitle}>{selectedJob?.service}</Text>
                        </View>
                        <Text style={styles.modalSubtitle}>ID: {selectedJob?.id}</Text>
                    </View>
                    <Pressable onPress={() => setSelectedJob(null)} style={styles.closeButton}>
                        <X size={20} color="#6b7280"/>
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.modalBody}>
                    {/* Timeline */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Timeline</Text>
                        <View style={styles.timelineContainer}>
                            {selectedJob && getSteps(selectedJob.status).map((step, i) => (
                                <View key={i} style={styles.timelineItem}>
                                    <View style={[
                                        styles.timelineDot, 
                                        { backgroundColor: step.done ? '#0d9488' : '#e5e7eb' }
                                    ]} />
                                    <Text style={[
                                        styles.timelineLabel, 
                                        { color: step.done ? '#111827' : '#9ca3af' }
                                    ]}>{step.label}</Text>
                                </View>
                            ))}
                            {/* Vertical Line trick */}
                            <View style={styles.timelineLine} />
                        </View>
                    </View>

                    {/* Participants */}
                    <View style={styles.infoBox}>
                        <Text style={styles.sectionTitle}>Participants</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Client</Text>
                            <Text style={styles.infoValue}>{selectedJob?.client?.name}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Prestataire</Text>
                            <Text style={[
                                styles.infoValue, 
                                selectedJob?.provider ? { color: '#0d9488' } : { color: '#d97706', fontStyle: 'italic' }
                            ]}>
                                {selectedJob?.provider?.name || 'En recherche...'}
                            </Text>
                        </View>
                    </View>

                    {/* Localisation */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Localisation</Text>
                        <View style={styles.mapPlaceholder}>
                            <MapPin size={32} color="#d1d5db"/>
                            <View style={styles.mapOverlay}>
                                <Text style={styles.mapButtonText}>Voir sur Maps</Text>
                            </View>
                        </View>
                        <View style={styles.addressRow}>
                            <Navigation size={12} color="#6b7280"/>
                            <Text style={styles.addressDetail}>{selectedJob?.address}</Text>
                        </View>
                    </View>

                    {/* Finances */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Finances</Text>
                        <View style={styles.financeRow}>
                            <Text style={styles.infoLabel}>Total Facturé</Text>
                            <Text style={styles.financeValue}>{selectedJob?.price} MAD</Text>
                        </View>
                        <View style={styles.commissionRow}>
                            <Text style={styles.commissionLabel}>Commission (15%)</Text>
                            <Text style={styles.commissionValue}>{(selectedJob?.price * 0.15).toFixed(2)} MAD</Text>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                     <Pressable onPress={() => setSelectedJob(null)} style={styles.footerButtonClose}>
                        <Text style={styles.footerButtonCloseText}>Fermer</Text>
                     </Pressable>
                     {selectedJob?.status === 'pending' && (
                        <Pressable style={styles.footerButtonCancel}>
                            <Text style={styles.footerButtonCancelText}>Annuler la commande</Text>
                        </Pressable>
                     )}
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
  card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#f3f4f6", overflow: "hidden" },
  searchHeader: { padding: 24, borderBottomWidth: 1, borderColor: "#f3f4f6", backgroundColor: "#f9fafb" },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: "#111827" },
  
  // Table Styles
  tableHeader: { flexDirection: "row", paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#fff" },
  columnHeader: { fontSize: 12, fontWeight: "bold", color: "#9ca3af", textTransform: "uppercase" },
  tableRow: { flexDirection: "row", paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderColor: "#f3f4f6", alignItems: "center" },
  
  refText: { fontFamily: "monospace", fontSize: 12, fontWeight: "bold", color: "#6b7280" },
  serviceText: { fontSize: 14, fontWeight: "bold", color: "#111827" },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  addressText: { fontSize: 12, color: "#6b7280" },
  
  avatarRow: { flexDirection: 'row', marginTop: 8 },
  avatarCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarText: { fontSize: 10, fontWeight: 'bold' },

  priceText: { fontWeight: "bold", color: "#111827" },
  
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, borderWidth: 1, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: "bold", textTransform: 'capitalize' },
  
  actionButton: { padding: 8, backgroundColor: "#f0fdfa", borderRadius: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 16 },
  modalContent: { backgroundColor: "#fff", width: "100%", maxheight: "90%", maxWidth: 600, borderRadius: 16, overflow: "hidden" },
  modalHeader: { padding: 24, borderBottomWidth: 1, borderColor: "#f3f4f6", flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f9fafb" },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  modalSubtitle: { fontSize: 12, color: "#6b7280", marginTop: 4, fontFamily: 'monospace' },
  closeButton: { padding: 8, backgroundColor: "#e5e7eb", borderRadius: 20 },
  
  modalBody: { padding: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", color: "#9ca3af", textTransform: "uppercase", marginBottom: 12 },
  
  // Timeline
  timelineContainer: { paddingLeft: 16, position: 'relative' },
  timelineLine: { position: 'absolute', left: 21, top: 0, bottom: 0, width: 2, backgroundColor: '#f3f4f6', zIndex: -1 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, zIndex: 1 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff', marginRight: 12 },
  timelineLabel: { fontSize: 14, fontWeight: '500' },

  infoBox: { backgroundColor: "#f9fafb", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#f3f4f6", marginBottom: 24 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  infoLabel: { fontSize: 14, color: "#4b5563" },
  infoValue: { fontSize: 14, fontWeight: "bold", color: "#111827" },

  mapPlaceholder: { height: 128, backgroundColor: "#f3f4f6", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  mapOverlay: { position: 'absolute', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  mapButtonText: { fontSize: 12, fontWeight: 'bold' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  addressDetail: { fontSize: 12, color: "#6b7280", flex: 1 },

  financeRow: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderColor: "#f3f4f6", paddingBottom: 8, marginBottom: 8, alignItems: 'flex-end' },
  financeValue: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  commissionRow: { flexDirection: "row", justifyContent: "space-between" },
  commissionLabel: { fontSize: 12, color: "#6b7280" },
  commissionValue: { fontSize: 12, color: "#6b7280" },

  modalFooter: { padding: 16, backgroundColor: "#f9fafb", borderTopWidth: 1, borderColor: "#f3f4f6", flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  footerButtonClose: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb" },
  footerButtonCloseText: { color: "#4b5563", fontWeight: "bold", fontSize: 14 },
  footerButtonCancel: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fee2e2" },
  footerButtonCancelText: { color: "#dc2626", fontWeight: "bold", fontSize: 14 },
});