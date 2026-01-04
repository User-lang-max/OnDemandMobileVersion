import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  Alert,
} from "react-native";
import axiosClient from "../../api/axiosClient";
import {
  Trash2,
  User,
  Search,
  Shield,
  X,
  Check,
  Mail,
} from "lucide-react-native";
import { Picker } from "@react-native-picker/picker";

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  
  const [formData, setFormData] = useState({ role: "", status: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axiosClient.get("/admin/users");
      setUsers(res.data);
    } catch (e) {
      console.error("USER LOAD ERROR", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      "Confirmation",
      "Supprimer cet utilisateur définitivement ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await axiosClient.delete(`/admin/users/${id}`);
              setUsers(users.filter((u) => u.id !== id));
              Alert.alert("Succès", "Utilisateur supprimé");
              setIsModalOpen(false);
            } catch (e) {
              Alert.alert("Erreur", "Erreur suppression");
            }
          },
        },
      ]
    );
  };

  const handleUpdateUser = async () => {

    Alert.alert("Succès", "Profil mis à jour !");
    setIsModalOpen(false);
  };

  const openModal = (user) => {
    setSelectedUser(user);
    setFormData({ role: user.role, status: user.status });
    setIsModalOpen(true);
  };

  const filtered = users.filter(
    (u) =>
      ((u.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterRole === "all" || u.role.toLowerCase() === filterRole)
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Utilisateurs</Text>
        <Text style={styles.headerSubtitle}>
          Gestion des comptes clients, prestataires et administrateurs.
        </Text>
      </View>

      <View style={styles.contentPadding}>
        <View style={styles.card}>
          {/* TOOLBAR */}
          <View style={styles.toolbar}>
            <View style={styles.searchContainer}>
              <Search size={18} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher (nom, email)..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {["all", "client", "provider", "admin"].map((role) => (
                <Pressable
                  key={role}
                  onPress={() => setFilterRole(role)}
                  style={[
                    styles.filterChip,
                    filterRole === role
                      ? styles.filterChipActive
                      : styles.filterChipInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filterRole === role
                        ? styles.filterTextActive
                        : styles.filterTextInactive,
                    ]}
                  >
                    {role === "all" ? "Tous" : role}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* TABLE LIST */}
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.colHeader, { flex: 2 }]}>Identité</Text>
              <Text style={[styles.colHeader, { width: 100 }]}>Rôle</Text>
              <Text style={[styles.colHeader, { width: 80 }]}>Statut</Text>
              <Text style={[styles.colHeader, { width: 80, textAlign: "right" }]}>
                Actions
              </Text>
            </View>

            {filtered.map((user) => (
              <View key={user.id} style={styles.tableRow}>
                {/* Identité */}
                <View style={{ flex: 2, flexDirection: "row", alignItems: "center" }}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user.fullName?.[0]}</Text>
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    
                  </View>
                </View>

                {/* Rôle */}
                <View style={{ width: 100 }}>
                  <View
                    style={[
                      styles.roleBadge,
                      user.role === "admin"
                        ? styles.roleAdmin
                        : user.role === "provider"
                        ? styles.roleProvider
                        : styles.roleClient,
                    ]}
                  >
                    {user.role === "admin" && <Shield size={10} color="#b91c1c" />}
                    {user.role === "provider" && <User size={10} color="#7e22ce" />}
                    <Text
                      style={[
                        styles.roleText,
                        user.role === "admin"
                          ? { color: "#b91c1c" }
                          : user.role === "provider"
                          ? { color: "#7e22ce" }
                          : { color: "#1d4ed8" },
                      ]}
                    >
                      {user.role}
                    </Text>
                  </View>
                </View>

                {/* Statut */}
                <View style={{ width: 80 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            user.status === "active" ? "#22c55e" : "#f97316",
                        },
                      ]}
                    />
                    <Text style={styles.statusText}>{user.status}</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={{ width: 80, alignItems: "flex-end" }}>
                  <Pressable
                    onPress={() => openModal(user)}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionButtonText}>Gérer</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* MODAL */}
      <Modal
        visible={isModalOpen && !!selectedUser}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>
                    {selectedUser?.fullName?.[0]}
                  </Text>
                </View>
                <View>
                  <Text style={styles.modalName}>{selectedUser?.fullName}</Text>
                  <Text style={styles.modalId}>
                    ID: {selectedUser?.id?.substring(0, 8)}...
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setIsModalOpen(false)}
                style={{ padding: 4 }}
              >
                <X size={24} color="#fff" />
              </Pressable>
            </View>

            {/* Body Modal */}
            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.emailBox}>
                  <Mail size={16} color="#9ca3af" />
                  <Text style={styles.emailText}>{selectedUser?.email}</Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Rôle</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.role}
                    onValueChange={(val) => setFormData({ ...formData, role: val })}
                  >
                    <Picker.Item label="Client" value="client" />
                    <Picker.Item label="Prestataire" value="provider" />
                    <Picker.Item label="Administrateur" value="admin" />
                  </Picker>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Statut</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.status}
                    onValueChange={(val) =>
                      setFormData({ ...formData, status: val })
                    }
                  >
                    <Picker.Item label="Actif" value="active" />
                    <Picker.Item label="Suspendu" value="suspended" />
                    <Picker.Item label="En attente" value="pending" />
                  </Picker>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <Pressable
                  onPress={() => handleDelete(selectedUser.id)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={16} color="#dc2626" />
                  <Text style={styles.deleteButtonText}>Supprimer</Text>
                </Pressable>

                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    onPress={() => setIsModalOpen(false)}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleUpdateUser}
                    style={styles.saveModalButton}
                  >
                    <Check size={16} color="#fff" />
                    <Text style={styles.saveModalButtonText}>Enregistrer</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 24,
    paddingVertical: 32,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#111827",
  },
  headerSubtitle: {
    color: "#6b7280",
    marginTop: 4,
  },
  contentPadding: {
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    overflow: "hidden",
  },
  toolbar: {
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
    backgroundColor: "#f9fafb",
    gap: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },
  filterScroll: {
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: "#0d9488",
    borderColor: "#0f766e",
  },
  filterChipInactive: {
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  filterTextActive: {
    color: "#ffffff",
  },
  filterTextInactive: {
    color: "#6b7280",
  },
  tableHeader: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  colHeader: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#f9fafb",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4b5563",
  },
  userName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
  },
  userEmail: {
    fontSize: 12,
    color: "#6b7280",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
    gap: 4,
  },
  roleAdmin: {
    backgroundColor: "#fef2f2",
    borderColor: "#fee2e2",
  },
  roleProvider: {
    backgroundColor: "#faf5ff",
    borderColor: "#f3e8ff",
  },
  roleClient: {
    backgroundColor: "#eff6ff",
    borderColor: "#dbeafe",
  },
  roleText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    textTransform: "capitalize",
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f0fdfa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccfbf1",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f766e",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    width: "100%",
    maxWidth: 500,
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    backgroundColor: "#0d9488",
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  modalAvatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0d9488",
  },
  modalName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  modalId: {
    fontSize: 12,
    color: "#ccfbf1",
    marginTop: 2,
  },
  modalBody: {
    padding: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  emailBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  emailText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    justifyContent: "center",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderColor: "#f3f4f6",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#fee2e2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: "#dc2626",
    fontWeight: "bold",
    fontSize: 14,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  cancelButtonText: {
    color: "#4b5563",
    fontWeight: "bold",
    fontSize: 14,
  },
  saveModalButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d9488",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  saveModalButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
});