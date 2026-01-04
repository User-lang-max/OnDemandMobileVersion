import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, Modal, ActivityIndicator, Alert } from "react-native";
import axiosClient from "../../api/axiosClient";
import { Plus, Edit2, Trash2, Search, Wrench, X, Save, Tag, Users, DollarSign } from "lucide-react-native";
import { Picker } from '@react-native-picker/picker'; 

export default function AdminServicesScreen() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState({ name: '', category: '', avgPrice: '' });

  const categories = [
      "Services à domicile",
      "Beauté et bien-être",
      "Services automobiles"
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
        const res = await axiosClient.get('/admin/services-stats');
        setServices(res.data);
    } catch(e) { 
        Alert.alert("Erreur", "Erreur chargement catalogue"); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleSave = async () => {
     
      Alert.alert("Succès", "Service sauvegardé (Simulation)");
      setIsModalOpen(false);
      fetchServices(); 
  };

  const handleDelete = (id) => {
      Alert.alert("Confirmation", "Supprimer ce service ?", [
          { text: "Annuler", style: "cancel"},
          { text: "Supprimer", style: 'destructive', onPress: () => {
              setServices(prev => prev.filter(s => s.id !== id));
          }}
      ]);
  };

  const openModal = (service = null) => {
      setCurrentService(service || { name: '', category: categories[0], avgPrice: '' });
      setIsModalOpen(true);
  };

  const filtered = services.filter(s => 
      (s.name?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterCategory === 'all' || s.category === filterCategory)
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Catalogue Services</Text>
        <Text style={styles.headerSubtitle}>Gérez les offres disponibles et les prix de référence.</Text>
      </View>

      <View style={styles.contentPadding}>
        <View style={styles.toolbar}>
            <View style={styles.searchFilter}>
                <View style={styles.searchBox}>
                    <Search size={18} color="#9ca3af" style={{marginRight: 8}}/>
                    <TextInput 
                        style={styles.input}
                      
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
              
            </View>
           
        </View>

        <View style={styles.grid}>
            {filtered.map((service, idx) => (
                <View key={idx} style={styles.card}>
                  

                    <View style={styles.cardHeader}>
                        <View style={styles.serviceIcon}>
                             <Wrench size={20} color="#0d9488"/>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text numberOfLines={1} style={styles.serviceName}>{service.name}</Text>
                            <View style={styles.catBadge}>
                                <Tag size={10} color="#6b7280"/>
                                <Text style={styles.catText}>{service.category}</Text>
                            </View>
                        </View>
                    </View>
                    
                    <View style={styles.cardStats}>
                        <View style={styles.statBox}>
                            <View style={{flexDirection: 'row', gap: 4, alignItems: 'center', marginBottom: 4}}>
                                <Users size={12} color="#6b7280"/>
                                <Text style={styles.statLabel}>Prestataires</Text>
                            </View>
                            <Text style={styles.statValue}>{service.providers || 0}</Text>
                        </View>
                        <View style={styles.statBox}>
                             <View style={{flexDirection: 'row', gap: 4, alignItems: 'center', marginBottom: 4}}>
                                <DollarSign size={12} color="#6b7280"/>
                                <Text style={styles.statLabel}>Prix Moyen</Text>
                            </View>
                            <Text style={[styles.statValue, { color: '#0d9488' }]}>{service.avgPrice || 0} Dhs</Text>
                        </View>
                    </View>
                </View>
            ))}
        </View>
      </View>

      {/* Modal */}
      <Modal visible={isModalOpen} transparent animationType="slide" onRequestClose={() => setIsModalOpen(false)}>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>{currentService.id ? 'Modifier le service' : 'Ajouter au catalogue'}</Text>
                      <Pressable onPress={() => setIsModalOpen(false)}><X size={20} color="#9ca3af"/></Pressable>
                  </View>
                  <View style={styles.modalForm}>
                      <View style={styles.inputGroup}>
                          <Text style={styles.label}>Nom du service</Text>
                          <TextInput 
                            style={styles.modalInput}
                            value={currentService.name}
                            onChangeText={t => setCurrentService({...currentService, name: t})}
                            placeholder="Ex: Plombier Sanitaire"
                          />
                      </View>
                      <View style={styles.inputGroup}>
                          <Text style={styles.label}>Catégorie</Text>
                          <View style={styles.modalPickerBox}>
                            <Picker
                                selectedValue={currentService.category}
                                onValueChange={v => setCurrentService({...currentService, category: v})}
                            >
                                {categories.map(c => <Picker.Item key={c} label={c} value={c} />)}
                            </Picker>
                          </View>
                      </View>
                      <View style={styles.inputGroup}>
                          <Text style={styles.label}>Prix de base suggéré (MAD)</Text>
                          <TextInput 
                            style={styles.modalInput}
                            value={String(currentService.avgPrice)}
                            onChangeText={t => setCurrentService({...currentService, avgPrice: t})}
                            placeholder="150"
                            keyboardType="numeric"
                          />
                      </View>
                      <View style={styles.modalFooter}>
                          <Pressable onPress={() => setIsModalOpen(false)} style={styles.btnCancel}>
                              <Text style={styles.btnCancelText}>Annuler</Text>
                          </Pressable>
                          <Pressable onPress={handleSave} style={styles.btnSave}>
                              <Save size={16} color="#fff"/>
                              <Text style={styles.btnSaveText}>Enregistrer</Text>
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
  
  toolbar: { backgroundColor: "#fff", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "#f3f4f6", marginBottom: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  searchFilter: { flexDirection: 'row', flex: 1, gap: 16, minWidth: 300 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#f9fafb' },
  input: { flex: 1, paddingVertical: 10 },
  pickerBox: { width: 200, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center' },
  picker: { height: 50 },
  
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d9488', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, gap: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  card: { flex: 1, minWidth: 250, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', padding: 20 },
  
  cardActions: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 8, zIndex: 10 },
  iconBtn: { padding: 6, backgroundColor: '#f3f4f6', borderRadius: 8 },
  
  cardHeader: { flexDirection: 'row', gap: 16, marginBottom: 16, marginTop: 16 },
  serviceIcon: { width: 48, height: 48, backgroundColor: '#f0fdfa', borderColor: '#ccfbf1', borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  serviceName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  catBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4, gap: 4 },
  catText: { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  
  cardStats: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#f3f4f6', paddingTop: 12, gap: 8 },
  statBox: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 8, padding: 8, alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#6b7280' },
  statValue: { fontWeight: 'bold', color: '#1f2937' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalContent: { backgroundColor: '#fff', width: '100%', maxWidth: 450, borderRadius: 16, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#f9fafb', borderBottomWidth: 1, borderColor: '#f3f4f6' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  modalForm: { padding: 24, gap: 16 },
  inputGroup: {},
  label: { fontSize: 12, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 },
  modalInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 },
  modalPickerBox: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, justifyContent: 'center' },
  
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderColor: '#f9fafb' },
  btnCancel: { paddingHorizontal: 16, paddingVertical: 10 },
  btnCancelText: { color: '#4b5563', fontWeight: 'bold' },
  btnSave: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d9488', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, gap: 8 },
  btnSaveText: { color: '#fff', fontWeight: 'bold' },
});