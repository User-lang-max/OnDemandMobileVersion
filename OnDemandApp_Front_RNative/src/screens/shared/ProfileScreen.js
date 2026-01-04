import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { User, Shield, LogOut, ChevronRight, Settings, Mail, Phone, Calendar, Award, CreditCard } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [is2FA, setIs2FA] = useState(false);

  useEffect(() => {
    axiosClient.get('/auth/me').then(res => {
        setProfile(res.data);
        setIs2FA(res.data.twoFactorEnabled);
    }).catch(e => console.log("Cache used"));
  }, []);

  const toggle2FA = async () => {
    try {
        await axiosClient.post('/auth/toggle-2fa');
        setIs2FA(!is2FA);
    } catch(e) { console.error(e); }
  };

  const menuItems = [
    { icon: User, label: 'Informations personnelles', color: '#4f46e5', bg: '#eef2ff', screen: 'EditProfile' },
    { icon: CreditCard, label: 'Méthodes de paiement', color: '#059669', bg: '#d1fae5', screen: 'PaymentMethods' },
    { icon: Calendar, label: 'Mes rendez-vous', color: '#dc2626', bg: '#fee2e2', screen: 'Appointments' },
    { icon: Award, label: 'Badges & Récompenses', color: '#d97706', bg: '#fef3c7', screen: 'Achievements' },
    { icon: Settings, label: 'Paramètres', color: '#6b7280', bg: '#f3f4f6', screen: 'Settings' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header avec Gradient */}
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#6366f1', '#4f46e5']}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {profile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
            <View style={styles.onlineIndicator} />
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.fullName || 'Utilisateur'}</Text>
            <View style={styles.contactInfo}>
              <Mail size={14} color="#94a3b8" />
              <Text style={styles.profileEmail}>{profile?.email || 'email@example.com'}</Text>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Commandes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>4.8</Text>
                <Text style={styles.statLabel}>Note</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>2</Text>
                <Text style={styles.statLabel}>Favoris</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Section Sécurité */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sécurité</Text>
        <View style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
              <Shield size={20} color="#16a34a" />
            </View>
            <View style={styles.securityInfo}>
              <Text style={styles.securityTitle}>Authentification à deux facteurs</Text>
              <Text style={styles.securityDescription}>
                Ajoutez une couche de sécurité supplémentaire à votre compte
              </Text>
            </View>
          </View>
          <Switch
            value={is2FA}
            onValueChange={toggle2FA}
            trackColor={{ true: '#16a34a', false: '#e5e7eb' }}
            thumbColor="#ffffff"
            ios_backgroundColor="#e5e7eb"
          />
        </View>
      </View>

      {/* Menu Principal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mon compte</Text>
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: item.bg }]}>
                <item.icon size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <ChevronRight size={18} color="#d1d5db" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bouton Déconnexion */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={logout}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#ef4444', '#dc2626']}
          style={styles.logoutGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <LogOut size={20} color="white" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>OnDemandApp v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#1e293b',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileEmail: {
    color: '#cbd5e1',
    fontSize: 14,
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  securityCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  securityInfo: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  securityDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  logoutButton: {
    marginHorizontal: 24,
    marginTop: 32,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 40,
  },
  versionText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
});