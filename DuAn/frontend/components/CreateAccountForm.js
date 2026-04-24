// CreateAccountForm.js
import React from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

export default function CreateAccountForm({
  tenDangNhap,
  setTenDangNhap,
  matKhau,
  setMatKhau,
  hoTen,
  setHoTen,
  email,
  setEmail,
  sdt,
  setSdt,
  message,
  onSubmit,
  onReset,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tạo tài khoản nhân viên</Text>

      <TextInput
        style={styles.input}
        placeholder="Tên đăng nhập (@nhanvien)"
        value={tenDangNhap}
        onChangeText={setTenDangNhap}
      />

      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        secureTextEntry
        value={matKhau}
        onChangeText={setMatKhau}
      />

      <TextInput
        style={styles.input}
        placeholder="Họ tên"
        value={hoTen}
        onChangeText={setHoTen}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Số điện thoại"
        keyboardType="numeric"
        value={sdt}
        onChangeText={setSdt}
      />

      <View style={styles.button}>
        <Button title="Tạo tài khoản" onPress={onSubmit} />
      </View>

      <View style={styles.button}>
        <Button title="Làm mới" color="gray" onPress={onReset} />
      </View>

      {message !== "" && (
        <Text style={{ marginTop: 15, color: "red", textAlign: "center" }}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#f5f5f5" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  input: {
    borderWidth: 1, borderColor: "#ccc", borderRadius: 5,
    padding: 10, marginBottom: 15, backgroundColor: "#fff"
  },
  button: { marginTop: 10 }
});
