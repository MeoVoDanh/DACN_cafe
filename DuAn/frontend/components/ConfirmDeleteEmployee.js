// ConfirmDeleteEmployee.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function ConfirmDeleteEmployee({ emp, onConfirm }) {
  return (
    <View style={styles.container}>
      <Text style={styles.question}>
        Bạn có chắc muốn xoá nhân viên {emp.tenDangNhap} không?
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
          <Text style={styles.btnText}>Có</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  question: { fontSize: 18, marginBottom: 20 },
  actions: { flexDirection: "row" },
  confirmBtn: { backgroundColor: "red", padding: 10, borderRadius: 5 },
  btnText: { color: "#fff", fontWeight: "bold" },
});
