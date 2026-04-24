// EmployeeList.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function EmployeeList({ employees, navigation, onCreate }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.createBtn} onPress={onCreate}>
        <Text style={styles.createText}>+ Tạo tài khoản</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Danh sách nhân viên</Text>

      {employees.map((emp, index) => (
        <View key={index} style={styles.card}>
          <Text
            style={styles.name}
            onPress={() =>
              navigation.navigate("Chi Tiet Nhan Vien", { id: emp.MaNhanVien })
            }
          >
            {emp.tenDangNhap}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() =>
                navigation.navigate("Chinh Sua Thong Tin Nhan Vien", {
                  id: emp.MaNhanVien,
                })
              }
            >
              <Text style={styles.btnText}>Sửa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() =>
                navigation.navigate("Xac Nhan Xoa Nhan Vien", { emp })
              }
            >
              <Text style={styles.btnText}>Xóa</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  createBtn: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  createText: { color: "#fff", fontWeight: "bold" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    marginVertical: 5,
  },
  name: { fontSize: 16, flex: 1 },
  actions: { flexDirection: "row" },
  editBtn: {
    backgroundColor: "#007bff",
    padding: 8,
    borderRadius: 5,
    marginRight: 10,
  },
  deleteBtn: { backgroundColor: "#007bff", padding: 8, borderRadius: 5 },
  btnText: { color: "#fff", fontWeight: "bold" },
});
