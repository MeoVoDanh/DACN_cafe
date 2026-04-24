// EmployeeDetail.js
import React from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";

export default function EmployeeDetail({ employee }) {
  if (!employee) return <Text>Đang tải...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thông tin chi tiết nhân viên</Text>

      <Text>Mã tài khoản</Text>
      <TextInput style={styles.input} value={employee.MaTaiKhoan} editable={false} />

      <Text>Tên đăng nhập (@nhanvien)</Text>
      <TextInput style={styles.input} value={employee.tenDangNhap} editable={false} />

      <Text>Mật khẩu</Text>
      <TextInput style={styles.input} value={employee.MatKhau} editable={false} />

      <Text>Vai trò</Text>
      <TextInput style={styles.input} value={employee.vaiTro} editable={false} />

      <Text>Mã nhân viên</Text>
      <TextInput style={styles.input} value={employee.MaNhanVien} editable={false} />

      <Text>Họ tên</Text>
      <TextInput style={styles.input} value={employee.HoTen} editable={false} />

      <Text>Email</Text>
      <TextInput style={styles.input} value={employee.Email} editable={false} />

      <Text>Số điện thoại</Text>
      <TextInput style={styles.input} value={employee.SDT} editable={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
});
