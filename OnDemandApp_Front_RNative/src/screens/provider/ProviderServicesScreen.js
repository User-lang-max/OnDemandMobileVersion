import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  Alert,
  Platform
} from 'react-native';

import axiosClient from '../../api/axiosClient';
import Toast from 'react-native-toast-message';

import {
  Save,
  Tag,
  Trash2,
  PlusCircle,
  LayoutGrid,
  X,
  Star,
  TrendingUp,
  Users,
  Clock,
  ShieldCheck
} from 'lucide-react-native';

export default function ProviderServicesScreen() {
  const [myServices, setMyServices] = useState([]);
  const [catalogTree, setCatalogTree] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // modal UX (pour reproduire le flow “Ajouter” + prix)
  const [selectedToAdd, setSelectedToAdd] = useState(null); // srv à ajouter
  const [priceDraft, setPriceDraft] = useState(''); // prix saisi

  const fetchMyServices = async () => {
    try {
      const res = await axiosClient.get('/provider/services'); // identique
      setMyServices(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur chargement services' });
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      await fetchMyServices();

      try {
        const res = await axiosClient.get('/catalog/tree'); 
        setCatalogTree(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setCatalogTree([]);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const stats = useMemo(() => {
    return {
      totalServices: myServices.length,
      totalRevenue: myServices.reduce((sum, s) => sum + (s.basePrice || 0), 0),
      averageRating: 4.8,
      mostPopular: myServices[0]
    };
  }, [myServices]);


  const handleUpdatePrice = async (item, newPrice) => {
    try {
      await axiosClient.post('/provider/services', {
        serviceItemId: item.itemId || item.id, 
        price: parseFloat(newPrice),
        isActive: true
      });

      Toast.show({ type: 'success', text1: 'Prix mis à jour' });
      fetchMyServices();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur mise à jour' });
    }
  };

  
  const handleAddService = async (item) => {
    await handleUpdatePrice(item, item.minPrice || 100);
    setIsAddModalOpen(false);
  };

  const handleRemove = async (itemId) => {
    Alert.alert(
      'Confirmation',
      'Retirer ce service de votre profil ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              await axiosClient.post('/provider/services', {
                serviceItemId: itemId,
                price: 0,
                isActive: false
              });

              setMyServices(prev => prev.filter(s => (s.itemId ?? s.id) !== itemId));
              Toast.show({ type: 'success', text1: 'Service retiré' });
            } catch (e) {
              Toast.show({ type: 'error', text1: 'Erreur' });
            }
          }
        }
      ]
    );
  };


  const keyOfService = (s, idx) => {
    const raw = s?.itemId ?? s?.id ?? s?.serviceItemId;
    return raw != null ? String(raw) : `service-${idx}`;
  };

  const keyOfCategory = (c, idx) => {
    const raw = c?.id ?? c?.categoryId;
    return raw != null ? String(raw) : `cat-${idx}`;
  };

  const keyOfSrv = (cat, srv, idx) => {
    const raw = srv?.id ?? srv?.itemId ?? srv?.serviceItemId;
    if (raw != null) return `${cat?.id ?? 'cat'}-${String(raw)}`;
    return `${cat?.id ?? 'cat'}-srv-${idx}`;
  };


  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>Mes Compétences</Text>
            <Text style={styles.hSub}>
              Gérez les services visibles par les clients et vos tarifs.
            </Text>
          </View>

          <Pressable style={styles.addBtn} onPress={() => setIsAddModalOpen(true)}>
            <PlusCircle size={18} color="#fff" />
            <Text style={styles.addBtnText}>Ajouter une compétence</Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <View>
                <Text style={styles.statLabel}>Services actifs</Text>
                <Text style={styles.statValue}>{stats.totalServices}</Text>
              </View>
              <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
                <LayoutGrid size={18} color="#2563EB" />
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <View>
                <Text style={styles.statLabel}>Valeur totale</Text>
                <Text style={[styles.statValue, { color: '#16A34A' }]}>
                  {stats.totalRevenue} MAD
                </Text>
              </View>
              <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
                <TrendingUp size={18} color="#16A34A" />
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <View>
                <Text style={styles.statLabel}>Note moyenne</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.statValue, { color: '#CA8A04' }]}>{stats.averageRating}</Text>
                  <Star size={16} color="#EAB308" />
                </View>
              </View>
              <View style={[styles.statIconBox, { backgroundColor: '#FFFBEB' }]}>
                <Star size={18} color="#CA8A04" />
              </View>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <View>
                <Text style={styles.statLabel}>Performances</Text>
                <Text style={[styles.statValue, { fontSize: 16 }]}>Excellent</Text>
              </View>
              <View style={[styles.statIconBox, { backgroundColor: '#F5F3FF' }]}>
                <Users size={18} color="#7C3AED" />
              </View>
            </View>
          </View>
        </View>

        {/* SERVICES LIST */}
        {myServices.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <LayoutGrid size={22} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>Aucun service actif</Text>
            <Text style={styles.emptyText}>
              Ajoutez vos premières compétences pour commencer à recevoir des missions.
            </Text>
            <Pressable onPress={() => setIsAddModalOpen(true)}>
              <Text style={styles.emptyLink}>Ajouter un service maintenant</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ marginTop: 10 }}>
            {myServices.map((service, idx) => (
              <View key={keyOfService(service, idx)} style={styles.serviceCard}>
                <View style={styles.serviceTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <View style={styles.serviceIconBox}>
                      <Text style={styles.serviceIconText}>{service.icon || '🛠️'}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceName}>{service.name}</Text>

                      <View style={styles.serviceMetaRow}>
                        <View style={styles.serviceMetaItem}>
                          <Tag size={12} color="#9CA3AF" />
                          <Text style={styles.serviceMetaText}>Service Actif</Text>
                        </View>

                        <View style={styles.serviceRateRow}>
                          <Star size={12} color="#CA8A04" />
                          <Text style={styles.serviceRateText}>4.8</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleRemove(service.itemId)}
                    style={styles.trashBtn}
                    hitSlop={10}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </Pressable>
                </View>

              
                <View style={styles.metricsBox}>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricValue}>15</Text>
                    <Text style={styles.metricLabel}>Réservations</Text>
                  </View>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricValue}>100%</Text>
                    <Text style={styles.metricLabel}>Taux de compl.</Text>
                  </View>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricValue}>2h</Text>
                    <Text style={styles.metricLabel}>Durée moy.</Text>
                  </View>
                  <View style={styles.metricCell}>
                    <Text style={[styles.metricValue, { color: '#16A34A' }]}>1,200 MAD</Text>
                    <Text style={styles.metricLabel}>Revenus</Text>
                  </View>
                </View>

                {/* PRICE EDITOR */}
                <View style={styles.priceBox}>
                  <View style={styles.priceHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.priceTitle}>Tarif par défaut</Text>
                      <Text style={styles.priceSub}>Définissez votre prix pour ce service</Text>
                    </View>
                    <View style={styles.marketPill}>
                      <Text style={styles.marketPillText}>Prix moyen du marché: 250 MAD</Text>
                    </View>
                  </View>

                  <View style={styles.priceRow}>
                    <View style={styles.priceInputWrap}>
                      <Text style={styles.madPrefix}>MAD</Text>
                      <TextInput
                        defaultValue={String(service.basePrice ?? '')}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#9CA3AF"
                        style={styles.priceInput}
                        onEndEditing={(e) => handleUpdatePrice(service, e.nativeEvent.text)}
                      />
                    </View>

                    <View style={styles.priceQuickRow}>
                      <Pressable
                        style={styles.quickBtn}
                        onPress={() => handleUpdatePrice(service, Math.max((service.basePrice || 0) - 20, 50))}
                      >
                        <Text style={styles.quickBtnText}>-20</Text>
                      </Pressable>

                      <Pressable
                        style={styles.quickBtn}
                        onPress={() => handleUpdatePrice(service, (service.basePrice || 0) + 20)}
                      >
                        <Text style={styles.quickBtnText}>+20</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.bottomHintsRow}>
                    <View style={styles.hintItem}>
                      <ShieldCheck size={14} color="#6B7280" />
                      <Text style={styles.hintText}>Garantie qualité incluse</Text>
                    </View>
                    <View style={styles.hintItem}>
                      <Clock size={14} color="#6B7280" />
                      <Text style={styles.hintText}>Réponse sous 15 min</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

   
      <Modal
        visible={isAddModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Ajouter une compétence</Text>
                <Text style={styles.modalSub}>Sélectionnez parmi nos catégories de services</Text>
              </View>
              <Pressable onPress={() => setIsAddModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={22} color="#6B7280" />
              </Pressable>
            </View>

            {/* body */}
            <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 14 }}>
              {catalogTree.map((cat, cIdx) => {
                const catKey = keyOfCategory(cat, cIdx);
                return (
                  <View key={catKey} style={styles.catCard}>
                    <View style={styles.catHeader}>
                      <Text style={styles.catIcon}>{cat.icon || '🧰'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.catName}>{cat.name}</Text>
                        <Text style={styles.catDesc}>
                          {cat.description || `${(cat.services || []).length} services disponibles`}
                        </Text>
                      </View>
                    </View>

                    <View style={{ marginTop: 10 }}>
                      {(cat.services || [])
                        .filter(srv => !myServices.some(ms => (ms.itemId ?? ms.id) === srv.id))
                        .map((srv, sIdx) => {
                          const srvKey = keyOfSrv(cat, srv, sIdx);
                          return (
                            <View key={srvKey} style={styles.srvCard}>
                              <View style={styles.srvTop}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.srvName}>{srv.name}</Text>
                                  <Text style={styles.srvDesc}>{srv.description || 'Service professionnel'}</Text>
                                </View>

                                <View style={styles.srvPricePill}>
                                  <Text style={styles.srvPriceText}>{srv.minPrice || 100} MAD</Text>
                                </View>
                              </View>

                              <View style={styles.srvBottom}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Star size={10} color="#EAB308" />
                                  <Text style={styles.srvRate}>4.5+</Text>
                                </View>

                                <Pressable
                                  style={styles.srvAddBtn}
                                  onPress={() => {
                                 
                                    setSelectedToAdd(srv);
                                    setPriceDraft(String(srv.minPrice || 100));
                                  }}
                                >
                                  <Text style={styles.srvAddText}>Ajouter</Text>
                                </Pressable>
                              </View>
                            </View>
                          );
                        })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* footer */}
            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>Vous pouvez ajouter jusqu'à 15 services simultanément</Text>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!selectedToAdd}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedToAdd(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.priceModal}>
            <Text style={styles.priceModalTitle}>Tarif par défaut</Text>
            <Text style={styles.priceModalSub}>Définissez votre prix pour ce service</Text>

            <View style={styles.priceInputWrap2}>
              <Text style={styles.madPrefix2}>MAD</Text>
              <TextInput
                value={priceDraft}
                onChangeText={setPriceDraft}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor="#9CA3AF"
                style={styles.priceInput2}
              />
            </View>

            <View style={styles.priceModalBtns}>
              <Pressable
                style={[styles.pmBtn, styles.pmBtnGhost]}
                onPress={() => setSelectedToAdd(null)}
              >
                <Text style={styles.pmBtnGhostText}>Annuler</Text>
              </Pressable>

              <Pressable
                style={[styles.pmBtn, styles.pmBtnSolid]}
                onPress={async () => {
                  const srv = selectedToAdd;
                  setSelectedToAdd(null);
                  await handleUpdatePrice(srv, priceDraft || (srv?.minPrice || 100));
                  setIsAddModalOpen(false);
                }}
              >
                <Save size={16} color="#fff" />
                <Text style={styles.pmBtnSolidText}>Enregistrer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },

  container: { padding: 16, paddingTop: 18 },

  loadingWrap: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  loadingText: { color: '#2563EB', fontWeight: '700' },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16
  },
  h1: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 6 },
  hSub: { color: '#6B7280' },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 3
  },
  addBtnText: { color: '#fff', fontWeight: '800' },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14
  },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 4 },
  statIconBox: { padding: 10, borderRadius: 12 },

  emptyBox: {
    marginTop: 18,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    padding: 18,
    alignItems: 'center'
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  emptyTitle: { fontWeight: '900', color: '#111827', marginBottom: 4 },
  emptyText: { color: '#6B7280', fontSize: 13, textAlign: 'center', marginBottom: 10 },
  emptyLink: { color: '#2563EB', fontWeight: '900' },

  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12
  },
  serviceTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  serviceIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center'
  },
  serviceIconText: { fontSize: 22 },
  serviceName: { fontSize: 16, fontWeight: '900', color: '#111827' },

  serviceMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  serviceMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  serviceMetaText: { fontSize: 11, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' },
  serviceRateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  serviceRateText: { fontSize: 11, fontWeight: '900', color: '#CA8A04' },

  trashBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FEF2F2'
  },

  metricsBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12
  },
  metricCell: { width: '50%', alignItems: 'center' },
  metricValue: { fontWeight: '900', color: '#111827' },
  metricLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },

  priceBox: { paddingTop: 14, marginTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  priceHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  priceTitle: { fontWeight: '900', color: '#374151' },
  priceSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  marketPill: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  marketPillText: { fontSize: 11, color: '#6B7280', fontWeight: '700' },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  priceInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48
  },
  madPrefix: { color: '#9CA3AF', fontWeight: '900', fontSize: 12, marginRight: 8 },
  priceInput: { flex: 1, fontWeight: '900', color: '#111827' },

  priceQuickRow: { flexDirection: 'row', gap: 8 },
  quickBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  quickBtnText: { fontWeight: '900', color: '#4B5563' },

  bottomHintsRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  hintItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hintText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  modalSub: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  modalCloseBtn: { padding: 8, borderRadius: 999, backgroundColor: '#fff' },

  modalBody: { padding: 16 },

  catCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14
  },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catIcon: { fontSize: 22 },
  catName: { fontSize: 16, fontWeight: '900', color: '#111827' },
  catDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  srvCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff'
  },
  srvTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  srvName: { fontWeight: '900', color: '#111827', fontSize: 13 },
  srvDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  srvPricePill: { backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  srvPriceText: { fontSize: 11, fontWeight: '900', color: '#2563EB' },

  srvBottom: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  srvRate: { fontSize: 11, color: '#6B7280', fontWeight: '700' },

  srvAddBtn: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  srvAddText: { fontSize: 12, fontWeight: '900', color: '#374151' },

  modalFooter: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  modalFooterText: { textAlign: 'center', color: '#6B7280', fontSize: 12, fontWeight: '600' },

  priceModal: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  priceModalTitle: { fontSize: 16, fontWeight: '900', color: '#111827' },
  priceModalSub: { fontSize: 12, color: '#6B7280', marginTop: 4, marginBottom: 12 },

  priceInputWrap2: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48
  },
  madPrefix2: { color: '#9CA3AF', fontWeight: '900', fontSize: 12, marginRight: 8 },
  priceInput2: { flex: 1, fontWeight: '900', color: '#111827' },

  priceModalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  pmBtn: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  pmBtnGhost: { backgroundColor: '#F3F4F6' },
  pmBtnGhostText: { fontWeight: '900', color: '#374151' },
  pmBtnSolid: { backgroundColor: '#2563EB' },
  pmBtnSolidText: { fontWeight: '900', color: '#fff' }
});
