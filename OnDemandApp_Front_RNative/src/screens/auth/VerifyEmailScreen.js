import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { Mail, ArrowRight, ExternalLink } from 'lucide-react-native';


export default function VerifyEmailScreen({ route, navigation }) {
  const email = route.params?.email?.trim().toLowerCase() || '';

  const openMailbox = async () => {
    try {
      const url = 'mailto:';
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
      else Alert.alert('Info', 'Ouvre ta boîte mail manuellement (Gmail, Outlook, etc.).');
    } catch {
      Alert.alert('Info', 'Ouvre ta boîte mail manuellement (Gmail, Outlook, etc.).');
    }
  };

  const goToLogin = () => {
    Alert.alert(
      'Connexion',
      "Après avoir cliqué sur le lien de vérification dans l’email, connecte-toi ici.",
      [{ text: 'OK', onPress: () => navigation.replace('Login', { email }) }]
    );
  };

  const resendHint = () => {
    Alert.alert(
      'Je n’ai rien reçu',
      "Vérifie Spam/Promotions. Si besoin, refais un Register avec le même email (Firebase renverra un lien) ou utilise « mot de passe oublié »."
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.icon}>
            <Mail color="#fff" size={32} />
          </View>

          <Text style={styles.title}>Vérifie ton email</Text>
          {!!email && <Text style={styles.subtitle}>{email}</Text>}

          <View style={styles.box}>
            <Text style={styles.step}>1) Ouvre ta boîte mail</Text>
            <Text style={styles.step}>2) Clique sur le lien de vérification</Text>
            <Text style={styles.step}>3) Reviens ici et connecte-toi</Text>
          </View>

          <TouchableOpacity style={styles.buttonOutline} onPress={openMailbox}>
            <ExternalLink size={18} color="#0d9488" />
            <Text style={styles.buttonOutlineText}>Ouvrir ma boîte mail</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={goToLogin}>
            <Text style={styles.buttonText}>J’ai vérifié → Se connecter</Text>
            <ArrowRight size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resend} onPress={resendHint}>
            <Text style={styles.resendText}>Je n’ai rien reçu</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#64748b', marginBottom: 18 },
  box: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18
  },
  step: { color: '#0f172a', marginBottom: 6, fontWeight: '600' },
  buttonOutline: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0d9488',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
  buttonOutlineText: { color: '#0d9488', fontSize: 16, fontWeight: '700' },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#0d9488',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resend: { marginTop: 18 },
  resendText: { color: '#0d9488', fontWeight: '700' }
});
