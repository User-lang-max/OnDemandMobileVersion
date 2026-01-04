import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import axiosClient from '../../api/axiosClient';
import { FileText, CheckCircle, UploadCloud, Calendar } from 'lucide-react-native';

export default function ProviderOnboardingScreen({ navigation }) {
    const [formData, setFormData] = useState({ bio: '', interviewDate: '' });
    const [files, setFiles] = useState({ cv: null, photo: null });
    const [loading, setLoading] = useState(false);

    const pickFile = async (type) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ 
                type: type === 'cv' ? 'application/pdf' : 'image/*' 
            });
            
            if (result.type === 'success' || !result.canceled) {
          
                const file = result.assets ? result.assets[0] : result;
                setFiles(prev => ({ ...prev, [type]: file }));
            }
        } catch (e) {
            Alert.alert("Erreur", "Impossible de sélectionner le fichier");
        }
    };

    const handleSubmit = async () => {
        if (!files.cv || !formData.interviewDate) {
            return Alert.alert("Incomplet", "Veuillez remplir la date et ajouter votre CV.");
        }

        setLoading(true);
        const data = new FormData();
        data.append('bio', formData.bio);
        data.append('interviewDate', formData.interviewDate);
        
 
        data.append('cv', {
            uri: files.cv.uri,
            name: files.cv.name || 'cv.pdf',
            type: files.cv.mimeType || 'application/pdf'
        });

        if (files.photo) {
            data.append('photo', {
                uri: files.photo.uri,
                name: files.photo.name || 'photo.jpg',
                type: files.photo.mimeType || 'image/jpeg'
            });
        }

        try {
            await axiosClient.post('/provider/onboarding', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            Alert.alert("Succès", "Dossier envoyé ! Nous vous contacterons.", [
                { text: "OK", onPress: () => navigation.navigate('Login') }
            ]);
        } catch (e) {
            console.error(e);
            Alert.alert("Erreur", "L'envoi a échoué.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ padding: 24 }}>
                <Text style={styles.title}>Bienvenue Pro ! 🛠️</Text>
                <Text style={styles.subtitle}>Finalisez votre inscription pour commencer.</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Bio (Optionnel)</Text>
                    <TextInput 
                        style={[styles.input, {height: 80}]} 
                        multiline 
                        placeholder="Parlez-nous de votre expérience..."
                        value={formData.bio}
                        onChangeText={t => setFormData({...formData, bio: t})}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Date d'entretien souhaitée</Text>
                    <View style={styles.inputContainer}>
                        <Calendar size={20} color="#64748b"/>
                        <TextInput 
                            style={styles.inputNoBorder}
                            placeholder="YYYY-MM-DD HH:mm"
                            value={formData.interviewDate}
                            onChangeText={t => setFormData({...formData, interviewDate: t})}
                        />
                    </View>
                </View>

                {/* Upload CV */}
                <TouchableOpacity style={styles.uploadBox} onPress={() => pickFile('cv')}>
                    {files.cv ? (
                        <>
                            <CheckCircle size={32} color="#10b981"/>
                            <Text style={styles.fileName}>{files.cv.name}</Text>
                        </>
                    ) : (
                        <>
                            <FileText size={32} color="#94a3b8"/>
                            <Text style={styles.uploadText}>Téléverser votre CV (PDF)</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Upload Photo */}
                <TouchableOpacity style={styles.uploadBox} onPress={() => pickFile('photo')}>
                    {files.photo ? (
                        <>
                            <CheckCircle size={32} color="#10b981"/>
                            <Text style={styles.fileName}>Photo ajoutée</Text>
                        </>
                    ) : (
                        <>
                            <UploadCloud size={32} color="#94a3b8"/>
                            <Text style={styles.uploadText}>Photo de profil (Optionnel)</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.submitBtn, loading && {opacity: 0.7}]} 
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.submitText}>{loading ? "Envoi..." : "Envoyer mon dossier"}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
    subtitle: { color: '#64748b', marginBottom: 32 },
    formGroup: { marginBottom: 20 },
    label: { fontWeight: 'bold', color: '#334155', marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, backgroundColor: '#f8fafc', textAlignVertical: 'top' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#f8fafc', height: 50 },
    inputNoBorder: { flex: 1, marginLeft: 10 },
    uploadBox: { height: 120, borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: '#f8fafc' },
    uploadText: { color: '#64748b', fontWeight: '600', marginTop: 8 },
    fileName: { color: '#0f172a', fontWeight: 'bold', marginTop: 8 },
    submitBtn: { backgroundColor: '#0d9488', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 20, shadowColor: '#0d9488', elevation: 4 },
    submitText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});