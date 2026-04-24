// EditEmployeeForm.js
import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

export default function EditEmployeeForm({ form, setForm, onSave }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chỉnh sửa nhân viên</Text>

      <TextInput
        style={styles.input}
        placeholder="Tên đăng nhập"
        value={form.tenDangNhap}
        onChangeText={(text) => setForm({ ...form, tenDangNhap: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        value={form.MatKhau}
        onChangeText={(text) => setForm({ ...form, MatKhau: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Họ tên"
        value={form.HoTen}
        onChangeText={(text) => setForm({ ...form, HoTen: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={form.Email}
        onChangeText={(text) => setForm({ ...form, Email: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Số điện thoại"
        value={form.SDT}
        onChangeText={(text) => setForm({ ...form, SDT: text })}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
        <Text style={styles.saveText}>Lưu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "bold" },
});
