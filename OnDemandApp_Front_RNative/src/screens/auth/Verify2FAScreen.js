import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Mail, RefreshCw } from 'lucide-react-native';
import axiosClient from '../../api/axiosClient';

export default function VerifyEmailScreen({ route, navigation }) {
  const { email } = route.params || {};
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!email || !code) {
      Alert.alert("Erreur", "Code manquant");
      return;
    }

    setLoading(true);
    try {
      await axiosClient.post('/api/auth/verify-email', {
        email,
        code: code.trim()
      });

      Alert.alert("Succès", "Email vérifié !", [
        { text: "OK", onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err) {
      Alert.alert(
        "Erreur",
        err?.response?.data?.message || "Code invalide ou expiré"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await axiosClient.post('/api/auth/resend-verification', { email });
      Alert.alert("Envoyé", "Nouveau code envoyé !");
    } catch {
      Alert.alert("Erreur", "Impossible de renvoyer le code");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.icon}>
            <Mail color="#fff" size={32} />
          </View>

          <Text style={styles.title}>Vérifiez votre email</Text>
          <Text style={styles.subtitle}>{email}</Text>

          <TextInput
            placeholder="Code de vérification"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            textAlign="center"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Confirmer</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resend} onPress={handleResend}>
            <RefreshCw size={16} color="#0d9488" />
            <Text style={styles.resendText}>Renvoyer le code</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6
  },
  subtitle: {
    color: '#64748b',
    marginBottom: 32,
    textAlign: 'center'
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    fontSize: 18,
    marginBottom: 20,
    backgroundColor: '#f8fafc'
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#0d9488',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  resend: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
    alignItems: 'center'
  },
  resendText: {
    color: '#0d9488',
    fontWeight: '600'
  }
});
