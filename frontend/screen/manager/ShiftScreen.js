import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { fetchShiftsByDate, saveShiftsByDate } from "../../redux/shiftSlice";
import { fetchEmployees } from "../../redux/employeeSlice";

export default function ShiftScreen({ navigation }) {
  const dispatch = useDispatch();

  const { shifts, isLoading, error } = useSelector((state) => state.shift);
  const { employees } = useSelector((state) => state.employee);

  // States
  const [ngayLam, setNgayLam] = useState("");
  const [sangEmployees, setSangEmployees] = useState([]);
  const [chieuEmployees, setChieuEmployees] = useState([]);
  const [toiEmployees, setToiEmployees] = useState([]);

  // Modal employee picker states
  const [employeePickerVisible, setEmployeePickerVisible] = useState(false);
  const [activeShiftTarget, setActiveShiftTarget] = useState(""); // "Ca Sáng", "Ca Chiều", "Ca Tối"
  const [searchQuery, setSearchQuery] = useState("");

  // Get active employees list from store (excluding Admins as shifts are only for staff)
  const activeEmployees = employees.filter(
    (emp) => emp.TrangThai === "Đang làm việc" && emp.vaiTro !== "Admin" && emp.vaiTro !== "admin"
  );

  // Initial load
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setNgayLam(todayStr);
    dispatch(fetchShiftsByDate(todayStr));
    dispatch(fetchEmployees());
  }, [dispatch]);

  // Sync loaded shifts into local state columns
  useEffect(() => {
    const sang = [];
    const chieu = [];
    const toi = [];
    if (shifts && Array.isArray(shifts)) {
      shifts.forEach((item) => {
        if (item.MaNhanVien) {
          const empObj = {
            MaNhanVien: item.MaNhanVien,
            HoTen: item.HoTen,
            vaiTro: item.vaiTro,
          };
          if (item.tenCa === "Ca Sáng") sang.push(empObj);
          if (item.tenCa === "Ca Chiều") chieu.push(empObj);
          if (item.tenCa === "Ca Tối") toi.push(empObj);
        }
      });
    }
    setSangEmployees(sang);
    setChieuEmployees(chieu);
    setToiEmployees(toi);
  }, [shifts]);

  const handleSwitchDate = () => {
    if (!ngayLam.trim()) {
      Alert.alert("Thông báo", "Vui lòng chọn hoặc nhập ngày hợp lệ (YYYY-MM-DD)");
      return;
    }
    dispatch(fetchShiftsByDate(ngayLam.trim()));
  };

  const handleOpenPicker = (shiftName) => {
    setActiveShiftTarget(shiftName);
    setSearchQuery("");
    setEmployeePickerVisible(true);
  };

  const getAssignedListForTargetShift = () => {
    if (activeShiftTarget === "Ca Sáng") return sangEmployees;
    if (activeShiftTarget === "Ca Chiều") return chieuEmployees;
    if (activeShiftTarget === "Ca Tối") return toiEmployees;
    return [];
  };

  const handleAddEmployee = (emp) => {
    if (activeShiftTarget === "Ca Sáng") {
      setSangEmployees([...sangEmployees, emp]);
    } else if (activeShiftTarget === "Ca Chiều") {
      setChieuEmployees([...chieuEmployees, emp]);
    } else if (activeShiftTarget === "Ca Tối") {
      setToiEmployees([...toiEmployees, emp]);
    }
    setEmployeePickerVisible(false);
  };

  const handleRemoveEmployee = (shiftName, empId) => {
    if (shiftName === "Ca Sáng") {
      setSangEmployees(sangEmployees.filter((e) => e.MaNhanVien !== empId));
    } else if (shiftName === "Ca Chiều") {
      setChieuEmployees(chieuEmployees.filter((e) => e.MaNhanVien !== empId));
    } else if (shiftName === "Ca Tối") {
      setToiEmployees(toiEmployees.filter((e) => e.MaNhanVien !== empId));
    }
  };

  const handleSaveAll = async () => {
    if (!ngayLam.trim()) {
      Alert.alert("Thông báo", "Vui lòng chọn ngày hợp lệ trước khi lưu");
      return;
    }

    const shiftsData = [
      {
        tenCa: "Ca Sáng",
        employeeIds: sangEmployees.map((e) => e.MaNhanVien),
      },
      {
        tenCa: "Ca Chiều",
        employeeIds: chieuEmployees.map((e) => e.MaNhanVien),
      },
      {
        tenCa: "Ca Tối",
        employeeIds: toiEmployees.map((e) => e.MaNhanVien),
      },
    ];

    const result = await dispatch(saveShiftsByDate({ dateString: ngayLam.trim(), shiftsData }));

    if (saveShiftsByDate.fulfilled.match(result)) {
      Alert.alert("Thành công", "Lưu phân ca làm việc thành công!");
      dispatch(fetchShiftsByDate(ngayLam.trim()));
    } else {
      Alert.alert("Lỗi", result.payload || "Lưu ca làm việc thất bại");
    }
  };

  const getRoleDisplayName = (role) => {
    if (role === "Admin") return "Quản lý (Admin)";
    if (role === "NhanVien") return "Nhân viên";
    return role || "Nhân viên";
  };

  // Filter employees for current target shift picker modal
  const assignedInCurrentTarget = getAssignedListForTargetShift();
  const availableEmployees = activeEmployees.filter((emp) => {
    const isAssigned = assignedInCurrentTarget.some((e) => e.MaNhanVien === emp.MaNhanVien);
    if (isAssigned) return false;
    if (!searchQuery.trim()) return true;
    return emp.HoTen.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const isWeb = Platform.OS === "web";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.navigate("DashboardScreen")}
            style={styles.backBtn}
          >
            <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
          </TouchableOpacity>

          <View style={styles.headerTextBox}>
            <Text style={styles.title}>QUẢN LÝ CA LÀM</Text>
            <Text style={styles.subtitle}>Chọn ngày, sắp xếp phân ca và xác nhận lưu</Text>
          </View>
        </View>

        {/* Date Selector Row */}
        <View style={styles.dateSelectorRow}>
          <View style={styles.dateInputWrapper}>
            <FontAwesome5 name="calendar-alt" size={16} color="#8d6e63" style={styles.calendarIcon} />
            {isWeb ? (
              <input
                type="date"
                value={ngayLam}
                onChange={(e) => setNgayLam(e.target.value)}
                style={{
                  flex: 1,
                  border: "none",
                  color: "#4b3621",
                  fontSize: 14,
                  fontFamily: "inherit",
                  outline: "none",
                  backgroundColor: "transparent",
                  paddingVertical: 8,
                }}
              />
            ) : (
              <TextInput
                style={styles.dateInput}
                value={ngayLam}
                onChangeText={setNgayLam}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#aaa"
              />
            )}
          </View>

          <TouchableOpacity style={styles.switchDateBtn} onPress={handleSwitchDate}>
            <FontAwesome5 name="search" size={12} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.switchDateBtnText}>Chuyển ngày</Text>
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4b3621" />
            <Text style={styles.loadingText}>Đang tải dữ liệu phân ca...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={[styles.shiftsContainer, isWeb && styles.shiftsContainerWeb]}>
              {/* Shift 1: Ca Sáng */}
              <View style={styles.shiftCard}>
                <View style={[styles.shiftCardHeader, { backgroundColor: "#FFF9C4" }]}>
                  <View style={[styles.shiftIconBox, { backgroundColor: "#FBC02D" }]}>
                    <FontAwesome5 name="sun" size={16} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.shiftCardTitle}>Ca Sáng</Text>
                    <Text style={styles.shiftCardTime}>07:00 - 12:00 (5 tiếng)</Text>
                  </View>
                </View>
                
                <View style={styles.shiftCardBody}>
                  {renderEmployeesTable("Ca Sáng", sangEmployees)}
                  <TouchableOpacity
                    style={styles.addEmpBtn}
                    onPress={() => handleOpenPicker("Ca Sáng")}
                  >
                    <FontAwesome5 name="plus" size={11} color="#4b3621" style={{ marginRight: 6 }} />
                    <Text style={styles.addEmpBtnText}>Thêm nhân viên</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Shift 2: Ca Chiều */}
              <View style={styles.shiftCard}>
                <View style={[styles.shiftCardHeader, { backgroundColor: "#FFE0B2" }]}>
                  <View style={[styles.shiftIconBox, { backgroundColor: "#F57C00" }]}>
                    <FontAwesome5 name="cloud-sun" size={16} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.shiftCardTitle}>Ca Chiều</Text>
                    <Text style={styles.shiftCardTime}>12:00 - 17:00 (5 tiếng)</Text>
                  </View>
                </View>

                <View style={styles.shiftCardBody}>
                  {renderEmployeesTable("Ca Chiều", chieuEmployees)}
                  <TouchableOpacity
                    style={styles.addEmpBtn}
                    onPress={() => handleOpenPicker("Ca Chiều")}
                  >
                    <FontAwesome5 name="plus" size={11} color="#4b3621" style={{ marginRight: 6 }} />
                    <Text style={styles.addEmpBtnText}>Thêm nhân viên</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Shift 3: Ca Tối */}
              <View style={styles.shiftCard}>
                <View style={[styles.shiftCardHeader, { backgroundColor: "#E1BEE7" }]}>
                  <View style={[styles.shiftIconBox, { backgroundColor: "#7B1FA2" }]}>
                    <FontAwesome5 name="moon" size={16} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.shiftCardTitle}>Ca Tối</Text>
                    <Text style={styles.shiftCardTime}>17:00 - 22:00 (5 tiếng)</Text>
                  </View>
                </View>

                <View style={styles.shiftCardBody}>
                  {renderEmployeesTable("Ca Tối", toiEmployees)}
                  <TouchableOpacity
                    style={styles.addEmpBtn}
                    onPress={() => handleOpenPicker("Ca Tối")}
                  >
                    <FontAwesome5 name="plus" size={11} color="#4b3621" style={{ marginRight: 6 }} />
                    <Text style={styles.addEmpBtnText}>Thêm nhân viên</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Confirm Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAll}>
              <FontAwesome5 name="check" size={14} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Xác nhận & Lưu ca</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Employee Picker Modal */}
      <Modal
        visible={employeePickerVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEmployeePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn nhân viên ({activeShiftTarget})</Text>
              <TouchableOpacity onPress={() => setEmployeePickerVisible(false)}>
                <FontAwesome5 name="times" size={18} color="#4b3621" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchWrapper}>
              <FontAwesome5 name="search" size={13} color="#8d6e63" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm nhân viên theo tên..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#aaa"
              />
            </View>

            {/* List */}
            <FlatList
              data={availableEmployees}
              keyExtractor={(item) => String(item.MaNhanVien)}
              style={styles.modalList}
              ListEmptyComponent={
                <View style={styles.modalEmptyBox}>
                  <Text style={styles.modalEmptyText}>Không tìm thấy nhân viên phù hợp</Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleAddEmployee(item)}
                >
                  <View style={styles.modalItemAvatar}>
                    <FontAwesome5 name="user" size={14} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalItemName}>{item.HoTen}</Text>
                    <Text style={styles.modalItemRole}>{getRoleDisplayName(item.vaiTro)}</Text>
                  </View>
                  <FontAwesome5 name="chevron-right" size={12} color="#eadfd3" />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );

  function renderEmployeesTable(shiftName, list) {
    return (
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>Nhân viên</Text>
          <Text style={[styles.th, { flex: 1.5 }]}>Vai trò</Text>
          <Text style={[styles.th, { flex: 0.8, textAlign: "center" }]}>Xóa</Text>
        </View>

        {/* Table Content */}
        {list.length === 0 ? (
          <View style={styles.tableEmpty}>
            <Text style={styles.tableEmptyText}>Chưa có nhân viên nào</Text>
          </View>
        ) : (
          list.map((emp) => (
            <View key={emp.MaNhanVien} style={styles.tr}>
              <Text style={[styles.td, { flex: 2, fontWeight: "bold" }]} numberOfLines={1}>
                {emp.HoTen}
              </Text>
              <Text style={[styles.td, { flex: 1.5 }]} numberOfLines={1}>
                {getRoleDisplayName(emp.vaiTro)}
              </Text>
              <TouchableOpacity
                style={[styles.td, { flex: 0.8, alignItems: "center" }]}
                onPress={() => handleRemoveEmployee(shiftName, emp.MaNhanVien)}
              >
                <View style={styles.removeIconBox}>
                  <FontAwesome5 name="trash-alt" size={11} color="#d32f2f" />
                </View>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff8f0",
  },
  container: {
    flex: 1,
    padding: 16,
    height: Platform.OS === "web" ? "100vh" : "100%",
    maxHeight: Platform.OS === "web" ? "100vh" : "100%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5ece3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTextBox: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4b3621",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: "#8d6e63",
    marginTop: 2,
  },
  dateSelectorRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  dateInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  calendarIcon: {
    marginRight: 10,
  },
  dateInput: {
    flex: 1,
    color: "#4b3621",
    fontSize: 14,
    paddingVertical: 10,
  },
  switchDateBtn: {
    flexDirection: "row",
    backgroundColor: "#8b4513",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  switchDateBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#4b3621",
    marginTop: 12,
    fontSize: 14,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  shiftsContainer: {
    flexDirection: "column",
    gap: 16,
  },
  shiftsContainerWeb: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  shiftCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1e6da",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  shiftCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5ece3",
  },
  shiftIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  shiftCardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#4b3621",
  },
  shiftCardTime: {
    fontSize: 11,
    color: "#8d6e63",
    marginTop: 2,
  },
  shiftCardBody: {
    padding: 12,
  },
  table: {
    borderWidth: 1,
    borderColor: "#f5ece3",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#faf6f0",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5ece3",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  th: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#8d6e63",
  },
  tr: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f5ece3",
    backgroundColor: "#fff",
  },
  td: {
    fontSize: 12,
    color: "#4b3621",
  },
  removeIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ffebee",
    justifyContent: "center",
    alignItems: "center",
  },
  tableEmpty: {
    paddingVertical: 20,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  tableEmptyText: {
    fontSize: 12,
    color: "#8d6e63",
    fontStyle: "italic",
  },
  addEmpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#8d6e63",
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  addEmpBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4b3621",
  },
  saveBtn: {
    flexDirection: "row",
    backgroundColor: "#4b3621",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  // Modal Picker styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    maxHeight: 500,
    backgroundColor: "#fff8f0",
    borderRadius: 20,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4b3621",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#4b3621",
    fontSize: 13,
    paddingVertical: 8,
  },
  modalList: {
    flex: 1,
  },
  modalEmptyBox: {
    paddingVertical: 40,
    alignItems: "center",
  },
  modalEmptyText: {
    color: "#8d6e63",
    fontSize: 13,
    fontStyle: "italic",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1e6da",
  },
  modalItemAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#8d6e63",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  modalItemName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4b3621",
  },
  modalItemRole: {
    fontSize: 11,
    color: "#8d6e63",
    marginTop: 2,
  },
});
