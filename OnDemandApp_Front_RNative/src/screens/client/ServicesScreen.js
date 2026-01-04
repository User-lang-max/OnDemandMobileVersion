import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Modal,
    TextInput,
    Alert,
    StatusBar,
    Keyboard,
    Vibration,
    Dimensions,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosClient from '../../api/axiosClient';
import { ArrowLeft, ChevronRight, Shield, Star, CheckCircle, X, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const MIN_PRICE = 50;
const MAX_PRICE = 10000;

export default function ClientServicesScreen({ route, navigation }) {
    const { categoryId, catName } = route.params || {};

    const [step, setStep] = useState(categoryId ? 2 : 1);
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [providers, setProviders] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedCategory, setSelectedCategory] =
        useState(categoryId ? { id: categoryId, name: catName } : null);
    const [selectedService, setSelectedService] = useState(null);
    const [negotiatingProvider, setNegotiatingProvider] = useState(null);

    const [offerPrice, setOfferPrice] = useState('');
    const [loading, setLoading] = useState(false);

    const [serviceGuid, setServiceGuid] = useState(null);

    useEffect(() => {
        loadInitialData();
    }, [categoryId]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            if (categoryId) {
                const res = await axiosClient.get(`/catalog/categories/${categoryId}/items`);
                setServices(res.data);
            } else {
                const res = await axiosClient.get('/catalog/categories');
                setCategories(res.data);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCategory = async (cat) => {
        setLoading(true);
        setSelectedCategory(cat);
        const res = await axiosClient.get(`/catalog/categories/${cat.id}/items`);
        setServices(res.data);
        setStep(2);
        setLoading(false);
    };

    const handleSelectService = async (service) => {
        setLoading(true);
        setSelectedService(service);
        setServiceGuid(null);

        const detail = await axiosClient.get(`/catalog/services/${service.id}`);
        setServiceGuid(detail.data.serviceId);

        const res = await axiosClient.get(`/catalog/search`, {
            params: { serviceId: service.id }
        });
        setProviders(res.data);
        setStep(3);
        setLoading(false);
    };

    const openNegotiation = (provider) => {
        Vibration.vibrate(10);
        setNegotiatingProvider(provider);
        setOfferPrice(provider.basePrice?.toString() || '');
    };

    const submitOrder = async () => {
        Keyboard.dismiss();

        const price = parseInt(offerPrice, 10);
        if (isNaN(price) || price < MIN_PRICE || price > MAX_PRICE) {
            Alert.alert("Prix invalide", `Le prix doit être entre ${MIN_PRICE} et ${MAX_PRICE} MAD`);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                serviceId: serviceGuid,
                providerId: negotiatingProvider.providerId,
                price,
                date: new Date().toISOString(),
                address: "Position Actuelle (Mobile)",
                lat: 33.5731,
                lng: -7.5898
            };

            const res = await axiosClient.post('/orders', payload);
            const newOrderId = res.data?.id || res.data?.orderId;

            setNegotiatingProvider(null);

            Alert.alert("Succès", "Votre commande a été envoyée !", [
                {
                    text: "Voir ma commande",
                    onPress: () =>
                        navigation.navigate('ClientTabs', {
                            screen: 'OrdersTab',
                            params: { orderId: newOrderId }
                        })
                }
            ]);
        } catch (error) {
            Alert.alert("Erreur", "Échec de la commande");
        } finally {
            setLoading(false);
        }
    };

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderHeader = () => (
        <LinearGradient
            colors={['#0f172a', '#1e293b']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (step === 3) setStep(2);
                        else if (step === 2 && !categoryId) setStep(1);
                        else navigation.goBack();
                    }}
                    style={styles.backBtn}
                >
                    <ArrowLeft size={24} color="#ffffff" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>
                        {step === 1 ? 'Catégories' : step === 2 ? selectedCategory?.name : 'Prestataires'}
                    </Text>
                    <Text style={styles.headerSub}>Étape {step} sur 3</Text>
                </View>
                <View style={{width: 40}} />
            </View>
        </LinearGradient>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            {renderHeader()}

            <View style={styles.content}>
                {step === 2 && (
                    <View style={styles.searchContainer}>
                        <View style={styles.searchBox}>
                            <Search size={20} color="#64748b" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Rechercher un service..."
                                placeholderTextColor="#94a3b8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery ? (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <X size={18} color="#ef4444" />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>
                )}

                {loading && !negotiatingProvider ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#0d9488" />
                        <Text style={styles.loadingText}>Chargement...</Text>
                    </View>
                ) : (
                    <>
                        {step === 1 && (
                            <FlatList
                                data={categories}
                                keyExtractor={item => item.id.toString()}
                                numColumns={2}
                                columnWrapperStyle={{ justifyContent: 'space-between' }}
                                contentContainerStyle={{ paddingBottom: 30 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={styles.catCard} 
                                        onPress={() => handleSelectCategory(item)}
                                        activeOpacity={0.9}
                                    >
                                        <LinearGradient
                                            colors={['#f0fdfa', '#ccfbf1']}
                                            style={styles.catIcon}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Text style={styles.catIconText}>{item.icon}</Text>
                                        </LinearGradient>
                                        <Text style={styles.catTitle}>{item.name}</Text>
                                        <Text style={styles.catCount}>12 services</Text>
                                    </TouchableOpacity>
                                )}
                                showsVerticalScrollIndicator={false}
                            />
                        )}

                        {step === 2 && (
                            <FlatList
                                data={filteredServices}
                                keyExtractor={item => item.id.toString()}
                                contentContainerStyle={{ paddingBottom: 30 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={styles.serviceCard} 
                                        onPress={() => handleSelectService(item)}
                                        activeOpacity={0.9}
                                    >
                                        <LinearGradient
                                            colors={['#f8fafc', '#ffffff']}
                                            style={styles.serviceCardInner}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <View style={styles.serviceIcon}>
                                                <Text style={styles.serviceIconText}>{item.icon}</Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.serviceTitle}>{item.name}</Text>
                                                <Text style={styles.serviceDesc}>
                                                    {item.description || 'Service professionnel'}
                                                </Text>
                                            </View>
                                            <View style={styles.priceTag}>
                                                <Text style={styles.priceTagText}>À partir de</Text>
                                                <Text style={styles.priceTagAmount}>{item.minPrice} MAD</Text>
                                            </View>
                                            <ChevronRight size={20} color="#cbd5e1" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                                showsVerticalScrollIndicator={false}
                            />
                        )}

                        {step === 3 && (
                            <FlatList
                                data={providers}
                                keyExtractor={item => item.providerId.toString()}
                                contentContainerStyle={{ paddingBottom: 30 }}
                                renderItem={({ item }) => (
                                    <View style={styles.providerCard}>
                                        <View style={styles.providerHeader}>
                                            <LinearGradient
                                                colors={['#334155', '#1e293b']}
                                                style={styles.avatar}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            >
                                                <Text style={styles.avatarText}>{item.name?.charAt(0)}</Text>
                                            </LinearGradient>
                                            <View style={{ flex: 1, marginLeft: 16 }}>
                                                <View style={styles.providerInfo}>
                                                    <Text style={styles.providerName}>{item.name}</Text>
                                                    <Shield size={16} color="#059669" fill="#059669" />
                                                </View>
                                                <View style={styles.ratingContainer}>
                                                    <View style={styles.ratingRow}>
                                                        <Star size={14} color="#fbbf24" fill="#fbbf24" />
                                                        <Text style={styles.ratingText}>{item.rating || '5.0'}</Text>
                                                        <Text style={styles.ratingCount}>({item.reviews || 24})</Text>
                                                    </View>
                                                    <Text style={styles.providerType}>Prestataire vérifié</Text>
                                                </View>
                                            </View>
                                            <View style={styles.priceContainer}>
                                                <Text style={styles.priceLabel}>À partir de</Text>
                                                <Text style={styles.priceAmount}>{item.basePrice} MAD</Text>
                                            </View>
                                        </View>

                                        <TouchableOpacity 
                                            style={styles.bookBtn} 
                                            onPress={() => openNegotiation(item)}
                                            activeOpacity={0.9}
                                        >
                                            <LinearGradient
                                                colors={['#0f172a', '#334155']}
                                                style={StyleSheet.absoluteFill}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                            />
                                            <Text style={styles.bookBtnText}>Commander maintenant</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </>
                )}
            </View>

            <Modal visible={!!negotiatingProvider} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <LinearGradient
                        colors={['#ffffff', '#f8fafc']}
                        style={styles.modalContent}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Confirmer la commande</Text>
                            <TouchableOpacity 
                                onPress={() => setNegotiatingProvider(null)}
                                style={styles.closeBtn}
                            >
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.orderSummary}>
                            <Text style={styles.modalSub}>
                                Vous commandez <Text style={styles.highlightText}>{selectedService?.name}</Text> avec{' '}
                                <Text style={styles.highlightText}>{negotiatingProvider?.name}</Text>.
                            </Text>
                            
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Service</Text>
                                <Text style={styles.summaryValue}>{selectedService?.name}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Prestataire</Text>
                                <Text style={styles.summaryValue}>{negotiatingProvider?.name}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Note</Text>
                                <View style={styles.ratingRow}>
                                    <Star size={14} color="#fbbf24" fill="#fbbf24" />
                                    <Text style={styles.summaryValue}>{negotiatingProvider?.rating || '5.0'}</Text>
                                </View>
                            </View>
                        </View>

                        <Text style={styles.label}>Prix proposé (MAD)</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.priceInput}
                                value={offerPrice}
                                keyboardType="number-pad"
                                placeholder="0"
                                placeholderTextColor="#cbd5e1"
                                onChangeText={(text) => /^\d*$/.test(text) && setOfferPrice(text)}
                            />
                            <Text style={styles.currency}>MAD</Text>
                        </View>
                        <Text style={styles.priceNote}>
                            Prix conseillé: {negotiatingProvider?.basePrice} MAD
                        </Text>

                        <TouchableOpacity
                            style={[styles.confirmBtn, (!offerPrice || loading) && { opacity: 0.5 }]}
                            onPress={submitOrder}
                            disabled={!offerPrice || loading}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['#0d9488', '#0891b2']}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <CheckCircle size={20} color="white" />
                                    <Text style={styles.confirmBtnText}>Valider et Payer</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f8fafc' 
    },
    headerGradient: {
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 50,
        paddingBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 44,
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    headerSub: {
        fontSize: 12,
        color: '#cbd5e1',
        textAlign: 'center',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
        paddingTop: 24,
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 52,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: '#1e293b',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#64748b',
        fontSize: 14,
    },
    
    // Categories
    catCard: {
        width: (width - 56) / 2,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    catIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        elevation: 4,
    },
    catIconText: {
        fontSize: 28,
    },
    catTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 4,
    },
    catCount: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
    },
    
    // Services
    serviceCard: {
        marginHorizontal: 20,
        marginBottom: 16,
    },
    serviceCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    serviceIcon: {
        width: 52,
        height: 52,
        backgroundColor: '#f0fdfa',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    serviceIconText: {
        fontSize: 22,
    },
    serviceTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    serviceDesc: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
    },
    priceTag: {
        marginRight: 12,
        alignItems: 'flex-end',
    },
    priceTagText: {
        fontSize: 11,
        color: '#94a3b8',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    priceTagAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0d9488',
    },
    
    // Providers
    providerCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    providerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 22,
        letterSpacing: 0.5,
    },
    providerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    providerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    ratingContainer: {
        gap: 2,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#475569',
    },
    ratingCount: {
        fontSize: 12,
        color: '#94a3b8',
    },
    providerType: {
        fontSize: 12,
        color: '#059669',
        fontWeight: '600',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceLabel: {
        fontSize: 11,
        color: '#94a3b8',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    priceAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0d9488',
    },
    bookBtn: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        overflow: 'hidden',
    },
    bookBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 0.3,
    },
    
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '80%',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        letterSpacing: 0.5,
    },
    closeBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    orderSummary: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    modalSub: {
        color: '#64748b',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 16,
    },
    highlightText: {
        fontWeight: 'bold',
        color: '#0d9488',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    summaryLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    label: {
        fontSize: 12,
        fontWeight: '800',
        color: '#475569',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        paddingHorizontal: 20,
        height: 60,
        marginBottom: 8,
        elevation: 2,
    },
    priceInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
        textAlign: 'center',
    },
    currency: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0d9488',
        marginLeft: 8,
    },
    priceNote: {
        fontSize: 13,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 24,
    },
    confirmBtn: {
        flexDirection: 'row',
        gap: 10,
        height: 60,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        overflow: 'hidden',
    },
    confirmBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
});