import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosClient from '../../api/axiosClient';
import { Package, Search, Clock, CheckCircle, Truck, XCircle, Home, ArrowLeft } from 'lucide-react-native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ClientOrdersScreen({ navigation, route }) {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchText, setSearchText] = useState('');

    const fetchOrders = useCallback(async () => {
        try {
            const res = await axiosClient.get('/orders/my');
            setOrders(res.data || []);
            setFilteredOrders(res.data || []);
        } catch (e) { console.error(e); } 
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    useEffect(() => {
        const orderId = route?.params?.orderId || route?.params?.openOrderId;
        if (orderId) {
            navigation.navigate('OrderDetails', { orderId });
        
            try {
                navigation.setParams({ orderId: undefined, openOrderId: undefined });
            } catch (e) {}
        }
    }, [route?.params, navigation]);

    useEffect(() => {
        if (!orders) return;
        let res = orders;
        if (statusFilter !== 'all') {
            const codeMap = { 'pending': [1,2], 'in_progress': [3,7], 'completed': [4], 'cancelled': [5,6] };
            res = res.filter(o => codeMap[statusFilter]?.includes(o.statusCode || o.StatusCode));
        }
        if (searchText) {
            res = res.filter(o => (o.serviceName||'').toLowerCase().includes(searchText.toLowerCase()));
        }
        setFilteredOrders(res);
    }, [statusFilter, searchText, orders]);

    const getStatusInfo = (code) => {
        switch(code) {
            case 1: return { label: 'En attente', color: '#eab308', icon: Clock };
            case 2: return { label: 'Acceptée', color: '#0d9488', icon: CheckCircle };
            case 3: case 7: return { label: 'En cours', color: '#3b82f6', icon: Truck };
            case 4: return { label: 'Terminée', color: '#6366f1', icon: Package };
            default: return { label: 'Annulée', color: '#ef4444', icon: XCircle };
        }
    };

    const renderOrder = ({ item }) => {
        const { label, color, icon: Icon } = getStatusInfo(item.statusCode || item.StatusCode);
        return (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OrderDetails', { orderId: item.id || item.Id })}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                        <Icon size={20} color={color} />
                    </View>
                    <View style={{flex: 1, marginLeft: 12}}>
                        <Text style={styles.serviceName}>{item.serviceName || "Service"}</Text>
                        <Text style={styles.providerName}>{item.providerName || "En attente"}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
                        <Text style={[styles.statusText, { color: color }]}>{label}</Text>
                    </View>
                </View>
                <View style={styles.cardDivider} />
                <View style={styles.cardFooter}>
                    <Text style={styles.date}>
                        {item.createdAt ? format(new Date(item.createdAt), 'dd MMM', { locale: fr }) : ''}
                    </Text>
                    <Text style={styles.price}>{item.price} MAD</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
       
            <View style={styles.header}>
                <View style={styles.topRow}>
                    <Text style={styles.headerTitle}>Mes Commandes</Text>
                   
                    <TouchableOpacity 
                        style={styles.homeBtn} 
                        onPress={() => navigation.navigate('ClientTabs', { screen: 'HomeTab' })}
                    >
                        <Home size={22} color="#0f172a" />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.searchBox}>
                    <Search size={20} color="#94a3b8" />
                    <TextInput style={styles.input} placeholder="Rechercher..." value={searchText} onChangeText={setSearchText} />
                </View>
                <View style={styles.filters}>
                    {[{id:'all',l:'Toutes'}, {id:'pending',l:'En attente'}, {id:'in_progress',l:'En cours'}, {id:'completed',l:'Finies'}].map(f => (
                        <TouchableOpacity key={f.id} style={[styles.filterChip, statusFilter===f.id && styles.activeChip]} onPress={()=>setStatusFilter(f.id)}>
                            <Text style={[styles.chipText, statusFilter===f.id && styles.activeChipText]}>{f.l}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <FlatList 
                data={filteredOrders}
                renderItem={renderOrder}
                keyExtractor={(item, i) => (item.id || i).toString()}
                contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} />}
                ListEmptyComponent={<Text style={styles.empty}>Aucune commande trouvée.</Text>}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { backgroundColor: 'white', padding: 20, paddingBottom: 10 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
    homeBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 12 },
    
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, height: 46, marginBottom: 15 },
    input: { flex: 1, marginLeft: 10, fontSize: 16 },
    filters: { flexDirection: 'row', gap: 10 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
    activeChip: { backgroundColor: '#0f172a' },
    chipText: { color: '#64748b', fontWeight: '600', fontSize: 12 },
    activeChipText: { color: 'white' },
    
    card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    serviceName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    providerName: { fontSize: 12, color: '#64748b', marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    cardDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    date: { color: '#94a3b8', fontSize: 12 },
    price: { fontSize: 16, fontWeight: 'bold', color: '#0d9488' },
    empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' },
});
