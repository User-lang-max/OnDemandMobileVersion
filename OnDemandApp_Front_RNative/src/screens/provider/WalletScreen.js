import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import axiosClient from "../../api/axiosClient";
import Toast from "react-native-toast-message";

import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Path, Polyline, Circle } from "react-native-svg";

import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  DollarSign,
  Calendar,
  Activity,
  PieChart,
  History,
  AlertCircle,
  ArrowDownLeft,
  CheckCircle,
  CreditCard,
  Download,
} from "lucide-react-native";


const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const formatDateFR = (dateString) => {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
};

const formatTimeFR = (dateString) => {
  try {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const WalletSkeleton = () => {
  return (
    <View style={styles.skelWrap}>
      <View style={[styles.skelLine, { width: 180, height: 28 }]} />
      <View style={{ height: 18 }} />
      <View style={styles.skelGrid}>
        <View style={styles.skelCard} />
        <View style={styles.skelCard} />
      </View>
      <View style={{ height: 18 }} />
      <View style={[styles.skelCard, { height: 260 }]} />
    </View>
  );
};

const ProgressBar = ({ value, max, label, variant }) => {
  const pct = clamp(max > 0 ? (value / max) * 100 : 0, 0, 100);

  const barColors =
    variant === "green"
      ? ["#34D399", "#10B981"] 
      : ["#FBBF24", "#F97316"]; 

  return (
    <View style={{ marginBottom: 14 }}>
      <View style={styles.pbRow}>
        <Text style={styles.pbLabel}>{label}</Text>
        <Text style={styles.pbValue}>
          {Number(value || 0)} MAD
        </Text>
      </View>

      <View style={styles.pbTrack}>
        <LinearGradient
          colors={barColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.pbFill, { width: `${pct}%` }]}
        />
      </View>

      <View style={styles.pbFoot}>
        <Text style={styles.pbFootTxt}>0 MAD</Text>
        <Text style={styles.pbFootTxt}>{max} MAD</Text>
      </View>
    </View>
  );
};

// -------------------- GoalCard --------------------
const GoalCard = ({ title, current, target, icon, gradient }) => {
  const pct = clamp(target > 0 ? Math.round((current / target) * 100) : 0, 0, 100);

  return (
    <View style={styles.goalCard}>
      <View style={styles.goalTop}>
        <View style={styles.goalLeft}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.goalIcon}
          >
            {icon}
          </LinearGradient>
          <Text style={styles.goalTitle}>{title}</Text>
        </View>

        <Text style={[styles.goalPct, pct >= 100 ? styles.goalPctGreen : styles.goalPctBlue]}>
          {pct}%
        </Text>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.goalAmount}>
          {Number(current || 0)}
          <Text style={styles.goalAmountUnit}> MAD</Text>
        </Text>
        <Text style={styles.goalTarget}>Objectif: {target} MAD</Text>
      </View>
    </View>
  );
};


const SimpleRevenueChart = ({ data }) => {
  const chartData = Array.isArray(data) && data.length > 0 ? data : [0, 0, 0, 0, 0, 0];
  const max = Math.max(...chartData, 100);


  const points = chartData
    .map((val, i) => {
      const x = (i / (chartData.length - 1)) * 100;
      const y = 100 - (val / max) * 100;
      return { x, y };
    });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  const areaPath =
    `M0,100 L ` +
    points.map((p) => `${p.x},${p.y}`).join(" L ") +
    ` L100,100 Z`;

  return (
    <View style={{ width: "100%" }}>
      <View style={{ height: 160 }}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <SvgGradient id="gradFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.30" />
              <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </SvgGradient>
          </Defs>

          <Path d={areaPath} fill="url(#gradFill)" />
          <Polyline points={polylinePoints} fill="none" stroke="#2563EB" strokeWidth="2.5" />
          {points.map((p, i) => (
            <Circle key={`pt-${i}`} cx={p.x} cy={p.y} r="2" fill="#fff" stroke="#2563EB" strokeWidth="1.5" />
          ))}
        </Svg>

        <View style={styles.chartLabels}>
          {["M-5", "M-4", "M-3", "M-2", "M-1", "Actuel"].map((t) => (
            <Text key={t} style={styles.chartLabelText}>{t}</Text>
          ))}
        </View>
      </View>
    </View>
  );
};

// -------------------- MAIN SCREEN --------------------
export default function WalletScreen() {
  const [data, setData] = useState({
    balance: 0,
    pending: 0,
    transactions: [],
    chartData: [],
    stats: {
      monthlyEarnings: 0,
      weeklyGrowth: 0,
      completedJobs: 0,
      averagePerJob: 0,
      bestMonth: 0,
      pendingWithdrawals: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); 
  const [refreshing, setRefreshing] = useState(false);

  const fetchWallet = async () => {
    try {
      const res = await axiosClient.get("/wallet");
      setData(res.data);
    } catch (error) {
      console.error(error);
      Toast.show({ type: "error", text1: "Erreur", text2: "Impossible de charger le portefeuille" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleWithdraw = async () => {
    const balance = Number(data?.balance || 0);
    if (balance < 100) {
      Toast.show({ type: "error", text1: "Retrait impossible", text2: "Le minimum est 100 MAD" });
      return;
    }

    try {
      await axiosClient.post("/wallet/withdraw", { amount: balance });
      Toast.show({ type: "success", text1: "OK", text2: "Demande de retrait envoyée" });
      fetchWallet();
    } catch (error) {
      Toast.show({ type: "error", text1: "Erreur", text2: "Erreur lors du retrait" });
    }
  };

  const goals = useMemo(
    () => [
      {
        title: "Objectif Mensuel",
        current: data?.stats?.monthlyEarnings || 0,
        target: 5000,
        icon: <TrendingUp size={18} color="#fff" />,
        gradient: ["#3B82F6", "#2563EB"], 
      },
      {
        title: "Objectif Global",
        current: data?.balance || 0,
        target: 15000,
        icon: <Calendar size={18} color="#fff" />,
        gradient: ["#14B8A6", "#0D9488"], 
      },
    ],
    [data]
  );

  if (loading) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 26 }}>
          <WalletSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 26, paddingBottom: 36 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchWallet();
            }}
          />
        }
      >
        
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconBox}>
                <Wallet size={22} color="#2563EB" />
              </View>
              <Text style={styles.h1}>Mon Portefeuille</Text>
            </View>
            <Text style={styles.hSub}>Gérez vos revenus et suivez vos transactions.</Text>
          </View>

          <View style={styles.headerBtns}>
            <Pressable
              style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.85 }]}
              onPress={() => Toast.show({ type: "info", text1: "Info", text2: "Exporter (UI) à brancher si tu veux" })}
            >
              <Download size={18} color="#374151" />
              <Text style={styles.btnGhostTxt}>Exporter</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.btnGradWrap, pressed && { opacity: 0.90 }]}
              onPress={handleWithdraw}
            >
              <LinearGradient
                colors={["#2563EB", "#0D9488"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGrad}
              >
                <CreditCard size={18} color="#fff" />
                <Text style={styles.btnGradTxt}>Retirer</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

     
        <View style={styles.filtersBox}>
          {[
            { key: "all", label: "Tout" },
            { key: "week", label: "Semaine" },
            { key: "month", label: "Mois" },
            { key: "year", label: "Année" },
          ].map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.filterBtn, active ? styles.filterBtnActive : null]}
              >
                <Text style={[styles.filterTxt, active ? styles.filterTxtActive : null]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>

 
        <View style={styles.gridMain}>
       
          <View style={styles.bigCardWrap}>
            <LinearGradient
              colors={["#2563EB", "#1D4ED8", "#1E40AF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bigCard}
            >
              {/* Glow bubbles */}
              <View style={styles.bubbleTop} />
              <View style={styles.bubbleBottom} />

              <View style={{ position: "relative", zIndex: 2 }}>
                <View style={styles.bigTopRow}>
                  <View style={styles.bigPill}>
                    <TrendingUp size={16} color="#fff" />
                    <Text style={styles.bigPillTxt}>Disponible immédiatement</Text>
                  </View>

                  <Pressable onPress={handleWithdraw} style={({ pressed }) => [styles.bigGhostBtn, pressed && { opacity: 0.9 }]}>
                    <Text style={styles.bigGhostTxt}>Retirer</Text>
                  </Pressable>
                </View>

                <View style={{ marginTop: 16, marginBottom: 18 }}>
                  <Text style={styles.bigLabel}>Solde total disponible</Text>

                  <Text style={styles.bigAmount}>
                    {Number(data?.balance || 0).toFixed(2)}{" "}
                    <Text style={styles.bigAmountUnit}>MAD</Text>
                  </Text>

                  <View style={styles.bigMetaRow}>
                    <View style={styles.bigMetaItem}>
                      <ArrowUpRight size={16} color="#86EFAC" />
                      <Text style={styles.bigMetaGreen}>+{Number(data?.stats?.weeklyGrowth || 0)}% ce mois</Text>
                    </View>
                    <Text style={styles.bigMetaMuted}>
                      {Number(data?.stats?.completedJobs || 0)} missions terminées
                    </Text>
                  </View>
                </View>

                <View>
                  <ProgressBar
                    value={Number(data?.stats?.monthlyEarnings || 0)}
                    max={5000}
                    label="Objectif mensuel"
                    variant="green"
                  />
                  <ProgressBar
                    value={Number(data?.pending || 0)}
                    max={2000}
                    label="En attente de validation (Missions en cours)"
                    variant="orange"
                  />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Stats card */}
          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <Activity size={20} color="#3B82F6" />
              <Text style={styles.statsTitle}>Statistiques</Text>
            </View>

            <View style={{ marginTop: 10, gap: 14 }}>
              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.statsLabel}>Revenus ce mois</Text>
                  <Text style={styles.statsValue}>{Number(data?.stats?.monthlyEarnings || 0)} MAD</Text>
                </View>
                <View style={styles.statsGreen}>
                  <TrendingUp size={16} color="#16A34A" />
                  <Text style={styles.statsGreenTxt}>+{Number(data?.stats?.weeklyGrowth || 0)}%</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.statsLabel}>Moyenne par mission</Text>
                  <Text style={styles.statsValue}>{Number(data?.stats?.averagePerJob || 0)} MAD</Text>
                </View>
                <DollarSign size={20} color="#2563EB" />
              </View>

              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.statsLabel}>Prochain paiement</Text>
                  <Text style={styles.statsValue}>5 du mois</Text>
                </View>
                <Calendar size={20} color="#7C3AED" />
              </View>

              <View style={styles.statsRow}>
                <View>
                  <Text style={styles.statsLabel}>Meilleur mois</Text>
                  <Text style={styles.statsValue}>{Number(data?.stats?.bestMonth || 0)} MAD</Text>
                </View>
                <TrendingUp size={20} color="#CA8A04" />
              </View>
            </View>

            <View style={styles.statsFooter}>
              <Text style={styles.statsFooterLeft}>Retraits en attente</Text>
              <Text style={styles.statsFooterRight}>{Number(data?.stats?.pendingWithdrawals || 0)} MAD</Text>
            </View>
          </View>
        </View>

   
        <View style={styles.gridSecond}>
          {/* Chart */}
          <View style={styles.whiteCard}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Évolution des revenus (6 derniers mois)</Text>
            </View>
            <View style={{ marginTop: 12 }}>
              <SimpleRevenueChart data={data?.chartData} />
            </View>
          </View>

          {/* Goals */}
          <View style={styles.whiteCard}>
            <View style={styles.sectionHeader}>
              <PieChart size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Mes Objectifs</Text>
            </View>

            <View style={{ marginTop: 12, gap: 12 }}>
              {goals.map((g, idx) => (
                <GoalCard
                  key={`goal-${idx}`}
                  title={g.title}
                  current={g.current}
                  target={g.target}
                  icon={g.icon}
                  gradient={g.gradient}
                />
              ))}
            </View>
          </View>
        </View>

        {/* TRANSACTIONS */}
        <View style={styles.whiteCard}>
          <View style={styles.txHeader}>
            <View style={styles.sectionHeader}>
              <History size={20} color="#3B82F6" />
              <View>
                <Text style={styles.sectionTitle}>Historique des transactions</Text>
                <Text style={styles.txSub}>Dernières opérations terminées</Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 10 }}>
            {!data?.transactions || data.transactions.length === 0 ? (
              <View style={styles.emptyBox}>
                <View style={styles.emptyIcon}>
                  <AlertCircle size={24} color="#D1D5DB" />
                </View>
                <Text style={styles.emptyTitle}>Aucune transaction terminée pour le moment.</Text>
                <Text style={styles.emptySub}>Validez des missions pour commencer à gagner.</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {data.transactions.map((t, idx) => {
                  const key = t?.id ? String(t.id) : `tx-${idx}`; 
                  const idShort = t?.id ? String(t.id).substring(0, 8) : "--";

                  return (
                    <View key={key} style={styles.txRow}>
                      <View style={styles.txLeft}>
                        <View style={styles.txIcon}>
                          <ArrowDownLeft size={18} color="#16A34A" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.txTitle}>{t?.description ?? "Transaction"}</Text>
                          <Text style={styles.txMeta}>ID: {idShort}</Text>
                        </View>
                      </View>

                      <View style={styles.txRight}>
                        <Text style={styles.txClient}>{t?.clientName ?? ""}</Text>

                        <View style={{ alignItems: "flex-end", marginTop: 4 }}>
                          <Text style={styles.txDate}>{formatDateFR(t?.date)}</Text>
                          <Text style={styles.txTime}>{formatTimeFR(t?.date)}</Text>
                        </View>

                        <View style={styles.txBadge}>
                          <CheckCircle size={12} color="#16A34A" />
                          <Text style={styles.txBadgeTxt}>Succès</Text>
                        </View>

                        <Text style={styles.txAmount}>+{Number(t?.amount || 0)} MAD</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Toast />
    </View>
  );
}


const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },

  // Skeleton
  skelWrap: { gap: 12 },
  skelLine: { backgroundColor: "#E5E7EB", borderRadius: 10 },
  skelGrid: { flexDirection: "row", gap: 12 },
  skelCard: { flex: 1, height: 160, backgroundColor: "#E5E7EB", borderRadius: 20 },

  // Header
  header: {
    marginBottom: 14,
    gap: 10,
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIconBox: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  h1: { fontSize: 28, fontWeight: "800", color: "#0F172A" },
  hSub: { marginTop: 6, color: "#6B7280", fontSize: 13 },

  headerBtns: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  btnGhost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
  },
  btnGhostTxt: { color: "#374151", fontWeight: "700" },

  btnGradWrap: { borderRadius: 12, overflow: "hidden" },
  btnGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  btnGradTxt: { color: "#fff", fontWeight: "800" },

  // Filters
  filtersBox: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 6,
    borderRadius: 14,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  filterBtnActive: { backgroundColor: "#DBEAFE" },
  filterTxt: { color: "#6B7280", fontWeight: "700" },
  filterTxtActive: { color: "#1D4ED8" },

  // Grid Main
  gridMain: { gap: 14 },
  bigCardWrap: { overflow: "hidden", borderRadius: 22 },
  bigCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#3B82F6",
    shadowColor: "#0B1F4D",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  bubbleTop: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    transform: [{ translateX: 20 }, { translateY: -20 }],
  },
  bubbleBottom: {
    position: "absolute",
    bottom: -20,
    left: -20,
    width: 130,
    height: 130,
    borderRadius: 999,
    backgroundColor: "rgba(96,165,250,0.22)",
  },

  bigTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bigPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  bigPillTxt: { color: "#fff", fontWeight: "800", fontSize: 12 },

  bigGhostBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  bigGhostTxt: { color: "#fff", fontWeight: "800", fontSize: 12 },

  bigLabel: { color: "#BFDBFE", fontSize: 12, fontWeight: "600" },
  bigAmount: { color: "#fff", fontSize: 44, fontWeight: "900", marginTop: 6 },
  bigAmountUnit: { color: "#BFDBFE", fontSize: 22, fontWeight: "500" },

  bigMetaRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" },
  bigMetaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  bigMetaGreen: { color: "#86EFAC", fontWeight: "900", fontSize: 12 },
  bigMetaMuted: { color: "#BFDBFE", fontSize: 12, fontWeight: "600" },

  // ProgressBar
  pbRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  pbLabel: { color: "#E5E7EB", fontSize: 12, fontWeight: "700" },
  pbValue: { color: "#fff", fontSize: 12, fontWeight: "900" },
  pbTrack: {
    width: "100%",
    height: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    overflow: "hidden",
  },
  pbFill: { height: "100%" },
  pbFoot: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  pbFootTxt: { color: "#BFDBFE", fontSize: 11, fontWeight: "700" },

  // Stats card
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "ios" ? 0.06 : 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  statsHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  statsTitle: { fontSize: 16, fontWeight: "900", color: "#1F2937" },
  statsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statsLabel: { color: "#6B7280", fontSize: 12, fontWeight: "600" },
  statsValue: { color: "#111827", fontSize: 18, fontWeight: "900", marginTop: 2 },
  statsGreen: { flexDirection: "row", alignItems: "center", gap: 6 },
  statsGreenTxt: { color: "#16A34A", fontWeight: "900" },

  statsFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statsFooterLeft: { color: "#6B7280", fontWeight: "700" },
  statsFooterRight: { color: "#111827", fontWeight: "900" },

  // Second grid
  gridSecond: { marginTop: 14, gap: 14 },

  whiteCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "ios" ? 0.05 : 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#1F2937" },

  // Chart labels
  chartLabels: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 2,
  },
  chartLabelText: { fontSize: 11, color: "#9CA3AF", fontWeight: "700" },

  // Goals
  goalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  goalTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  goalIcon: { padding: 8, borderRadius: 12 },
  goalTitle: { color: "#374151", fontWeight: "800" },
  goalPct: { fontWeight: "900" },
  goalPctBlue: { color: "#2563EB" },
  goalPctGreen: { color: "#16A34A" },
  goalAmount: { fontSize: 22, fontWeight: "900", color: "#1F2937" },
  goalAmountUnit: { fontSize: 12, color: "#6B7280", fontWeight: "600" },
  goalTarget: { marginTop: 2, fontSize: 11, color: "#6B7280", fontWeight: "600" },

  // Transactions
  txHeader: { paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  txSub: { color: "#6B7280", fontSize: 12, fontWeight: "600", marginTop: 2 },

  emptyBox: { alignItems: "center", paddingVertical: 22 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: { color: "#6B7280", fontWeight: "800" },
  emptySub: { color: "#9CA3AF", fontWeight: "600", marginTop: 6, fontSize: 12 },

  txRow: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  txLeft: { flexDirection: "row", gap: 10, flex: 1 },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  txTitle: { color: "#1F2937", fontWeight: "900" },
  txMeta: { color: "#6B7280", fontSize: 11, fontWeight: "600", marginTop: 2 },

  txRight: { alignItems: "flex-end", gap: 4, minWidth: 120 },
  txClient: { color: "#1F2937", fontWeight: "800" },
  txDate: { color: "#1F2937", fontWeight: "800", fontSize: 12 },
  txTime: { color: "#9CA3AF", fontWeight: "700", fontSize: 11 },

  txBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginTop: 4,
  },
  txBadgeTxt: { color: "#15803D", fontWeight: "900", fontSize: 11 },

  txAmount: { color: "#16A34A", fontWeight: "900", fontSize: 16, marginTop: 6 },
});
