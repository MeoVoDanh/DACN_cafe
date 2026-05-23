import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteEmployee,
  fetchEmployees,
  setSelectedEmployee,
  updateEmployee,
} from "../../redux/employeeSlice";
import { FontAwesome5 } from "@expo/vector-icons";

export default function EmployeeListScreen({ navigation }) {
  const dispatch = useDispatch();

  const { employees, isLoading, error } = useSelector(
    (state) => state.employee,
  );

  const [selectedEmp, setSelectedEmp] = useState(null);

  // States for right-hand editing pane
  const [HoTen, setHoTen] = useState("");
  const [Email, setEmail] = useState("");
  const [SDT, setSDT] = useState("");
  const [SoCCCD, setSoCCCD] = useState("");
  const [vaiTro, setVaiTro] = useState("NhanVien");
  const [TrangThai, setTrangThai] = useState("Đang làm việc");
  const [isSaving, setIsSaving] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  // Synchronize inputs when selected employee changes
  useEffect(() => {
    if (selectedEmp) {
      setHoTen(selectedEmp.HoTen || "");
      setEmail(selectedEmp.Email || "");
      setSDT(selectedEmp.SDT || "");
      setSoCCCD(selectedEmp.SoCCCD || "");
      setVaiTro(selectedEmp.vaiTro || "NhanVien");
      setTrangThai(selectedEmp.TrangThai || "Đang làm việc");
    } else {
      setHoTen("");
      setEmail("");
      setSDT("");
      setSoCCCD("");
      setVaiTro("NhanVien");
      setTrangThai("Đang làm việc");
    }
    setShowStatusDropdown(false);
  }, [selectedEmp]);

  useEffect(() => {
    if (error) {
      Alert.alert("Lỗi", error);
    }
  }, [error]);

  const handleAdd = () => {
    navigation.navigate("EmployeeScreen", {
      mode: "create",
    });
  };

  const handleSave = async () => {
    if (!selectedEmp) return;

    if (!HoTen.trim()) {
      Alert.alert("Thông báo", "Họ tên không được để trống");
      return;
    }

    setIsSaving(true);
    const employeeData = {
      HoTen: HoTen.trim(),
      Email: Email.trim(),
      SDT: SDT.trim(),
      SoCCCD: SoCCCD.trim(),
      TrangThai,
      vaiTro,
    };

    const resultAction = await dispatch(
      updateEmployee({
        maNhanVien: selectedEmp.MaNhanVien,
        employeeData,
      })
    );

    setIsSaving(false);

    if (updateEmployee.fulfilled.match(resultAction)) {
      Alert.alert("Thành công", "Cập nhật nhân viên thành công");
      
      // Update selected employee reference in state
      setSelectedEmp(prev => prev ? { ...prev, ...employeeData } : null);
      dispatch(fetchEmployees());
    } else {
      Alert.alert("Lỗi", resultAction.payload || "Thao tác thất bại");
    }
  };

  const handleDelete = (maNhanVien) => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa nhân viên này không?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          const resultAction = await dispatch(deleteEmployee(maNhanVien));

          if (deleteEmployee.fulfilled.match(resultAction)) {
            Alert.alert("Thành công", "Xóa nhân viên thành công");
            setSelectedEmp(null);
            dispatch(fetchEmployees());
          }
        },
      },
    ]);
  };

  const getRoleDisplayName = (role) => {
    if (role === "Admin") return "Quản lý (Admin)";
    if (role === "NhanVien") return "Nhân viên";
    return role;
  };

  const renderEmployeeRow = ({ item }) => {
    const isSelected = selectedEmp?.MaNhanVien === item.MaNhanVien;
    const statusBg = item.TrangThai === "Đang làm việc" ? "#E8F5E9" : "#FFEBEE";
    const statusColor = item.TrangThai === "Đang làm việc" ? "#2E7D32" : "#C62828";

    return (
      <TouchableOpacity
        style={[styles.rowCard, isSelected && styles.rowCardSelected]}
        onPress={() => setSelectedEmp(item)}
      >
        <View style={styles.rowAvatar}>
          <FontAwesome5 name="user" size={16} color="#fff" />
        </View>

        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{item.HoTen}</Text>
          <Text style={styles.rowRole}>Vai trò: {getRoleDisplayName(item.vaiTro)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {item.TrangThai || "Đang làm việc"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && employees.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b3621" />
        <Text style={styles.loadingText}>Đang tải danh sách nhân viên...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.splitLayout}>
        {/* Left Pane: Employee List */}
        <View style={styles.leftPane}>
          <View style={styles.leftHeaderBox}>
            <Text style={styles.title}>Danh sách nhân viên</Text>

            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <FontAwesome5
                name="plus"
                size={14}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.addBtnText}>Thêm nhân viên</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            style={styles.list}
            data={employees}
            keyExtractor={(item, index) =>
              String(item.MaNhanVien ?? item.maNhanVien ?? item.MaTaiKhoan ?? index)
            }
            renderItem={renderEmployeeRow}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={() => dispatch(fetchEmployees())}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Chưa có nhân viên nào</Text>
              </View>
            }
          />
        </View>

        {/* Right Pane: Full Info & Edit Form */}
        <View style={styles.rightPane}>
          {selectedEmp ? (
            <ScrollView
              style={styles.detailsForm}
              contentContainerStyle={styles.detailsFormContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.paneTitle}>Chi tiết & Chỉnh sửa</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Họ tên</Text>
                <TextInput
                  style={styles.input}
                  value={HoTen}
                  onChangeText={setHoTen}
                  placeholder="Nhập họ tên"
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
                      const isDisabled = selectedEmp?.vaiTro === "Admin";
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
                {selectedEmp?.vaiTro === "Admin" && (
                  <Text style={{ fontSize: 11, color: "#d32f2f", marginTop: 4 }}>
                    * Chỉ Ban IT mới có quyền cấp hoặc thu hồi quyền Admin.
                  </Text>
                )}
              </View>

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

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <FontAwesome5 name="save" size={14} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.placeholderContainer}>
              <FontAwesome5 name="user-edit" size={48} color="#eadfd3" style={{ marginBottom: 16 }} />
              <Text style={styles.placeholderText}>
                Chọn một nhân viên từ danh sách để xem chi tiết và chỉnh sửa
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f1e9",
    height: Platform.OS === "web" ? "100vh" : "100%",
    maxHeight: Platform.OS === "web" ? "100vh" : "100%",
    overflow: "hidden",
  },
  leftHeaderBox: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4b3621",
    marginBottom: 12,
  },
  addBtn: {
    flexDirection: "row",
    backgroundColor: "#4b3621",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  splitLayout: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f8f1e9",
  },
  leftPane: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: "#eadfd3",
  },
  rightPane: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  list: {
    flex: 1,
    backgroundColor: "#f8f1e9",
  },
  listContent: {
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  rowCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eadfd3",
    alignItems: "center",
  },
  rowCardSelected: {
    borderColor: "#4b3621",
    borderWidth: 2,
    backgroundColor: "#fdfbf9",
  },
  rowAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4b3621",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#4b3621",
  },
  rowRole: {
    fontSize: 12,
    color: "#6d4c41",
    marginTop: 2,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  detailsForm: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  detailsFormContent: {
    paddingBottom: 120,
  },
  paneTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4b3621",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eadfd3",
    paddingBottom: 8,
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
  selectionGroup: {
    flexDirection: "row",
    gap: 8,
  },
  selectionBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eadfd3",
    alignItems: "center",
    backgroundColor: "#fcfaf8",
  },
  selectionBtnActive: {
    backgroundColor: "#4b3621",
    borderColor: "#4b3621",
  },
  selectionBtnText: {
    fontSize: 13,
    color: "#6d4c41",
    fontWeight: "bold",
  },
  selectionBtnTextActive: {
    color: "#fff",
  },
  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleGridBtn: {
    width: "47%",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eadfd3",
    alignItems: "center",
    backgroundColor: "#fcfaf8",
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
  formActions: {
    marginTop: 24,
    marginBottom: 40,
    gap: 10,
  },
  saveBtn: {
    flexDirection: "row",
    backgroundColor: "#4b3621",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  deletePaneBtn: {
    flexDirection: "row",
    backgroundColor: "#D32F2F",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  deletePaneBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderText: {
    color: "#8d6e63",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f1e9",
  },
  loadingText: {
    marginTop: 12,
    color: "#4b3621",
  },
  emptyBox: {
    marginTop: 60,
    alignItems: "center",
  },
  emptyText: {
    color: "#8d6e63",
    fontSize: 16,
  },
});
