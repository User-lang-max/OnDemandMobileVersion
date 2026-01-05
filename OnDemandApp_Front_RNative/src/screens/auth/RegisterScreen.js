import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 0
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);

  try {
    const result = await register(
      formData.email,
      formData.fullName,
      formData.password,
      formData.role
    );

   
    if (result?.role === 'client') {
      navigation.replace('Login', { email: formData.email });
      return;
    }

    if (result?.role === 'provider_pending_onboarding') {
      navigation.replace('ProviderOnboarding');
      return;
    }

    // fallback sécurité
    return;

  } catch (error) {
 
    Alert.alert(
      "Erreur",
      error?.response?.data?.message || "Erreur lors de l'inscription"
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.logo}>
              <User color="#fff" size={28} />
            </View>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Rejoignez OnDemandAPP</Text>
          </View>

          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleBtn, formData.role === 0 && styles.roleActive]}
              onPress={() => setFormData({ ...formData, role: 0 })}
            >
              <Text style={styles.roleText}>Client</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleBtn, formData.role === 1 && styles.roleActive]}
              onPress={() => setFormData({ ...formData, role: 1 })}
            >
              <Text style={styles.roleText}>Prestataire</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <User size={20} color="#94a3b8" />
            <TextInput
              placeholder="Nom complet"
              placeholderTextColor="#94a3b8"
              style={styles.input}
              value={formData.fullName}
              onChangeText={v => setFormData({ ...formData, fullName: v })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Mail size={20} color="#94a3b8" />
            <TextInput
              placeholder="Adresse email"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              value={formData.email}
              onChangeText={v => setFormData({ ...formData, email: v })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Lock size={20} color="#94a3b8" />
            <TextInput
              placeholder="Mot de passe"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              style={styles.input}
              value={formData.password}
              onChangeText={v => setFormData({ ...formData, password: v })}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>S'inscrire</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text>Déjà un compte ? </Text>
            <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
              Se connecter
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#64748b', marginTop: 6 },
  roleContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center'
  },
  roleActive: { backgroundColor: '#0d9488' },
  roleText: { color: '#000', fontWeight: '600' },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16 },
  button: {
    backgroundColor: '#0d9488',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  link: { color: '#0d9488', fontWeight: '600' }
});
