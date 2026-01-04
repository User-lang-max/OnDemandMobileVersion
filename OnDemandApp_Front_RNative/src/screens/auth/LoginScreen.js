import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';


export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, loginWithGoogle, loginWithFirebase } = useAuth();

  // ================= LOGIN  =================
  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      Alert.alert(
        'Erreur',
        err?.response?.data?.message || 'Connexion impossible'
      );
    } finally {
      setLoading(false);
    }
  };

  // =================  LOGIN FIREBASE =================
  const handleFirebaseLogin = async () => {
    setLoading(true);
    try {
      await loginWithFirebase(email, password);
    }  catch (err) {
  console.log(' FIREBASE LOGIN ERROR = ', err);

  Alert.alert(
    'Erreur Firebase',
    err?.code || err?.message || 'Connexion Firebase impossible'
  );
} finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logo}>
                  <LogIn color="#fff" size={28} />
                </View>
              </View>
              <Text style={styles.title}>Bon retour !</Text>
              <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputContainer}>
                  <Mail color="#94a3b8" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="votre@email.com"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mot de passe</Text>
                <View style={styles.inputContainer}>
                  <Lock color="#94a3b8" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Votre mot de passe"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#94a3b8"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    {showPassword ? <EyeOff color="#94a3b8" size={20} /> : <Eye color="#94a3b8" size={20} />}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
                </TouchableOpacity>
              </View>

              {/* LOGIN NORMAL */}
              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Se connecter</Text>
                    <LogIn color="black" size={20} />
                  </>
                )}
              </TouchableOpacity>

              {/*  LOGIN FIREBASE */}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#2563eb' }, loading && { opacity: 0.7 }]}
                onPress={handleFirebaseLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Se connecter (Firebase)</Text>
                    <LogIn color="white" size={20} />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Ou continuer avec</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.googleButton}
                onPress={loginWithGoogle}
                activeOpacity={0.8}
              >
                <View style={styles.googleIconContainer}>
                  <Text style={styles.googleIcon}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Continuer avec Google</Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Pas encore de compte ?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.footerLink}> S'inscrire</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  logoContainer: { marginBottom: 24 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: { fontSize: 32, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  subtitle: { color: '#64748b', fontSize: 16 },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#475569', marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1e293b' },
  eyeIcon: { padding: 4 },
  forgotPassword: { alignSelf: 'flex-end', marginTop: 8 },
  forgotPasswordText: { color: '#0d9488', fontSize: 14, fontWeight: '500' },
  button: {
    height: 56,
    backgroundColor: '#0d9488',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8
  },
  buttonText: { color: 'black', fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { marginHorizontal: 16, color: '#94a3b8', fontSize: 14 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 20,
    gap: 12
  },
  googleIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DB4437',
    alignItems: 'center',
    justifyContent: 'center'
  },
  googleIcon: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  googleButtonText: {
    flex: 1,
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center'
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: '#64748b', fontSize: 15 },
  footerLink: { color: '#0d9488', fontSize: 15, fontWeight: '600' }
});
