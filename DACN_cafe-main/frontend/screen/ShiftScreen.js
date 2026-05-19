import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllEmployees } from "../redux/employeeSlice";
import axios from "axios";

export default function ShiftScreen({ navigation }) {
  const dispatch = useDispatch();
  const rawAccounts = useSelector((state) => state.dsEmployee.items);
  const allEmployeesInShop = rawAccounts.filter(
    (emp) => emp.TrangThai !== "Đã nghỉ việc",
  );

  useEffect(() => {
    dispatch(fetchAllEmployees());
  }, [dispatch]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [inputDay, setInputDay] = useState(String(currentDate.getDate()));
  const [inputMonth, setInputMonth] = useState(
    String(currentDate.getMonth() + 1),
  );
  const [inputYear, setInputYear] = useState(String(currentDate.getFullYear()));

  const [currentShifts, setCurrentShifts] = useState([
    { id: "Ca Sáng", name: "Ca Sáng (06:00 - 12:00)", staff: [] },
    { id: "Ca Chiều", name: "Ca Chiều (12:00 - 18:00)", staff: [] },
    { id: "Ca Tối", name: "Ca Tối (18:00 - 23:00)", staff: [] },
  ]);

  const getDbDateStr = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const fetchShiftsForDate = async (date) => {
    const dateStr = getDbDateStr(date);
    try {
      const response = await axios.get(
        `http://localhost:1234/calam/ngay/${dateStr}`,
        { withCredentials: true },
      );
      const data = response.data;
      setCurrentShifts([
        {
          id: "Ca Sáng",
          name: "Ca Sáng (06:00 - 12:00)",
          staff: data["Ca Sáng"]?.staff || [],
        },
        {
          id: "Ca Chiều",
          name: "Ca Chiều (12:00 - 18:00)",
          staff: data["Ca Chiều"]?.staff || [],
        },
        {
          id: "Ca Tối",
          name: "Ca Tối (18:00 - 23:00)",
          staff: data["Ca Tối"]?.staff || [],
        },
      ]);
    } catch (err) {
      console.log("Fetch shift error:", err);
    }
  };

  useEffect(() => {
    fetchShiftsForDate(currentDate);
  }, [currentDate]);

  const [editingShiftId, setEditingShiftId] = useState(null);
  const [tempStaffList, setTempStaffList] = useState([]);

  const formatDateString = (date) => {
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  };

  const formatDisplayDate = (date) => {
    const daysOfWeek = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    return `${daysOfWeek[date.getDay()]} , ${formatDateString(date)}`;
  };

  const syncInputValues = (targetDate) => {
    setInputDay(String(targetDate.getDate()));
    setInputMonth(String(targetDate.getMonth() + 1));
    setInputYear(String(targetDate.getFullYear()));
  };

  const changeDayOffset = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + offset);
    setCurrentDate(newDate);
    syncInputValues(newDate);
    setEditingShiftId(null);
  };

  const adjustDay = (amount) => {
    let day = parseInt(inputDay, 10) + amount;
    if (isNaN(day)) day = 1;
    if (day < 1) day = 31;
    if (day > 31) day = 1;
    setInputDay(String(day));
  };
  const adjustMonth = (amount) => {
    let month = parseInt(inputMonth, 10) + amount;
    if (isNaN(month)) month = 1;
    if (month < 1) month = 12;
    if (month > 12) month = 1;
    setInputMonth(String(month));
  };
  const adjustYear = (amount) => {
    let year = parseInt(inputYear, 10) + amount;
    if (isNaN(year)) year = 2026;
    setInputYear(String(year));
  };

  const handleJumpToDate = () => {
    const day = parseInt(inputDay, 10);
    const month = parseInt(inputMonth, 10) - 1;
    const year = parseInt(inputYear, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year))
      return alert("Vui lòng kiểm tra lại số liệu!");

    const testDate = new Date(year, month, day);
    if (
      testDate.getDate() === day &&
      testDate.getMonth() === month &&
      testDate.getFullYear() === year
    ) {
      setCurrentDate(testDate);
      setShowDatePicker(false);
      setEditingShiftId(null);
    } else {
      alert("Ngày tháng năm này không tồn tại!");
    }
  };

  const startEditing = (shiftId, currentStaffArray) => {
    setEditingShiftId(shiftId);
    setTempStaffList([...currentStaffArray]); // currentStaffArray is array of {MaNhanVien, HoTen}
  };

  const addStaffToShift = (emp) => {
    if (tempStaffList.find((s) => s.MaNhanVien === emp.MaNhanVien))
      return alert("Nhân viên này đã có trong ca rồi ní!");
    setTempStaffList([
      ...tempStaffList,
      { MaNhanVien: emp.MaNhanVien, HoTen: emp.HoTen },
    ]);
  };

  const removeStaffFromShift = (maNV) => {
    setTempStaffList(tempStaffList.filter((s) => s.MaNhanVien !== maNV));
  };

  const saveShiftChanges = async (shiftId) => {
    const ngayLam = getDbDateStr(currentDate);
    const danhSachNhanVien = tempStaffList.map((s) => s.MaNhanVien);

    try {
      await axios.post(
        `http://localhost:1234/calam/luu-ca`,
        { tenCa: shiftId, ngayLam, danhSachNhanVien },
        { withCredentials: true },
      );
      alert("Lưu lịch ca thành công!");
      fetchShiftsForDate(currentDate);
      setEditingShiftId(null);
    } catch (err) {
      alert("Lỗi khi lưu ca: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header chính */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("DashboardScreen")}
          style={styles.backBtn}
        >
          <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
        </TouchableOpacity>
        <Text style={styles.title}>LỊCH PHÂN CA TRỰC</Text>
      </View>

      {/* NÂNG CẤP VÀNG: B bọc toàn bộ phần lịch vào một Wrapper có zIndex độc lập */}
      <View style={styles.dateSelectorWrapper}>
        {/* Thanh bar chọn ngày */}
        <View style={styles.dateSelectorBar}>
          <TouchableOpacity
            style={styles.arrowBtn}
            onPress={() => changeDayOffset(-1)}
          >
            <FontAwesome5 name="chevron-left" size={14} color="#4b3621" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateDisplayBox}
            onPress={() => {
              syncInputValues(currentDate);
              setShowDatePicker(!showDatePicker);
            }}
            activeOpacity={0.7}
          >
            <FontAwesome5
              name="calendar-alt"
              size={15}
              color="#8d6e63"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.dateDisplayText}>
              {formatDisplayDate(currentDate)}
            </Text>
            <FontAwesome5
              name={showDatePicker ? "caret-up" : "caret-down"}
              size={12}
              color="#8d6e63"
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.arrowBtn}
            onPress={() => changeDayOffset(1)}
          >
            <FontAwesome5 name="chevron-right" size={14} color="#4b3621" />
          </TouchableOpacity>
        </View>

        {/* Bảng điều chỉnh thời gian nhanh tiến lùi */}
        {showDatePicker && (
          <View style={styles.pickerDropdown}>
            <Text style={styles.pickerLabel}>Điều chỉnh Thời Gian Nhanh:</Text>

            <View style={styles.pickerInputsRow}>
              {/* Ngày */}
              <View style={styles.stepperContainer}>
                <Text style={styles.miniLabel}>Ngày</Text>
                <View style={styles.stepperControl}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => adjustDay(-1)}
                  >
                    <FontAwesome5 name="minus" size={10} color="#4b3621" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.dateInput}
                    keyboardType="numeric"
                    maxLength={2}
                    value={inputDay}
                    onChangeText={setInputDay}
                  />
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => adjustDay(1)}
                  >
                    <FontAwesome5 name="plus" size={10} color="#4b3621" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tháng */}
              <View style={styles.stepperContainer}>
                <Text style={styles.miniLabel}>Tháng</Text>
                <View style={styles.stepperControl}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => adjustMonth(-1)}
                  >
                    <FontAwesome5 name="minus" size={10} color="#4b3621" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.dateInput}
                    keyboardType="numeric"
                    maxLength={2}
                    value={inputMonth}
                    onChangeText={setInputMonth}
                  />
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => adjustMonth(1)}
                  >
                    <FontAwesome5 name="plus" size={10} color="#4b3621" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Năm */}
              <View style={styles.stepperContainer}>
                <Text style={styles.miniLabel}>Năm</Text>
                <View style={styles.stepperControl}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => adjustYear(-1)}
                  >
                    <FontAwesome5 name="minus" size={10} color="#4b3621" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.dateInput}
                    keyboardType="numeric"
                    maxLength={4}
                    value={inputYear}
                    onChangeText={setInputYear}
                  />
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => adjustYear(1)}
                  >
                    <FontAwesome5 name="plus" size={10} color="#4b3621" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleJumpToDate}
              activeOpacity={0.8}
            >
              <FontAwesome5
                name="calendar-check"
                size={14}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.confirmBtnText}>Xác nhận đổi lịch</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Danh sách các ca trực */}
      <ScrollView style={styles.scrollArea}>
        {currentShifts.map((shift) => (
          <View key={shift.id} style={styles.shiftCard}>
            <View style={styles.shiftHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <FontAwesome5 name="clock" size={14} color="#fff" />
                <Text style={styles.shiftTitle}>{shift.name}</Text>
              </View>
              {editingShiftId !== shift.id && (
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => startEditing(shift.id, shift.staff)}
                >
                  <FontAwesome5
                    name="edit"
                    size={11}
                    color="#fff"
                    style={{ marginRight: 5 }}
                  />
                  <Text style={styles.editBtnText}>Chỉnh sửa</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.shiftBody}>
              <Text style={styles.staffLabel}>Nhân viên trực ca:</Text>

              {editingShiftId === shift.id ? (
                <View style={styles.editInterface}>
                  <Text style={styles.subSectionTitle}>
                    Nhân viên trong ca (Bấm X để xóa):
                  </Text>
                  <View style={styles.chipsContainer}>
                    {tempStaffList.length === 0 ? (
                      <Text style={styles.emptyText}>
                        Ca trực đang trống...
                      </Text>
                    ) : (
                      tempStaffList.map((emp) => (
                        <View key={emp.MaNhanVien} style={styles.staffChip}>
                          <Text style={styles.chipText}>{emp.HoTen}</Text>
                          <TouchableOpacity
                            style={styles.deleteChipBtn}
                            onPress={() => removeStaffFromShift(emp.MaNhanVien)}
                          >
                            <FontAwesome5
                              name="times-circle"
                              size={14}
                              color="#d32f2f"
                            />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>

                  <Text style={styles.subSectionTitle}>
                    Trượt ngang để thêm nhân viên:
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.horizontalSlider}
                    contentContainerStyle={{ paddingRight: 20 }}
                  >
                    {allEmployeesInShop.map((emp) => (
                      <TouchableOpacity
                        key={emp.MaNhanVien}
                        style={[
                          styles.sliderItem,
                          tempStaffList.find(
                            (s) => s.MaNhanVien === emp.MaNhanVien,
                          ) && styles.sliderItemDisabled,
                        ]}
                        onPress={() => addStaffToShift(emp)}
                        activeOpacity={0.7}
                      >
                        <FontAwesome5
                          name="plus"
                          size={10}
                          color={
                            tempStaffList.find(
                              (s) => s.MaNhanVien === emp.MaNhanVien,
                            )
                              ? "#aaa"
                              : "#4b3621"
                          }
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.sliderItemText,
                            tempStaffList.find(
                              (s) => s.MaNhanVien === emp.MaNhanVien,
                            ) && { color: "#aaa" },
                          ]}
                        >
                          {emp.HoTen}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setEditingShiftId(null)}
                    >
                      <Text style={styles.cancelText}>Hủy bỏ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={() => saveShiftChanges(shift.id)}
                    >
                      <FontAwesome5
                        name="calendar-check"
                        size={12}
                        color="#fff"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.saveText}>Lưu lịch ca</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text
                  style={[
                    styles.staffNames,
                    shift.staff.length === 0 && {
                      color: "#bbb",
                      fontStyle: "italic",
                    },
                  ]}
                >
                  {shift.staff.length > 0
                    ? shift.staff.map((s) => s.HoTen).join(", ")
                    : "Chưa xếp lịch trực"}
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff8f0", padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  backBtn: { padding: 10 },
  title: { fontSize: 20, fontWeight: "bold", color: "#4b3621", marginLeft: 15 },

  // NÚT THẮT SỬA LỖI: Hộp bọc ngoài gom cả cụm chọn ngày lại làm một bối cảnh hiển thị riêng biệt
  dateSelectorWrapper: {
    position: "relative",
    zIndex: 9999, // Ép trần nổi tuyệt đối cho bản Web và iOS
    elevation: 10, // Ép trần nổi tuyệt đối cho bản Android
    marginBottom: 20, // Đẩy khoảng cách với danh sách dưới
  },
  dateSelectorBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1e6da",
  },
  arrowBtn: { padding: 10, backgroundColor: "#f5ece3", borderRadius: 8 },
  dateDisplayBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 6,
  },
  dateDisplayText: { fontSize: 15, fontWeight: "bold", color: "#4b3621" },

  pickerDropdown: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1e6da",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 10000,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#8d6e63",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  pickerInputsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  stepperContainer: { width: "32%", alignItems: "center" },
  miniLabel: {
    fontSize: 12,
    color: "#8d6e63",
    marginBottom: 6,
    fontWeight: "bold",
  },
  stepperControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    backgroundColor: "#fff8f0",
    overflow: "hidden",
  },
  stepBtn: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "#f5ece3",
    alignItems: "center",
    justifyContent: "center",
  },
  dateInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
    color: "#4b3621",
    paddingVertical: 4,
    minWidth: 35,
    backgroundColor: "#fff",
    borderWidth: 0,
  },
  confirmBtn: {
    flexDirection: "row",
    backgroundColor: "#4b3621",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: { color: "#fff", fontWeight: "bold", fontSize: 13 },

  // Danh sách ca trực được giải phóng zIndex để không đá nhau với Web
  scrollArea: { flex: 1 },
  shiftCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1e6da",
    elevation: 2,
  },
  shiftHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#4b3621",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  shiftTitle: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 15,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#fff",
  },
  editBtnText: { color: "#fff", fontSize: 12, fontWeight: "500" },

  shiftBody: { padding: 15 },
  staffLabel: {
    fontWeight: "bold",
    color: "#8d6e63",
    marginBottom: 8,
    fontSize: 13,
  },
  staffNames: {
    color: "#444",
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
  },

  editInterface: { marginTop: 5, width: "100%" },
  subSectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#8d6e63",
    marginBottom: 8,
    marginTop: 5,
  },
  emptyText: {
    fontSize: 13,
    color: "#bbb",
    fontStyle: "italic",
    marginVertical: 5,
  },

  chipsContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 15 },
  staffChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5ece3",
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2d4c5",
  },
  chipText: { color: "#4b3621", fontSize: 13, fontWeight: "600" },
  deleteChipBtn: { marginLeft: 8, padding: 2 },

  horizontalSlider: {
    flexDirection: "row",
    paddingVertical: 5,
    marginBottom: 15,
  },
  sliderItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#4b3621",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 10,
    elevation: 1,
  },
  sliderItemDisabled: { borderColor: "#e0e0e0", backgroundColor: "#f9f9f9" },
  sliderItemText: { color: "#4b3621", fontSize: 13, fontWeight: "bold" },

  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#f5ece3",
    paddingTop: 10,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 10,
    borderRadius: 6,
  },
  cancelText: { color: "#777", fontSize: 13, fontWeight: "bold" },
  saveBtn: {
    flexDirection: "row",
    backgroundColor: "#4b3621",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
});
