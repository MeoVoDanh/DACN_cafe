import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

export default function EmployeeScreen({ onBack, accounts, setAccounts }) {
  // Điều khiển đóng mở form Tạo tài khoản mới
  const [isAddingMode, setIsAddingMode] = useState(false);
  // Lưu tài khoản đang được chọn để bấm xem chi tiết hồ sơ
  const [selectedEmpId, setSelectedEmpId] = useState("1");

  // --- Các State phục vụ form tạo tài khoản nhân viên mới ---
  const [newName, setNewName] = useState("");
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newCccd, setNewCccd] = useState("");
  const [newPhone, setNewPhone] = useState(""); // Định nghĩa là setNewPhone chuẩn chỉnh
  const [newRole, setNewRole] = useState("Phục vụ");

  // Danh sách vị trí của quán để chọn nhanh
  const rolesList = ["Quản lý", "Pha chế", "Phục vụ", "Thu ngân", "Tạp vụ"];

  // Xử lý tạo tài khoản nhân viên mới
  const handleCreateAccount = () => {
    if (
      !newName.trim() ||
      !newUser.trim() ||
      !newPass ||
      !newCccd.trim() ||
      !newPhone.trim()
    ) {
      return alert(
        "Vui lòng điền đầy đủ thông tin hồ sơ để tạo tài khoản ní ơi!",
      );
    }

    const isExist = accounts.some(
      (acc) => acc.user.toLowerCase() === newUser.trim().toLowerCase(),
    );
    if (isExist) return alert("Tên đăng nhập này đã tồn tại trên hệ thống!");

    const newEmp = {
      id: Date.now().toString(),
      name: newName.trim(),
      user: newUser.trim(),
      pass: newPass,
      role: newRole,
      cccd: newCccd.trim(),
      phone: newPhone.trim(),
    };

    setAccounts([...accounts, newEmp]);
    alert(`Đã cấp tài khoản thành công cho nhân viên: ${newName}`);

    // Reset và đóng form quay về màn hình xem
    setIsAddingMode(false);
    setNewName("");
    setNewUser("");
    setNewPass("");
    setNewCccd("");
    setNewPhone("");
    setNewRole("Phục vụ");
    setSelectedEmpId(newEmp.id);
  };

  const activeEmp =
    accounts.find((acc) => acc.id === selectedEmpId) || accounts[0];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header chính */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
        </TouchableOpacity>
        <Text style={styles.title}>QUẢN LÝ TÀI KHOẢN NHÂN VIÊN</Text>
      </View>

      {/* KHUNG LAYOUT CHÍNH GRID CHIA TỶ LỆ CỐ ĐỊNH */}
      <View style={styles.mainLayout}>
        {/* ================= CỘT TRÁI: DANH SÁCH NHÂN VIÊN (Chiếm 4 phần) ================= */}
        <View style={styles.leftColumn}>
          <View style={styles.columnHeader}>
            <Text style={styles.columnTitle}>DANH SÁCH CỬA HÀNG</Text>
            <TouchableOpacity
              style={[
                styles.addStaffToggleBtn,
                isAddingMode && { backgroundColor: "#d32f2f" },
              ]}
              onPress={() => setIsAddingMode(!isAddingMode)}
            >
              <FontAwesome5
                name={isAddingMode ? "times" : "user-plus"}
                size={11}
                color="#fff"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.addStaffToggleText}>
                {isAddingMode ? "Hủy bỏ" : "Thêm mới"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.listScrollView}
            showsVerticalScrollIndicator={false}
          >
            {accounts.map((emp) => (
              <TouchableOpacity
                key={emp.id}
                style={[
                  styles.empItemCard,
                  selectedEmpId === emp.id &&
                    !isAddingMode &&
                    styles.empItemActive,
                ]}
                onPress={() => {
                  setSelectedEmpId(emp.id);
                  setIsAddingMode(false);
                }}
              >
                <View style={styles.avatarMini}>
                  <FontAwesome5 name="user" size={12} color="#4b3621" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listName}>{emp.name}</Text>
                  <Text style={styles.listRole}>
                    Vị trí: {emp.role} | @{emp.user}
                  </Text>
                </View>
                <FontAwesome5 name="chevron-right" size={10} color="#bbb" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ================= CỘT PHẢI: FORM HOẶC HỒ SƠ (Chiếm 6 phần) ================= */}
        <View style={styles.rightColumn}>
          {isAddingMode ? (
            // FORM ĐĂNG KÝ TÀI KHOẢN MỚI
            <ScrollView
              style={styles.formCard}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.formSectionTitle}>
                TẠO TÀI KHOẢN NHÂN VIÊN MỚI
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Họ và tên nhân viên</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Nhập tên thật..."
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Tên đăng nhập hệ thống (Username)
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Tên viết liền không dấu..."
                  autoCapitalize="none"
                  value={newUser}
                  onChangeText={setNewUser}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Mật khẩu khởi tạo</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Mật khẩu đăng nhập..."
                  secureTextEntry
                  value={newPass}
                  onChangeText={setNewPass}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Số CCCD (12 số)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Nhập mã định danh..."
                  keyboardType="numeric"
                  value={newCccd}
                  onChangeText={setNewCccd}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Số điện thoại liên lạc</Text>
                {/* ĐÃ VÁ LỖI: Đổi thành setNewPhone ở dòng onChangeText dưới đây */}
                <TextInput
                  style={styles.formInput}
                  placeholder="Số di động..."
                  keyboardType="phone-pad"
                  value={newPhone}
                  onChangeText={setNewPhone}
                />
              </View>

              {/* Thanh chọn vị trí công tác */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Chọn vị trí công tác:{" "}
                  <Text style={{ color: "#8b4513" }}>{newRole}</Text>
                </Text>
                <View style={styles.chipsRow}>
                  {rolesList.map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.roleSelectChip,
                        newRole === r && styles.roleSelectChipActive,
                      ]}
                      onPress={() => setNewRole(r)}
                    >
                      <Text
                        style={[
                          styles.roleSelectText,
                          newRole === r && { color: "#fff" },
                        ]}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitCreateBtn}
                onPress={handleCreateAccount}
                activeOpacity={0.8}
              >
                <FontAwesome5
                  name="check"
                  size={12}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.submitCreateText}>
                  Cấp tài khoản & Lưu hồ sơ
                </Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            // HỒ SƠ CHI TIẾT
            activeEmp && (
              <View style={styles.profileCard}>
                <Text style={styles.profileSectionTitle}>
                  HỒ SƠ TÀI KHOẢN CHI TIẾT
                </Text>
                <View style={styles.badgeRow}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{activeEmp.role}</Text>
                  </View>
                  <Text style={styles.idSubText}>Mã NV: #{activeEmp.id}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Họ và tên:</Text>
                  <Text style={styles.infoValue}>{activeEmp.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tên tài khoản:</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      { fontWeight: "bold", color: "#8b4513" },
                    ]}
                  >
                    @{activeEmp.user}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Mật khẩu:</Text>
                  <Text style={styles.infoValue}>{activeEmp.pass}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Số CCCD:</Text>
                  <Text style={styles.infoValue}>{activeEmp.cccd}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Điện thoại:</Text>
                  <Text style={styles.infoValue}>{activeEmp.phone}</Text>
                </View>

                <View style={styles.footerNoteBox}>
                  <FontAwesome5
                    name="info-circle"
                    size={12}
                    color="#8d6e63"
                    style={{ marginRight: 8, marginTop: 2 }}
                  />
                  <Text style={styles.noteText}>
                    Tài khoản này dùng để đăng nhập hệ thống, xếp lịch trực ca
                    nhật trình và chấm công nội bộ cho quán.
                  </Text>
                </View>
              </View>
            )
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff8f0", padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  backBtn: { padding: 5 },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4b3621",
    marginLeft: 15,
    letterSpacing: 0.5,
  },

  mainLayout: { flex: 1, flexDirection: "row", marginTop: 10, minHeight: 600 },

  leftColumn: {
    flex: 4,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1e6da",
    padding: 15,
    marginRight: 15,
    display: "flex",
  },
  columnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f5ece3",
    paddingBottom: 10,
  },
  columnTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#8d6e63",
    letterSpacing: 0.5,
  },
  addStaffToggleBtn: {
    flexDirection: "row",
    backgroundColor: "#4b3621",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  addStaffToggleText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  listScrollView: { flex: 1 },
  empItemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#fff8f0",
    borderWidth: 1,
    borderColor: "#f5ece3",
  },
  empItemActive: { backgroundColor: "#f5ece3", borderColor: "#4b3621" },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e2d4c5",
  },
  listName: { fontSize: 13, fontWeight: "bold", color: "#4b3621" },
  listRole: { fontSize: 11, color: "#8d6e63", marginTop: 2 },

  rightColumn: { flex: 6, display: "flex" },

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f1e6da",
    elevation: 2,
  },
  profileSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4b3621",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f5ece3",
    paddingBottom: 8,
  },
  badgeRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  roleBadge: {
    backgroundColor: "#8b4513",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  roleBadgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  idSubText: { fontSize: 11, color: "#aaa", marginLeft: 10, fontWeight: "500" },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f9f4ee",
  },
  infoLabel: {
    width: "30%",
    fontSize: 13,
    fontWeight: "bold",
    color: "#8d6e63",
  },
  infoValue: { flex: 1, fontSize: 13, color: "#4b3621", fontWeight: "500" },
  footerNoteBox: {
    flexDirection: "row",
    backgroundColor: "#fff8f0",
    padding: 12,
    borderRadius: 10,
    marginTop: 25,
    borderWidth: 1,
    borderColor: "#f5ece3",
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: "#8d6e63",
    lineHeight: 18,
    fontStyle: "italic",
  },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f1e6da",
    flex: 1,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4b3621",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f5ece3",
    paddingBottom: 8,
    letterSpacing: 0.5,
  },
  formGroup: { marginBottom: 14 },
  formLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#8d6e63",
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#4b3621",
    backgroundColor: "#fff8f0",
    outlineStyle: "none",
  },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  roleSelectChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fff8f0",
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  roleSelectChipActive: { backgroundColor: "#4b3621", borderColor: "#4b3621" },
  roleSelectText: { fontSize: 12, color: "#4b3621", fontWeight: "bold" },
  submitCreateBtn: {
    flexDirection: "row",
    backgroundColor: "#4b3621",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  submitCreateText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});
