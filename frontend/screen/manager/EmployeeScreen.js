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
  SafeAreaView,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  createEmployee,
  fetchEmployees,
  updateEmployee,
} from "../../redux/employeeSlice";

export default function EmployeeScreen({ navigation, route }) {
  const dispatch = useDispatch();

  const { isLoading } = useSelector((state) => state.employee);

  const mode = route.params?.mode || "create";
  const employee = route.params?.employee || null;

  const isEditMode = mode === "edit";

  const [HoTen, setHoTen] = useState("");
  const [Email, setEmail] = useState("");
  const [SDT, setSDT] = useState("");
  const [SoCCCD, setSoCCCD] = useState("");
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [MatKhau, setMatKhau] = useState("");
  const [vaiTro, setVaiTro] = useState("Pha chế");
  const [TrangThai, setTrangThai] = useState("Đang làm việc");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  useEffect(() => {
    if (isEditMode && employee) {
      setHoTen(employee.HoTen || "");
      setEmail(employee.Email || "");
      setSDT(employee.SDT || "");
      setSoCCCD(employee.SoCCCD || "");
      setTenDangNhap(employee.tenDangNhap || "");
      setVaiTro(employee.vaiTro || "NhanVien");
      setTrangThai(employee.TrangThai || "Đang làm việc");
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
      SoCCCD: SoCCCD.trim(),
      TrangThai,
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditMode ? "Cập nhật nhân viên" : "Thêm nhân viên"}
          </Text>
        </View>

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

        <View style={styles.formGroup}>
          <Text style={styles.label}>Số CCCD</Text>
          <TextInput
            style={styles.input}
            value={SoCCCD}
            onChangeText={setSoCCCD}
            placeholder="Nhập số CCCD"
            keyboardType="numeric"
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
          <View style={styles.roleGrid}>
            {(() => {
              const roles = ["Pha chế", "Thu ngân", "Phục vụ", "Tạp vụ"];
              if (vaiTro === "Admin") {
                roles.unshift("Admin");
              } else if (vaiTro === "NhanVien") {
                roles.unshift("NhanVien");
              }
              return roles.map((role) => {
                const isDisabled = employee?.vaiTro === "Admin";
                return (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleGridBtn,
                      vaiTro === role && styles.roleGridBtnActive,
                      isDisabled && { opacity: 0.6 }
                    ]}
                    onPress={() => setVaiTro(role)}
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.roleGridBtnText,
                        vaiTro === role && styles.roleGridBtnTextActive,
                      ]}
                    >
                      {role === "NhanVien" ? "Nhân viên" : role}
                    </Text>
                  </TouchableOpacity>
                );
              });
            })()}
          </View>
          {employee?.vaiTro === "Admin" && (
            <Text style={{ fontSize: 11, color: "#d32f2f", marginTop: 4 }}>
              * Chỉ Ban IT mới có quyền cấp hoặc thu hồi quyền Admin.
            </Text>
          )}
        </View>

        {isEditMode && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Trạng thái</Text>
            
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              <Text style={styles.dropdownHeaderText}>{TrangThai}</Text>
              <FontAwesome5
                name={showStatusDropdown ? "chevron-up" : "chevron-down"}
                size={12}
                color="#4b3621"
              />
            </TouchableOpacity>

            {showStatusDropdown && (
              <View style={styles.dropdownList}>
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    TrangThai === "Đang làm việc" && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setTrangThai("Đang làm việc");
                    setShowStatusDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      TrangThai === "Đang làm việc" && styles.dropdownItemTextActive,
                    ]}
                  >
                    Đang làm việc
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    TrangThai === "Đã nghỉ việc" && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setTrangThai("Đã nghỉ việc");
                    setShowStatusDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      TrangThai === "Đã nghỉ việc" && styles.dropdownItemTextActive,
                    ]}
                  >
                    Đã nghỉ việc
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

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


      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f1e9",
    height: Platform.OS === "web" ? "100vh" : "100%",
    maxHeight: Platform.OS === "web" ? "100vh" : "100%",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f1e9",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4b3621",
  },

  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleGridBtn: {
    width: "47%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eadfd3",
    alignItems: "center",
    backgroundColor: "#fff",
    marginBottom: 4,
  },
  roleGridBtnActive: {
    backgroundColor: "#4b3621",
    borderColor: "#4b3621",
  },
  roleGridBtnText: {
    fontSize: 13,
    color: "#6d4c41",
    fontWeight: "bold",
  },
  roleGridBtnTextActive: {
    color: "#fff",
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

  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 12,
    padding: 12,
  },
  dropdownHeaderText: {
    color: "#4b3621",
    fontSize: 14,
    fontWeight: "500",
  },
  dropdownList: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 12,
    marginTop: 4,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    padding: 12,
    backgroundColor: "#fff",
  },
  dropdownItemActive: {
    backgroundColor: "#f5eee6",
  },
  dropdownItemText: {
    color: "#6d4c41",
    fontSize: 13,
  },
  dropdownItemTextActive: {
    color: "#4b3621",
    fontWeight: "bold",
  },

  deleteBtn: {
    backgroundColor: "#D32F2F",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
