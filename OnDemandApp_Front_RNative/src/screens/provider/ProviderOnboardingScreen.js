import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

export default function ProviderOnboardingScreen() {
  const { logout } = useAuth(); // 🔑 IMPORTANT

  const [catalog, setCatalog] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  const [bio, setBio] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [cv, setCv] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  /* =========================
     LOAD SERVICE CATALOG
  ========================== */
  useEffect(() => {
    axiosClient
      .get('/catalog/tree')
      .then(res => {
        console.log('CATALOG TREE =', res.data);
        setCatalog(res.data);
      })
      .catch(err => {
        console.log(
          'CATALOG ERROR =',
          err?.response?.status,
          err?.response?.data
        );
        Alert.alert('Erreur', 'Impossible de charger le catalogue');
      });
  }, []);

  /* =========================
     SERVICE TOGGLE
  ========================== */
  const toggleService = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  /* =========================
     FILE PICKERS
  ========================== */
  const pickFile = async (type) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: type === 'cv' ? 'application/pdf' : 'image/*',
    });

    if (!result.canceled) {
      const file = result.assets[0];
      type === 'cv' ? setCv(file) : setPhoto(file);
    }
  };

  /* =========================
     SUBMIT ONBOARDING
  ========================== */
  const submitOnboarding = async () => {
    if (!cv || selectedServices.length === 0) {
      Alert.alert(
        'Erreur',
        'Veuillez sélectionner au moins un service et ajouter votre CV'
      );
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append('bio', bio);
    data.append('interviewDate', interviewDate);
    data.append('services', selectedServices.join(','));

    data.append('cv', {
      uri: cv.uri,
      name: cv.name,
      type: cv.mimeType || 'application/pdf',
    });

    if (photo) {
      data.append('photo', {
        uri: photo.uri,
        name: photo.name,
        type: photo.mimeType || 'image/jpeg',
      });
    }

    try {
      await axiosClient.post('/provider/onboarding', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert(
        'Succès',
        'Votre dossier a été envoyé avec succès.\nVous pourrez vous connecter après validation.',
        [
          {
            text: 'OK',
            onPress: async () => {
              // 🔥 RETOUR LOGIN PROPRE
              await logout();
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert(
        'Erreur',
        'Échec de l’envoi du dossier'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
  ========================== */
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* 🔙 RETOUR LOGIN */}
        <TouchableOpacity style={styles.backBtn} onPress={logout}>
          <Text style={styles.backText}>← Revenir au login</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Onboarding Prestataire</Text>

        {/* BIO */}
        <Text style={styles.label}>Présentation</Text>
        <TextInput
          style={styles.input}
          placeholder="Parlez-nous de votre expérience"
          value={bio}
          onChangeText={setBio}
          multiline
        />

        {/* DATE */}
        <Text style={styles.label}>Date d’entretien</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD HH:mm"
          value={interviewDate}
          onChangeText={setInterviewDate}
        />

        {/* CATALOG */}
        <Text style={styles.label}>Services proposés</Text>

        {catalog.map(category => (
          <View key={category.id} style={styles.category}>
            <Text style={styles.categoryTitle}>
              {category.icon} {category.name}
            </Text>

            {category.services.map(service => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceItem,
                  selectedServices.includes(service.id) &&
                    styles.serviceSelected,
                ]}
                onPress={() => toggleService(service.id)}
              >
                <Text style={styles.serviceText}>
                  {service.icon} {service.name}
                </Text>
                <Text style={styles.price}>
                  À partir de {service.minPrice} DH
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* FILES */}
        <TouchableOpacity
          style={styles.fileBtn}
          onPress={() => pickFile('cv')}
        >
          <Text>
            {cv ? `CV : ${cv.name}` : 'Ajouter CV (PDF)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fileBtn}
          onPress={() => pickFile('photo')}
        >
          <Text>
            {photo ? 'Photo ajoutée' : 'Ajouter photo (optionnel)'}
          </Text>
        </TouchableOpacity>

        {/* SUBMIT */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={submitOnboarding}
          disabled={loading}
        >
          <Text style={styles.submitText}>
            {loading ? 'Envoi...' : 'Envoyer mon dossier'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  backBtn: {
    marginBottom: 10,
  },
  backText: {
    color: '#0d9488',
    fontWeight: '600',
    fontSize: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
  },
  label: {
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  category: { marginTop: 12 },
  categoryTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
  },
  serviceItem: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    marginBottom: 6,
  },
  serviceSelected: {
    backgroundColor: '#ccfbf1',
    borderWidth: 1,
    borderColor: '#14b8a6',
  },
  serviceText: { fontWeight: '600' },
  price: { fontSize: 12, color: '#64748b' },
  fileBtn: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
  },
  submitBtn: {
    marginTop: 30,
    backgroundColor: '#0d9488',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
