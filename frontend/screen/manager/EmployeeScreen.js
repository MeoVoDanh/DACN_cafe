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
  const [vaiTro, setVaiTro] = useState("NhanVien");
  const [TrangThai, setTrangThai] = useState("Đang làm việc");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode && employee) {
      setHoTen(employee.HoTen || "");
      setEmail(employee.Email || "");
      setSDT(employee.SDT || "");
      setSoCCCD(employee.SoCCCD || "");
      setTenDangNhap(employee.tenDangNhap || "");
      
      // Normalize role if not Admin or NhanVien
      let role = employee.vaiTro || "NhanVien";
      if (role !== "Admin" && role !== "NhanVien") {
        role = "NhanVien";
      }
      setVaiTro(role);
      
      setTrangThai(employee.TrangThai || "Đang làm việc");
    }
  }, [isEditMode, employee]);

  const handleSubmit = async () => {
    const newErrors = {};

    if (!HoTen.trim()) {
      newErrors.HoTen = "Họ tên không được để trống";
    }

    let emailTrimmed = Email.trim();
    if (!emailTrimmed) {
      newErrors.Email = "Email không được để trống";
    } else {
      // Tự động thêm đuôi mặc định @dacncafe.com nếu không nhập ký tự '@'
      if (!emailTrimmed.includes("@")) {
        emailTrimmed = emailTrimmed + "@dacncafe.com";
      }
      const emailRegex = /^[^\s@]+@dacncafe\.com$/;
      if (!emailRegex.test(emailTrimmed)) {
        newErrors.Email = "Email không đúng định dạng (phải kết thúc bằng @dacncafe.com)";
      }
    }

    const sdtTrimmed = SDT.trim();
    if (!sdtTrimmed) {
      newErrors.SDT = "Số điện thoại không được để trống";
    } else {
      const phoneRegex = /^0[0-9]{9}$/;
      if (!phoneRegex.test(sdtTrimmed)) {
        newErrors.SDT = "Số điện thoại không đúng định dạng (phải có 10 chữ số và bắt đầu bằng số 0)";
      }
    }

    if (!isEditMode && !tenDangNhap.trim()) {
      newErrors.tenDangNhap = "Tên đăng nhập không được để trống";
    }

    if (!isEditMode && !MatKhau.trim()) {
      newErrors.MatKhau = "Mật khẩu không được để trống";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert("Thông báo", "Vui lòng kiểm tra lại các thông tin nhập lỗi");
      return;
    }

    setErrors({});

    const employeeData = {
      HoTen: HoTen.trim(),
      Email: emailTrimmed,
      SDT: sdtTrimmed,
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
            style={[styles.input, errors.HoTen && styles.inputError]}
            value={HoTen}
            onChangeText={(text) => {
              setHoTen(text);
              if (errors.HoTen) setErrors({ ...errors, HoTen: null });
            }}
            placeholder="Nhập họ tên nhân viên"
          />
          {errors.HoTen && <Text style={styles.errorText}>{errors.HoTen}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.Email && styles.inputError]}
            value={Email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.Email) setErrors({ ...errors, Email: null });
            }}
            placeholder="Nhập email"
            autoCapitalize="none"
          />
          {errors.Email && <Text style={styles.errorText}>{errors.Email}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={[styles.input, errors.SDT && styles.inputError]}
            value={SDT}
            onChangeText={(text) => {
              setSDT(text);
              if (errors.SDT) setErrors({ ...errors, SDT: null });
            }}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
          />
          {errors.SDT && <Text style={styles.errorText}>{errors.SDT}</Text>}
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
                style={[styles.input, errors.tenDangNhap && styles.inputError]}
                value={tenDangNhap}
                onChangeText={(text) => {
                  setTenDangNhap(text);
                  if (errors.tenDangNhap) setErrors({ ...errors, tenDangNhap: null });
                }}
                placeholder="Nhập tên đăng nhập"
                autoCapitalize="none"
              />
              {errors.tenDangNhap && <Text style={styles.errorText}>{errors.tenDangNhap}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mật khẩu</Text>
              <TextInput
                style={[styles.input, errors.MatKhau && styles.inputError]}
                value={MatKhau}
                onChangeText={(text) => {
                  setMatKhau(text);
                  if (errors.MatKhau) setErrors({ ...errors, MatKhau: null });
                }}
                placeholder="Nhập mật khẩu"
                secureTextEntry
              />
              {errors.MatKhau && <Text style={styles.errorText}>{errors.MatKhau}</Text>}
            </View>
          </>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Vai trò</Text>
          <View style={styles.roleGrid}>
            {(() => {
              const roles = [
                { value: "NhanVien", label: "Nhân viên" },
                { value: "Admin", label: "Quản lý" }
              ];
              return roles.map((roleObj) => {
                const isDisabled = employee?.vaiTro === "Admin";
                return (
                  <TouchableOpacity
                    key={roleObj.value}
                    style={[
                      styles.roleGridBtn,
                      vaiTro === roleObj.value && styles.roleGridBtnActive,
                      isDisabled && { opacity: 0.6 }
                    ]}
                    onPress={() => setVaiTro(roleObj.value)}
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.roleGridBtnText,
                        vaiTro === roleObj.value && styles.roleGridBtnTextActive,
                      ]}
                    >
                      {roleObj.label}
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
  inputError: {
    borderColor: "#d32f2f",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "bold",
  },
});
