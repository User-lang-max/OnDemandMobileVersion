import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import axiosClient from "../../api/axiosClient";
import { StripeProvider, CardField, useStripe } from "@stripe/stripe-react-native";
import { WebView } from "react-native-webview";
import { ArrowLeft, CheckCircle, CreditCard, Wallet } from 'lucide-react-native';

const STRIPE_PUBLISHABLE_KEY = "pk_test_VOTRE_CLE_STRIPE_PUBLIC";

export default function PaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const params = route.params || {};
  const passedJob = params.job || {}; 
  const jobIdFromParams = params.jobId || passedJob.id || passedJob.Id;
  const serviceId = params.serviceId || passedJob.serviceId || passedJob.ServiceId;
  const providerId = params.providerId || passedJob.providerId || passedJob.ProviderId;
  const rawPrice = params.price || passedJob.price || passedJob.Price;
  const providerName = params.providerName || passedJob.providerName || passedJob.ProviderName || "Prestataire";
  const serviceName = params.serviceName || passedJob.serviceName || passedJob.ServiceName || "Service";
  
  const [paymentMethod, setPaymentMethod] = useState("Stripe");
  const [processing, setProcessing] = useState(false);

  const priceNumber = useMemo(() => {
    if (typeof rawPrice === "number") return rawPrice;
    if (typeof rawPrice === "string") {
      const n = Number(rawPrice.replace(",", ".").replace(/[^0-9.]/g, ""));
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  }, [rawPrice]);

  const finalizeOrder = async (transactionId, method) => {
    try {
      setProcessing(true);
      let finalJobId = jobIdFromParams;

      if (!finalJobId) {
          const orderRes = await axiosClient.post("/orders", {
            serviceId, providerId, price: priceNumber, address: params.address || "GPS", lat: params.lat || 0, lng: params.lng || 0,
          });
          finalJobId = orderRes.data?.jobId;
      }

      if (!finalJobId) throw new Error("jobId manquant");

      const basePayload = { jobId: finalJobId, method: method, transactionId: transactionId || `MANUAL-${Date.now()}`, price: priceNumber };
      
      try { await axiosClient.post("/payments/pay", basePayload); } 
      catch (err1) { await axiosClient.post("/payments/pay", { dto: basePayload }); }

      Alert.alert("Succès", "Paiement réussi !", [
          { text: "OK", onPress: () => navigation.navigate('ClientTabs', { screen: 'OrdersTab' }) }
      ]);
      
    } catch (err) {
      Alert.alert("Erreur", "Le paiement a échoué.");
    } finally { setProcessing(false); }
  };

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <View style={styles.page}>
        
        {/* --- HEADER NAVIGATION --- */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <ArrowLeft size={24} color="#1e3a8a" />
                <Text style={styles.backText}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Paiement</Text>
            <View style={{width: 60}} />
        </View>

        <View style={styles.card}>
          <View style={styles.left}>
            <Text style={styles.title}>Récapitulatif</Text>
            <View style={styles.summary}>
              <View style={styles.row}>
                <Text style={styles.label}>Service</Text>
                <Text style={styles.value}>{serviceName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Prestataire</Text>
                <Text style={styles.value}>{providerName}</Text>
              </View>
              <View style={[styles.row, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total à payer</Text>
                <Text style={styles.totalValue}>{String(priceNumber)} MAD</Text>
              </View>
            </View>
            <View style={styles.secureBox}>
                <CheckCircle size={16} color="#16a34a" />
                <Text style={styles.secureText}>Paiement sécurisé. Argent bloqué jusqu'à fin de mission.</Text>
            </View>
          </View>

          <View style={styles.right}>
            <Text style={styles.rightTitle}>Moyen de paiement</Text>
            <View style={styles.tabs}>
              {["Stripe", "PayPal", "Cash"].map((m) => (
                <TouchableOpacity key={m} onPress={() => setPaymentMethod(m)} style={[styles.tab, paymentMethod === m ? styles.tabActive : null]} disabled={processing}>
                  <Text style={[styles.tabText, paymentMethod === m ? styles.tabTextActive : null]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {paymentMethod === "Stripe" && <StripeFormRN price={priceNumber} processing={processing} setProcessing={setProcessing} finalizeOrder={finalizeOrder} />}
            
            {paymentMethod === "PayPal" && <PayPalBox price={priceNumber} processing={processing} setProcessing={setProcessing} finalizeOrder={finalizeOrder} />}

            {paymentMethod === "Cash" && (
                <TouchableOpacity onPress={() => finalizeOrder(null, "Cash")} disabled={processing} style={styles.greenBtn}>
                  {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.greenBtnText}>Payer en espèces</Text>}
                </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </StripeProvider>
  );
}

function StripeFormRN({ price, processing, setProcessing, finalizeOrder }) {
  const { createPaymentMethod } = useStripe();
  const [cardComplete, setCardComplete] = useState(false);
  const handlePay = async () => {
    try {
      setProcessing(true);
      const res = await createPaymentMethod({ paymentMethodType: "Card" });
      if (res?.error) { Alert.alert("Erreur", res.error.message); setProcessing(false); return; }
      await finalizeOrder(res.paymentMethod?.id, "Stripe");
    } catch (e) { setProcessing(false); Alert.alert("Erreur", "Paiement Stripe échoué."); }
  };
  return (
    <View style={styles.stripeBox}>
      <CardField postalCodeEnabled={false} style={{ height: 50 }} onCardChange={(c) => setCardComplete(!!c?.complete)} />
      <TouchableOpacity onPress={handlePay} disabled={!cardComplete || processing} style={[styles.blueBtn, (!cardComplete || processing) && { opacity: 0.5 }]}>
        {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.blueBtnText}>Payer {price} MAD</Text>}
      </TouchableOpacity>
    </View>
  );
}

function PayPalBox({ price, processing, setProcessing, finalizeOrder }) {
  const paypalUrl = `https://www.sandbox.paypal.com/checkoutnow?amount=${encodeURIComponent(String(price))}`;
  return (
    <View style={{ height: 300, marginTop: 10, borderWidth: 1, borderColor: '#eee' }}>
        <WebView source={{ uri: paypalUrl }} onLoadStart={() => setProcessing(true)} onLoadEnd={() => setProcessing(false)} />
        <TouchableOpacity onPress={() => finalizeOrder(`PAYPAL-${Date.now()}`, "PayPal")} style={styles.blueBtn}>
            <Text style={styles.blueBtnText}>Confirmer simulé</Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f9fafb", padding: 16, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backText: { color: '#1e3a8a', fontWeight: 'bold' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#1e3a8a' },
  
  card: { backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", elevation: 3 },
  left: { backgroundColor: "#eff6ff", padding: 18 },
  right: { padding: 18 },
  title: { fontSize: 22, fontWeight: "800", color: "#1e3a8a", marginBottom: 14 },
  summary: { gap: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#bfdbfe" },
  label: { color: "#1e3a8a", opacity: 0.8 },
  value: { color: "#1e3a8a", fontWeight: "800" },
  totalRow: { borderBottomWidth: 0, paddingTop: 10 },
  totalLabel: { fontSize: 18, fontWeight: "800", color: "#1e3a8a" },
  totalValue: { fontSize: 18, fontWeight: "900", color: "#1e3a8a" },
  secureBox: { marginTop: 14, backgroundColor: "rgba(255,255,255,0.55)", borderRadius: 14, padding: 12, flexDirection: "row", gap: 10, alignItems: "center" },
  secureText: { color: "#1f2937", fontSize: 12, flex: 1 },
  rightTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 12 },
  tabs: { flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 10, padding: 4, gap: 6, marginBottom: 15 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: "#fff", elevation: 1 },
  tabText: { fontSize: 11, fontWeight: "800", color: "#6b7280" },
  tabTextActive: { color: "#2563eb" },
  stripeBox: { gap: 10 },
  blueBtn: { width: "100%", backgroundColor: "#2563eb", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  blueBtnText: { color: "#fff", fontWeight: "900" },
  greenBtn: { width: "100%", backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 10 },
  greenBtnText: { color: "#fff", fontWeight: "900" },
});