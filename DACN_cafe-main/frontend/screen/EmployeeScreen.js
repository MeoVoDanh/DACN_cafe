import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  createEmployee,
  fetchEmployees,
  updateEmployee,
} from "../redux/employeeSlice";

export default function EmployeeScreen({ navigation, route }) {
  const dispatch = useDispatch();

  const { isLoading } = useSelector((state) => state.employee);

  const mode = route.params?.mode || "create";
  const employee = route.params?.employee || null;

  const isEditMode = mode === "edit";

  const [HoTen, setHoTen] = useState("");
  const [Email, setEmail] = useState("");
  const [SDT, setSDT] = useState("");
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [MatKhau, setMatKhau] = useState("");
  const [vaiTro, setVaiTro] = useState("NhanVien");

  useEffect(() => {
    if (isEditMode && employee) {
      setHoTen(employee.HoTen || "");
      setEmail(employee.Email || "");
      setSDT(employee.SDT || "");
      setTenDangNhap(employee.tenDangNhap || "");
      setVaiTro(employee.vaiTro || "NhanVien");
    }
  }, [isEditMode, employee]);

  const handleSubmit = async () => {
    if (!HoTen.trim()) {
      Alert.alert("Thông báo", "Họ tên không được để trống");
      return;
    }

    if (!isEditMode && !tenDangNhap.trim()) {
      Alert.alert("Thông báo", "Tên đăng nhập không được để trống");
      return;
    }

    if (!isEditMode && !MatKhau.trim()) {
      Alert.alert("Thông báo", "Mật khẩu không được để trống");
      return;
    }

    const employeeData = {
      HoTen: HoTen.trim(),
      Email: Email.trim(),
      SDT: SDT.trim(),
      vaiTro,
    };

    if (!isEditMode) {
      employeeData.tenDangNhap = tenDangNhap.trim();
      employeeData.MatKhau = MatKhau;
    }

    let resultAction;

    if (isEditMode) {
      resultAction = await dispatch(
        updateEmployee({
          maNhanVien: employee.MaNhanVien,
          employeeData,
        }),
      );
    } else {
      resultAction = await dispatch(createEmployee(employeeData));
    }

    if (
      createEmployee.fulfilled.match(resultAction) ||
      updateEmployee.fulfilled.match(resultAction)
    ) {
      Alert.alert(
        "Thành công",
        isEditMode
          ? "Cập nhật nhân viên thành công"
          : "Thêm nhân viên thành công",
      );

      await dispatch(fetchEmployees());
      navigation.goBack();
    } else {
      Alert.alert("Lỗi", resultAction.payload || "Thao tác thất bại");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {isEditMode ? "Cập nhật nhân viên" : "Thêm nhân viên"}
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Họ tên</Text>
        <TextInput
          style={styles.input}
          value={HoTen}
          onChangeText={setHoTen}
          placeholder="Nhập họ tên nhân viên"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={Email}
          onChangeText={setEmail}
          placeholder="Nhập email"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          value={SDT}
          onChangeText={setSDT}
          placeholder="Nhập số điện thoại"
          keyboardType="phone-pad"
        />
      </View>

      {!isEditMode && (
        <>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tên đăng nhập</Text>
            <TextInput
              style={styles.input}
              value={tenDangNhap}
              onChangeText={setTenDangNhap}
              placeholder="Nhập tên đăng nhập"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput
              style={styles.input}
              value={MatKhau}
              onChangeText={setMatKhau}
              placeholder="Nhập mật khẩu"
              secureTextEntry
            />
          </View>
        </>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Vai trò</Text>

        <View style={styles.roleBox}>
          <TouchableOpacity
            style={[
              styles.roleBtn,
              vaiTro === "NhanVien" && styles.roleBtnActive,
            ]}
            onPress={() => setVaiTro("NhanVien")}
          >
            <Text
              style={[
                styles.roleText,
                vaiTro === "NhanVien" && styles.roleTextActive,
              ]}
            >
              Nhân viên
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleBtn, vaiTro === "Admin" && styles.roleBtnActive]}
            onPress={() => setVaiTro("Admin")}
          >
            <Text
              style={[
                styles.roleText,
                vaiTro === "Admin" && styles.roleTextActive,
              ]}
            >
              Admin
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>
            {isEditMode ? "Lưu thay đổi" : "Thêm nhân viên"}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelText}>Quay lại</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f1e9",
    padding: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4b3621",
    marginBottom: 20,
  },

  formGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4b3621",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 12,
    padding: 12,
    color: "#4b3621",
  },

  roleBox: {
    flexDirection: "row",
    gap: 10,
  },

  roleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4b3621",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  roleBtnActive: {
    backgroundColor: "#4b3621",
  },

  roleText: {
    color: "#4b3621",
    fontWeight: "bold",
  },

  roleTextActive: {
    color: "#fff",
  },

  submitBtn: {
    backgroundColor: "#4b3621",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  submitText: {
    color: "#fff",
    fontWeight: "bold",
  },

  cancelBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },

  cancelText: {
    color: "#4b3621",
    fontWeight: "bold",
  },
});
