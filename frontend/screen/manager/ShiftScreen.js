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
  StatusBar,
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
  const [sangGhiChu, setSangGhiChu] = useState("");
  const [chieuGhiChu, setChieuGhiChu] = useState("");
  const [toiGhiChu, setToiGhiChu] = useState("");

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
    let sangNote = "";
    let chieuNote = "";
    let toiNote = "";

    if (shifts && Array.isArray(shifts)) {
      shifts.forEach((item) => {
        if (item.tenCa === "Ca Sáng" && item.ghiChu) sangNote = item.ghiChu;
        if (item.tenCa === "Ca Chiều" && item.ghiChu) chieuNote = item.ghiChu;
        if (item.tenCa === "Ca Tối" && item.ghiChu) toiNote = item.ghiChu;

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
    setSangGhiChu(sangNote);
    setChieuGhiChu(chieuNote);
    setToiGhiChu(toiNote);
  }, [shifts]);

  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePrevDay = () => {
    const parts = ngayLam.split("-");
    let currentDate = new Date();
    if (parts.length === 3) {
      currentDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    currentDate.setDate(currentDate.getDate() - 1);
    const prevDateStr = getLocalDateString(currentDate);
    setNgayLam(prevDateStr);
    dispatch(fetchShiftsByDate(prevDateStr));
  };

  const handleNextDay = () => {
    const parts = ngayLam.split("-");
    let currentDate = new Date();
    if (parts.length === 3) {
      currentDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDateStr = getLocalDateString(currentDate);
    setNgayLam(nextDateStr);
    dispatch(fetchShiftsByDate(nextDateStr));
  };

  const handleDateChangeWithConfirmation = (newDateStr) => {
    if (!newDateStr) return;
    if (Platform.OS === "web") {
      const confirmChange = window.confirm(`Bạn có muốn chuyển sang xem lịch ngày ${formatDateDisplay(newDateStr)} không?`);
      if (confirmChange) {
        setNgayLam(newDateStr);
        dispatch(fetchShiftsByDate(newDateStr));
      }
      return;
    }
    Alert.alert(
      "Xác nhận",
      `Bạn có muốn chuyển sang xem lịch ngày ${formatDateDisplay(newDateStr)} không?`,
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Chuyển ngày",
          onPress: () => {
            setNgayLam(newDateStr);
            dispatch(fetchShiftsByDate(newDateStr));
          },
        },
      ]
    );
  };

  const formatDateDisplay = (dateStr) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatDateDisplayLarge = (dateStr) => {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const dayName = days[date.getDay()];
    return `${dayName}, ${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const handleOpenDatePicker = () => {
    if (!isWeb) {
      Alert.prompt(
        "Chọn ngày",
        "Nhập ngày muốn chuyển (YYYY-MM-DD):",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Đồng ý",
            onPress: (val) => {
              if (val && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
                 handleDateChangeWithConfirmation(val.trim());
              } else {
                 Alert.alert("Thông báo", "Ngày nhập không đúng định dạng YYYY-MM-DD");
              }
            }
          }
        ],
        "plain-text",
        ngayLam
      );
    }
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
        ghiChu: sangGhiChu,
      },
      {
        tenCa: "Ca Chiều",
        employeeIds: chieuEmployees.map((e) => e.MaNhanVien),
        ghiChu: chieuGhiChu,
      },
      {
        tenCa: "Ca Tối",
        employeeIds: toiEmployees.map((e) => e.MaNhanVien),
        ghiChu: toiGhiChu,
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
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
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
        <View style={styles.dateSelectorContainer}>
          <TouchableOpacity onPress={handlePrevDay} style={styles.arrowBtn} activeOpacity={0.7}>
            <FontAwesome5 name="chevron-left" size={18} color="#4b3621" />
          </TouchableOpacity>

          <View style={styles.dateCenterWrapper}>
            <TouchableOpacity onPress={handleOpenDatePicker} style={styles.dateTextTrigger} activeOpacity={0.7}>
              <FontAwesome5 name="calendar-alt" size={18} color="#8d6e63" style={styles.centerCalendarIcon} />
              <Text style={styles.dateTextLarge}>
                {formatDateDisplayLarge(ngayLam)}
              </Text>
            </TouchableOpacity>

            {isWeb ? (
              <input
                type="date"
                value={ngayLam}
                onChange={(e) => handleDateChangeWithConfirmation(e.target.value)}
                style={{
                  position: "absolute",
                  opacity: 0,
                  width: "100%",
                  height: "100%",
                  top: 0,
                  left: 0,
                  cursor: "pointer",
                }}
              />
            ) : null}
          </View>

          <TouchableOpacity onPress={handleNextDay} style={styles.arrowBtn} activeOpacity={0.7}>
            <FontAwesome5 name="chevron-right" size={18} color="#4b3621" />
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
                  <View style={styles.noteInputWrapper}>
                    <FontAwesome5 name="edit" size={12} color="#8d6e63" style={styles.noteIcon} />
                    <TextInput
                      style={styles.noteInput}
                      value={sangGhiChu}
                      onChangeText={setSangGhiChu}
                      placeholder="Thêm ghi chú ca sáng..."
                      placeholderTextColor="#aaa"
                    />
                  </View>
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
                  <View style={styles.noteInputWrapper}>
                    <FontAwesome5 name="edit" size={12} color="#8d6e63" style={styles.noteIcon} />
                    <TextInput
                      style={styles.noteInput}
                      value={chieuGhiChu}
                      onChangeText={setChieuGhiChu}
                      placeholder="Thêm ghi chú ca chiều..."
                      placeholderTextColor="#aaa"
                    />
                  </View>
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
                  <View style={styles.noteInputWrapper}>
                    <FontAwesome5 name="edit" size={12} color="#8d6e63" style={styles.noteIcon} />
                    <TextInput
                      style={styles.noteInput}
                      value={toiGhiChu}
                      onChangeText={setToiGhiChu}
                      placeholder="Thêm ghi chú ca tối..."
                      placeholderTextColor="#aaa"
                    />
                  </View>
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
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 12 : 16,
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
  // Date Selector Premium Style
  dateSelectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 16,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5ece3",
    justifyContent: "center",
    alignItems: "center",
  },
  dateCenterWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
  },
  dateTextTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    width: "100%",
  },
  centerCalendarIcon: {
    marginRight: 10,
  },
  dateTextLarge: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4b3621",
    textAlign: "center",
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
    height: 450, // Định nghĩa chiều cao cụ thể giúp FlatList flex: 1 hoạt động chính xác không bị co cụm về 0
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
  noteInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#faf6f0",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  noteIcon: {
    marginRight: 8,
  },
  noteInput: {
    flex: 1,
    color: "#4b3621",
    fontSize: 12,
    paddingVertical: 6,
  },
});
