// NhanVienOptions.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function NhanVienOptions({ onLogout, profile, navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào {profile.tenDangNhap}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* Management Options */}
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => navigation.navigate("HoaDon")}
      >
        <Text style={styles.optionText}>Tạo hóa đơn</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => navigation.navigate("QuanLyCa")}
      >
        <Text style={styles.optionText}>Quản lý ca</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => navigation.navigate("ThongKeDon")}
      >
        <Text style={styles.optionText}>Số lượng đơn đã thực hiện</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => navigation.navigate("ThongTinCaNhan")}
      >
        <Text style={styles.optionText}>Xem thông tin cá nhân</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  greeting: { fontSize: 16, fontWeight: "bold" },
  logoutButton: { padding: 8, backgroundColor: "#f44336", borderRadius: 4 },
  logoutText: { color: "#fff", fontWeight: "bold" },
  optionButton: {
    padding: 16,
    backgroundColor: "#2196f3",
    borderRadius: 8,
    marginBottom: 12,
  },
  optionText: { color: "#fff", fontSize: 16, textAlign: "center" },
});
