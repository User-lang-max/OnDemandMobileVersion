import React, { useEffect, useState } from 'react';
import { 
    View,
    Linking,
    Text, 
    ScrollView, 
    TouchableOpacity, 
    TextInput, 
    StyleSheet, 
    ActivityIndicator, 
    Dimensions, 
    StatusBar, 
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
    Search, 
    MapPin, 
    Star, 
    Sparkles, 
    User, 
    Bell, 
    ChevronRight, 
    Tag, 
    Percent, 
    ShieldCheck, 
    Clock, 
    Award, 
    Quote, 
    Briefcase,
    Heart,
    Users,
    CheckCircle,
    TrendingUp,
    Globe,
    Phone,
    Mail,
    MessageCircle,
    HelpCircle,
    Shield,
    Lock,
    Calendar
} from 'lucide-react-native';
import axiosClient from '../../api/axiosClient';

const { width } = Dimensions.get('window');

// --- CONFIGURATION GRID ---
const GAP = 15;
const PADDING = 20;
const COLUMNS = 3;
const ITEM_WIDTH = (width - (PADDING * 2) - (GAP * (COLUMNS - 1))) / COLUMNS;

export default function ClientHomeScreen({ navigation }) {
    const [categories, setCategories] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        providers: 1250,
        services: 85,
        clients: 12500,
        rating: 4.8
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, recRes, revRes] = await Promise.all([
                    axiosClient.get('/catalog/categories'),
                    axiosClient.get('/recommendations'),
                    axiosClient.get('/recommendations/reviews')
                ]);
                setCategories(catRes.data);
                setRecommendations(recRes.data);
                setReviews(revRes.data);
            } catch (error) {
                console.error("Erreur Home:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigation.navigate('Services', { screen: 'ServiceList', params: { search: searchQuery } });
        }
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#0d9488" />
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                
                {/* --- HERO SECTION AMÉLIORÉE --- */}
                <LinearGradient 
                    colors={['#0f172a', '#1e293b', '#334155']} 
                    style={styles.hero}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <SafeAreaView edges={['top', 'left', 'right']}>
                        <View style={styles.headerTop}>
                            <View style={styles.locationBadge}>
                                <MapPin size={14} color="#f0fdfa" />
                                <Text style={styles.locationText}>Casablanca • Votre ville</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.iconBtn}
                                onPress={() => navigation.navigate('Notifications')}
                            >
                                <Bell size={22} color="white" />
                                <View style={styles.notifDot} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.headerContent}>
                            <View style={styles.welcomeContainer}>
                                <Text style={styles.welcomeLabel}>Bonjour, bienvenue 👋</Text>
                                <Sparkles size={16} color="#fbbf24" style={{ marginLeft: 5 }} />
                            </View>
                            <Text style={styles.heroTitle}>
                                Des experts{'\n'}
                                <Text style={styles.heroHighlight}>à votre service</Text>
                            </Text>
                            <Text style={styles.heroSubtitle}>
                                Trouvez le professionnel parfait pour chaque besoin
                            </Text>
                        </View>

                        <View style={styles.searchWrapper}>
                            <View style={styles.searchBar}>
                                <Search color="#64748b" size={20} />
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="Plombier, nettoyage, électricien..." 
                                    placeholderTextColor="#94a3b8"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    onSubmitEditing={handleSearch}
                                    returnKeyType="search"
                                />
                                <TouchableOpacity 
                                    style={styles.searchButton}
                                    onPress={handleSearch}
                                >
                                    <Search size={18} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                {/* --- STATISTIQUES --- */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: '#f0fdfa' }]}>
                            <Users size={20} color="#0d9488" />
                        </View>
                        <Text style={styles.statNumber}>{stats.providers.toLocaleString('fr')}+</Text>
                        <Text style={styles.statLabel}>Experts</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                            <CheckCircle size={20} color="#d97706" />
                        </View>
                        <Text style={styles.statNumber}>{stats.services}+</Text>
                        <Text style={styles.statLabel}>Services</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: '#f0f9ff' }]}>
                            <Heart size={20} color="#0369a1" />
                        </View>
                        <Text style={styles.statNumber}>{stats.clients.toLocaleString('fr')}+</Text>
                        <Text style={styles.statLabel}>Clients</Text>
                    </View>
                </View>

                {/* --- BANNIÈRE PROMO AMÉLIORÉE --- */}
                <View style={styles.promoContainer}>
                    <LinearGradient 
                        colors={['#f59e0b', '#d97706']} 
                        start={{x:0, y:0}} 
                        end={{x:1, y:1}} 
                        style={styles.promoBanner}
                    >
                        <View style={styles.promoContent}>
                            <View style={styles.promoBadge}>
                                <Tag size={12} color="white" />
                                <Text style={styles.promoBadgeText}>LIMITÉE</Text>
                            </View>
                            <Text style={styles.promoTitle}>Première commande ?</Text>
                            <Text style={styles.promoSub}>-30% sur tous les services</Text>
                            <Text style={styles.promoCode}>Code : WELCOME30</Text>
                        </View>
                        <View style={styles.promoIcon}>
                            <Percent size={44} color="white" />
                        </View>
                    </LinearGradient>
                </View>

                {/* --- CATÉGORIES --- */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleContainer}>
                            <Text style={styles.sectionTitle}>Services populaires</Text>
                            <Text style={styles.sectionSubtitle}>Choisissez votre besoin</Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.seeAllButton}
                            onPress={() => navigation.navigate('Services')}
                        >
                            <Text style={styles.seeAll}>Tout voir</Text>
                            <ChevronRight size={14} color="#0d9488" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.categoriesGrid}>
                        {categories.slice(0, 6).map((cat, index) => (
                            <TouchableOpacity 
                                key={cat.id} 
                                style={[
                                    styles.catItem,
                                    index % 3 === 2 && styles.catItemLast
                                ]}
                                onPress={() => navigation.navigate('Services', { 
                                    categoryId: cat.id, 
                                    catName: cat.name 
                                })}
                            >
                                <LinearGradient
                                    colors={['#f0fdfa', '#ccfbf1']}
                                    style={styles.catIconBox}
                                >
                                    <Text style={styles.catIconText}>{cat.icon}</Text>
                                </LinearGradient>
                                <Text style={styles.catLabel} numberOfLines={1}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* --- À PROPOS DE NOUS --- */}
                <View style={styles.section}>
                    <View style={styles.aboutHeader}>
                        <Text style={styles.sectionTitle}>Pourquoi nous choisir ?</Text>
                        <Text style={styles.sectionDescription}>
                            La plateforme de confiance qui connecte clients et professionnels depuis 2018
                        </Text>
                    </View>
                    
                    <View style={styles.featuresContainer}>
                        <View style={styles.featureCard}>
                            <View style={[styles.featureIconContainer, { backgroundColor: '#dbeafe' }]}>
                                <ShieldCheck size={24} color="#2563eb" />
                            </View>
                            <Text style={styles.featureTitle}>Profils vérifiés</Text>
                            <Text style={styles.featureDescription}>
                                Tous nos prestataires sont vérifiés et certifiés
                            </Text>
                        </View>
                        
                        <View style={styles.featureCard}>
                            <View style={[styles.featureIconContainer, { backgroundColor: '#dcfce7' }]}>
                                <Lock size={24} color="#16a34a" />
                            </View>
                            <Text style={styles.featureTitle}>Paiement sécurisé</Text>
                            <Text style={styles.featureDescription}>
                                Transactions 100% sécurisées avec garantie de remboursement
                            </Text>
                        </View>
                        
                        <View style={styles.featureCard}>
                            <View style={[styles.featureIconContainer, { backgroundColor: '#fef3c7' }]}>
                                <Clock size={24} color="#d97706" />
                            </View>
                            <Text style={styles.featureTitle}>Disponibilité 24/7</Text>
                            <Text style={styles.featureDescription}>
                                Réservation et support disponible à tout moment
                            </Text>
                        </View>
                    </View>
                </View>

                {/* --- COMMENT ÇA MARCHE --- */}
              
<View style={styles.section}>
  
  <View style={styles.stepsContainer}>
    {[ 
      { n: 1, t: 'Choisissez votre service', d: 'Recherche simple et rapide par catégorie ou mot-clé' },
      { n: 2, t: 'Sélectionnez un expert', d: 'Comparez profils, avis et disponibilités' },
      { n: 3, t: 'Confirmez et payez', d: 'Réservation sécurisée en quelques secondes' }
    ].map(step => (
      <View key={step.n} style={styles.step}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>{step.n}</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>{step.t}</Text>
          <Text style={styles.stepDescription}>{step.d}</Text>
        </View>
      </View>
    ))}
  </View>
</View>


               {/* --- POURQUOI NOUS FAIRE CONFIANCE --- */}
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <View>
      <Text style={styles.sectionTitle}>Pourquoi nous faire confiance</Text>
      <Text style={styles.sectionSubtitle}>Une expérience pensée pour vous</Text>
    </View>
    <ShieldCheck size={20} color="#0d9488" />
  </View>

  <View style={styles.featuresContainer}>
    <View style={styles.featureCard}>
      <View style={[styles.featureIconContainer, { backgroundColor: '#f0fdfa' }]}>
        <Clock size={24} color="#0d9488" />
      </View>
      <Text style={styles.featureTitle}>Intervention rapide</Text>
      <Text style={styles.featureDescription}>
        Des experts disponibles près de chez vous, quand vous en avez besoin
      </Text>
    </View>

    <View style={styles.featureCard}>
      <View style={[styles.featureIconContainer, { backgroundColor: '#dcfce7' }]}>
        <Award size={24} color="#16a34a" />
      </View>
      <Text style={styles.featureTitle}>Qualité garantie</Text>
      <Text style={styles.featureDescription}>
        Prestataires évalués et notés après chaque mission
      </Text>
    </View>

    <View style={styles.featureCard}>
      <View style={[styles.featureIconContainer, { backgroundColor: '#e0f2fe' }]}>
        <TrendingUp size={24} color="#0284c7" />
      </View>
      <Text style={styles.featureTitle}>Prix transparents</Text>
      <Text style={styles.featureDescription}>
        Aucun frais caché, vous savez ce que vous payez
      </Text>
    </View>
  </View>
</View>


                {/* --- RECOMMANDATIONS --- */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Recommandé pour vous</Text>
                            <Text style={styles.sectionSubtitle}>Basé sur vos préférences</Text>
                        </View>
                        <Sparkles size={20} color="#f59e0b" />
                    </View>
                    
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={{ paddingHorizontal: 20 }}
                    >
                        {recommendations.map((item) => (
                            <TouchableOpacity 
                                key={item.id} 
                                style={styles.serviceCard}
                                onPress={() => navigation.navigate('ServiceDetail', { 
                                    serviceId: item.id, 
                                    serviceName: item.name 
                                })}
                            >
                                <LinearGradient
                                    colors={['#f0fdfa', '#ccfbf1']}
                                    style={styles.serviceIcon}
                                >
                                    <Text style={styles.serviceIconText}>{item.icon}</Text>
                                </LinearGradient>
                                <View style={styles.serviceInfo}>
                                    <Text style={styles.serviceName} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <Text style={styles.serviceCat} numberOfLines={1}>
                                        {item.categoryName}
                                    </Text>
                                    <View style={styles.priceContainer}>
                                        <Text style={styles.priceLabel}>À partir de</Text>
                                        <Text style={styles.priceText}>{item.minPrice} MAD</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* --- TÉMOIGNAGES --- */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Ils nous font confiance</Text>
                            <Text style={styles.sectionSubtitle}>Avis vérifiés</Text>
                        </View>
                        <View style={styles.reviewsCount}>
                            <Text style={styles.reviewsCountText}>{reviews.length}+ avis</Text>
                        </View>
                    </View>
                    
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={{ paddingHorizontal: 20 }}
                    >
                        {reviews.map((rev) => (
                            <LinearGradient
                                key={rev.id}
                                colors={['#ffffff', '#f8fafc']}
                                style={styles.reviewCard}
                            >
                                <Quote size={32} color="#e2e8f0" style={styles.quoteIcon} />
                                <View style={styles.reviewHeader}>
                                    <View style={styles.reviewerAvatar}>
                                        <Text style={styles.reviewerAvatarText}>
                                            {rev.clientName?.charAt(0) || 'C'}
                                        </Text>
                                    </View>
                                    <View style={styles.reviewerInfo}>
                                        <Text style={styles.reviewerName}>{rev.clientName || 'Client'}</Text>
                                        <View style={styles.reviewStars}>
                                            {[...Array(5)].map((_, i) => (
                                                <Star 
                                                    key={i} 
                                                    size={12} 
                                                    fill={i < (rev.rating || 5) ? "#fbbf24" : "#e2e8f0"} 
                                                    color={i < (rev.rating || 5) ? "#fbbf24" : "#e2e8f0"} 
                                                />
                                            ))}
                                        </View>
                                    </View>
                                </View>
                                <Text style={styles.reviewText} numberOfLines={4}>
                                    "{rev.comment || 'Excellent service, professionnel et ponctuel.'}"
                                </Text>
                                <View style={styles.reviewFooter}>
                                    <View style={styles.reviewService}>
                                        <Briefcase size={12} color="#64748b" />
                                        <Text style={styles.reviewServiceText}>
                                            {rev.serviceName || 'Service'}
                                        </Text>
                                    </View>
                                    <Calendar size={12} color="#94a3b8" />
                                </View>
                            </LinearGradient>
                        ))}
                    </ScrollView>
                </View>

                {/* --- CONTACT & SUPPORT --- */}
                <View style={styles.contactSection}>
                    <LinearGradient
                        colors={['#1e293b', '#0f172a']}
                        style={styles.contactCard}
                    >
                        <Text style={styles.contactTitle}>Besoin d'aide ?</Text>
                        <Text style={styles.contactDescription}>
                            Notre équipe est disponible 7j/7 pour vous accompagner
                        </Text>
                        
                       <View style={styles.contactButtons}>
  <TouchableOpacity
    style={styles.contactButton}
    onPress={() => Linking.openURL('tel:+212675775473')}
  >
    <Phone size={16} color="white" />
    <Text style={styles.contactButtonText}>Nous appeler</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.contactButton, styles.contactButtonSecondary]}
    onPress={() => Linking.openURL('https://wa.me/212675775473')}
  >
    <MessageCircle size={16} color="#0d9488" />
    <Text style={styles.contactButtonTextSecondary}>WhatsApp</Text>
  </TouchableOpacity>
</View>

                    </LinearGradient>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f8fafc' 
    },
    center: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    
    // HERO SECTION
    hero: { 
        paddingBottom: 40, 
        borderBottomLeftRadius: 30, 
        borderBottomRightRadius: 30 
    },
    headerTop: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        marginTop: 10 
    },
    locationBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(255,255,255,0.15)', 
        paddingHorizontal: 12, 
        paddingVertical: 6, 
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    locationText: { 
        color: 'white', 
        fontWeight: '600', 
        fontSize: 12, 
        marginLeft: 6 
    },
    iconBtn: { 
        width: 44, 
        height: 44, 
        backgroundColor: 'rgba(255,255,255,0.15)', 
        borderRadius: 22, 
        alignItems: 'center', 
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    notifDot: { 
        position: 'absolute', 
        top: 10, 
        right: 10, 
        width: 8, 
        height: 8, 
        backgroundColor: '#f43f5e', 
        borderRadius: 4, 
        borderWidth: 1.5, 
        borderColor: 'white' 
    },
    
    headerContent: { 
        paddingHorizontal: 20, 
        marginTop: 20, 
        marginBottom: 25 
    },
    welcomeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    welcomeLabel: { 
        color: '#cbd5e1', 
        fontSize: 14, 
        fontWeight: '500' 
    },
    heroTitle: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: 'white', 
        lineHeight: 34,
        marginBottom: 8
    },
    heroHighlight: {
        color: '#fbbf24'
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#cbd5e1',
        opacity: 0.9
    },
    
    searchWrapper: { 
        paddingHorizontal: 20, 
        marginBottom: -25 
    },
    searchBar: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'white', 
        borderRadius: 16, 
        height: 56, 
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8
    },
    input: { 
        flex: 1, 
        marginLeft: 10, 
        fontSize: 16, 
        color: '#1e293b',
        fontWeight: '500'
    },
    searchButton: {
        width: 40,
        height: 40,
        backgroundColor: '#0d9488',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },

    // STATISTICS
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginTop: 40,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4
    },
    statItem: {
        flex: 1,
        alignItems: 'center'
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 2
    },
    statLabel: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '500'
    },
    statDivider: {
        width: 1,
        height: '70%',
        backgroundColor: '#e2e8f0',
        alignSelf: 'center'
    },

    // PROMO BANNER
    promoContainer: { 
        marginTop: 20, 
        paddingHorizontal: 20 
    },
    promoBanner: { 
        flexDirection: 'row', 
        borderRadius: 20, 
        padding: 24, 
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6
    },
    promoContent: { 
        flex: 1 
    },
    promoBadge: { 
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)', 
        paddingHorizontal: 10, 
        paddingVertical: 4, 
        borderRadius: 6, 
        alignSelf: 'flex-start', 
        marginBottom: 12 
    },
    promoBadgeText: { 
        fontSize: 10, 
        fontWeight: 'bold', 
        color: 'white',
        marginLeft: 4
    },
    promoTitle: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: 'white',
        marginBottom: 4
    },
    promoSub: { 
        fontSize: 14, 
        color: 'rgba(255,255,255,0.9)', 
        marginBottom: 4 
    },
    promoCode: {
        fontSize: 12,
        color: '#fef3c7',
        fontWeight: '600',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start'
    },
    promoIcon: { 
        width: 56, 
        height: 56, 
        backgroundColor: 'rgba(255,255,255,0.15)', 
        borderRadius: 28, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },

    // SECTION GENERAL
    section: { 
        marginTop: 30 
    },
    sectionHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        marginBottom: 20 
    },
    sectionTitleContainer: {
        flex: 1
    },
    sectionTitle: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: '#0f172a',
        marginBottom: 4
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#64748b'
    },
    aboutHeader: {
        paddingHorizontal: 20,
        marginBottom: 20
    },
    sectionDescription: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 8,
        lineHeight: 20
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdfa',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12
    },
    seeAll: { 
        fontSize: 13, 
        color: '#0d9488', 
        fontWeight: '600',
        marginRight: 4
    },

    // CATEGORIES
    categoriesGrid: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        paddingHorizontal: PADDING, 
        gap: GAP 
    },
    catItem: { 
        width: ITEM_WIDTH,
        alignItems: 'center'
    },
    catItemLast: {
        marginRight: 0
    },
    catIconBox: {
        width: ITEM_WIDTH, 
        height: ITEM_WIDTH, 
        borderRadius: 20, 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    catIconText: {
        fontSize: 28
    },
    catLabel: { 
        fontSize: 12, 
        color: '#334155', 
        fontWeight: '600', 
        textAlign: 'center',
        lineHeight: 16
    },

    // FEATURES
    featuresContainer: { 
        flexDirection: 'row', 
        paddingHorizontal: 20,
        gap: 12
    },
    featureCard: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3
    },
    featureIconContainer: { 
        width: 56, 
        height: 56, 
        borderRadius: 28, 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginBottom: 12 
    },
    featureTitle: { 
        fontSize: 14, 
        fontWeight: 'bold', 
        color: '#1e293b',
        marginBottom: 4,
        textAlign: 'center'
    },
    featureDescription: {
        fontSize: 11,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 14
    },

    // STEPS
    stepsContainer: {
        paddingHorizontal: 20
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
    },
    stepNumber: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0fdfa',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#0d9488'
    },
    stepNumberText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0d9488'
    },
    stepContent: {
        flex: 1
    },
    stepTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2
    },
    stepDescription: {
        fontSize: 12,
        color: '#64748b',
        lineHeight: 16
    },
    stepDivider: {
        height: 20,
        width: 1,
        backgroundColor: '#e2e8f0',
        marginLeft: 18,
        marginBottom: 16
    },

    // EXPERTS
    expertCard: { 
        backgroundColor: 'white', 
        padding: 16, 
        borderRadius: 20, 
        width: 140, 
        marginRight: 12, 
        alignItems: 'center',
        borderWidth: 1, 
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3
    },
    expertAvatar: { 
        width: 70, 
        height: 70, 
        borderRadius: 35, 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'white'
    },
    verifiedBadge: { 
        position: 'absolute', 
        bottom: 0, 
        right: 0, 
        backgroundColor: '#0d9488', 
        borderRadius: 10, 
        padding: 4, 
        borderWidth: 2, 
        borderColor: 'white' 
    },
    expertName: { 
        fontSize: 14, 
        fontWeight: 'bold', 
        color: '#1e293b',
        marginBottom: 2
    },
    expertJob: { 
        fontSize: 11, 
        color: '#64748b', 
        marginBottom: 8 
    },
    expertInfo: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    expertRating: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 3, 
        backgroundColor: '#fffbeb', 
        paddingHorizontal: 8, 
        paddingVertical: 3, 
        borderRadius: 8 
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fffbeb',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4
    },
    ratingText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#b45309'
    },
    ratingVal: { 
        fontSize: 10, 
        fontWeight: 'bold', 
        color: '#b45309' 
    },
    expertExp: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '500'
    },

    // RECOMMENDATIONS
    serviceCard: { 
        backgroundColor: 'white', 
        padding: 16, 
        borderRadius: 20, 
        width: 160, 
        marginRight: 12, 
        borderWidth: 1, 
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3
    },
    serviceIcon: { 
        width: 56, 
        height: 56, 
        backgroundColor: '#f0fdfa', 
        borderRadius: 16, 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginBottom: 12 
    },
    serviceIconText: {
        fontSize: 24
    },
    serviceInfo: {
        flex: 1
    },
    serviceName: { 
        fontWeight: 'bold', 
        fontSize: 15, 
        color: '#1e293b', 
        marginBottom: 4 
    },
    serviceCat: { 
        fontSize: 12, 
        color: '#64748b', 
        marginBottom: 12 
    },
    priceContainer: {
        backgroundColor: '#f0fdfa',
        borderRadius: 12,
        padding: 8
    },
    priceLabel: {
        fontSize: 10,
        color: '#64748b',
        marginBottom: 2
    },
    priceText: { 
        color: '#0d9488', 
        fontWeight: 'bold', 
        fontSize: 16 
    },

    // REVIEWS
    reviewCard: {
        padding: 20, 
        borderRadius: 20, 
        width: 280, 
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    quoteIcon: { 
        position: 'absolute', 
        top: 20, 
        right: 20
    },
    reviewHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12, 
        marginBottom: 16 
    },
    reviewerAvatar: { 
        width: 48, 
        height: 48, 
        borderRadius: 24, 
        backgroundColor: '#334155', 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    reviewerAvatarText: {
        color: 'white', 
        fontWeight: 'bold', 
        fontSize: 18
    },
    reviewerInfo: {
        flex: 1
    },
    reviewerName: { 
        fontSize: 14, 
        fontWeight: 'bold', 
        color: '#1e293b',
        marginBottom: 4
    },
    reviewStars: {
        flexDirection: 'row',
        gap: 2
    },
    reviewText: { 
        fontSize: 14, 
        color: '#475569', 
        lineHeight: 20, 
        fontStyle: 'italic', 
        marginBottom: 16 
    },
    reviewFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    reviewService: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6, 
        backgroundColor: '#f1f5f9', 
        paddingHorizontal: 10, 
        paddingVertical: 4, 
        borderRadius: 8 
    },
    reviewServiceText: { 
        fontSize: 11, 
        color: '#64748b', 
        fontWeight: '600'
    },
    reviewsCount: {
        backgroundColor: '#f0fdfa',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12
    },
    reviewsCountText: {
        fontSize: 12,
        color: '#0d9488',
        fontWeight: '600'
    },

    // CONTACT SECTION
    contactSection: {
        marginTop: 30,
        paddingHorizontal: 20,
        marginBottom: 40
    },
    contactCard: {
        borderRadius: 24,
        padding: 24,
        alignItems: 'center'
    },
    contactTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
        textAlign: 'center'
    },
    contactDescription: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20
    },
    contactButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%'
    },
    contactButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0d9488',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8
    },
    contactButtonSecondary: {
        backgroundColor: 'white'
    },
    contactButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14
    },
    contactButtonTextSecondary: {
        color: '#0d9488',
        fontWeight: '600',
        fontSize: 14
    }
});