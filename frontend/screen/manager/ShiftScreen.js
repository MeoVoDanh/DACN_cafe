import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import {
  createShift,
  deleteShift,
  fetchShifts,
  updateShift,
} from "../../redux/shiftSlice";

export default function ShiftScreen({ navigation }) {
  const dispatch = useDispatch();

  const { shifts, isLoading, error, message } = useSelector(
    (state) => state.shift,
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState(null);

  const [tenCa, setTenCa] = useState("");
  const [ngayLam, setNgayLam] = useState("");
  const [gioBatDau, setGioBatDau] = useState("");
  const [gioKetThuc, setGioKetThuc] = useState("");
  const [ghiChu, setGhiChu] = useState("");

  useEffect(() => {
    dispatch(fetchShifts());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      Alert.alert("Lỗi", error);
    }
  }, [error]);

  useEffect(() => {
    if (message) {
      Alert.alert("Thông báo", message);
    }
  }, [message]);

  const resetForm = () => {
    setEditingShift(null);
    setTenCa("");
    setNgayLam("");
    setGioBatDau("");
    setGioKetThuc("");
    setGhiChu("");
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (shift) => {
    setEditingShift(shift);

    setTenCa(shift.tenCa || "");
    setNgayLam(formatInputDate(shift.ngayLam));
    setGioBatDau(formatInputDateTime(shift.gioBatDau));
    setGioKetThuc(formatInputDateTime(shift.gioKetThuc));
    setGhiChu(shift.ghiChu || "");

    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (
      !tenCa.trim() ||
      !ngayLam.trim() ||
      !gioBatDau.trim() ||
      !gioKetThuc.trim()
    ) {
      Alert.alert(
        "Thông báo",
        "Vui lòng nhập đầy đủ tên ca, ngày làm, giờ bắt đầu và giờ kết thúc",
      );
      return;
    }

    const payload = {
      tenCa: tenCa.trim(),
      ngayLam: ngayLam.trim(),
      gioBatDau: gioBatDau.trim(),
      gioKetThuc: gioKetThuc.trim(),
      ghiChu: ghiChu.trim(),
      trangThai: editingShift?.trangThai || "Chưa có nhân viên",
    };

    let result;

    if (editingShift) {
      result = await dispatch(
        updateShift({
          maCa: editingShift.maCa,
          data: payload,
        }),
      );
    } else {
      result = await dispatch(createShift(payload));
    }

    if (
      createShift.fulfilled.match(result) ||
      updateShift.fulfilled.match(result)
    ) {
      closeModal();
      dispatch(fetchShifts());
    }
  };

  const handleDelete = (maCa) => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa ca làm này không?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          const result = await dispatch(deleteShift(maCa));

          if (deleteShift.fulfilled.match(result)) {
            dispatch(fetchShifts());
          }
        },
      },
    ]);
  };

  const renderShift = ({ item }) => {
    const hasEmployee = !!item.MaNhanVien;

    return (
      <View style={styles.shiftCard}>
        <View style={styles.shiftHeader}>
          <View style={styles.shiftIconBox}>
            <FontAwesome5 name="calendar-check" size={18} color="#fff" />
          </View>

          <View style={styles.shiftTitleBox}>
            <Text style={styles.shiftName}>{item.tenCa}</Text>
            <Text style={styles.shiftDate}>
              {formatDisplayDate(item.ngayLam)}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              hasEmployee ? styles.statusRegistered : styles.statusEmpty,
            ]}
          >
            <Text style={styles.statusText}>{item.trangThai}</Text>
          </View>
        </View>

        <View style={styles.shiftBody}>
          <InfoRow
            icon="clock"
            label="Giờ bắt đầu"
            value={formatDisplayDateTime(item.gioBatDau)}
          />

          <InfoRow
            icon="hourglass-end"
            label="Giờ kết thúc"
            value={formatDisplayDateTime(item.gioKetThuc)}
          />

          <InfoRow
            icon="user"
            label="Nhân viên đăng ký"
            value={item.HoTen || "Chưa có nhân viên đăng ký"}
          />

          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Ghi chú</Text>
            <Text style={styles.noteText}>
              {item.ghiChu || "Không có ghi chú cho ca này"}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => openEditModal(item)}
          >
            <FontAwesome5 name="edit" size={13} color="#fff" />
            <Text style={styles.actionText}>Sửa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item.maCa)}
          >
            <FontAwesome5 name="trash" size={13} color="#fff" />
            <Text style={styles.actionText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading && shifts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b3621" />
        <Text style={styles.loadingText}>Đang tải danh sách ca làm...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("DashboardScreen")}
          style={styles.backBtn}
        >
          <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.title}>QUẢN LÝ CA LÀM</Text>
          <Text style={styles.subtitle}>Tạo ca để nhân viên đăng ký</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Tổng số ca</Text>
          <Text style={styles.summaryValue}>{shifts.length}</Text>
        </View>

        <View style={styles.summaryIcon}>
          <FontAwesome5 name="calendar-alt" size={22} color="#fff" />
        </View>
      </View>

      <TouchableOpacity style={styles.createBtn} onPress={openCreateModal}>
        <FontAwesome5
          name="plus"
          size={14}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.createBtnText}>Tạo ca làm mới</Text>
      </TouchableOpacity>

      <FlatList
        data={shifts}
        keyExtractor={(item, index) => String(item.maCa ?? index)}
        renderItem={renderShift}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Chưa có ca làm nào</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingShift ? "Cập nhật ca làm" : "Tạo ca làm mới"}
              </Text>

              <TouchableOpacity onPress={closeModal}>
                <FontAwesome5 name="times" size={22} color="#4b3621" />
              </TouchableOpacity>
            </View>

            <Input
              label="Tên ca"
              placeholder="Ví dụ: Ca Sáng"
              value={tenCa}
              onChangeText={setTenCa}
            />

            <Input
              label="Ngày làm"
              placeholder="YYYY-MM-DD, ví dụ: 2026-05-25"
              value={ngayLam}
              onChangeText={setNgayLam}
            />

            <Input
              label="Giờ bắt đầu"
              placeholder="YYYY-MM-DD HH:mm:ss"
              value={gioBatDau}
              onChangeText={setGioBatDau}
            />

            <Input
              label="Giờ kết thúc"
              placeholder="YYYY-MM-DD HH:mm:ss"
              value={gioKetThuc}
              onChangeText={setGioKetThuc}
            />

            <View style={styles.formGroup}>
              <Text style={styles.label}>Ghi chú</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập ghi chú cho ca làm..."
                placeholderTextColor="#aaa"
                value={ghiChu}
                onChangeText={setGhiChu}
                multiline
              />
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
                  {editingShift ? "Lưu thay đổi" : "Tạo ca làm"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelModalBtn}
              onPress={closeModal}
            >
              <Text style={styles.cancelModalText}>Đóng</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const Input = ({ label, ...props }) => {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor="#aaa" {...props} />
    </View>
  );
};

const InfoRow = ({ icon, label, value }) => {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <FontAwesome5 name={icon} size={13} color="#4b3621" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
};

const formatInputDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatInputDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 19).replace("T", " ");
};

const formatDisplayDate = (value) => {
  if (!value) return "Chưa có ngày";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
};

const formatDisplayDateTime = (value) => {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff8f0",
    padding: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f5ece3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  headerTextBox: {
    flex: 1,
  },

  title: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#4b3621",
    letterSpacing: 0.5,
  },

  subtitle: {
    fontSize: 12,
    color: "#8d6e63",
    marginTop: 2,
  },

  summaryCard: {
    backgroundColor: "#4b3621",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryLabel: {
    color: "#fdf8f0",
    fontSize: 13,
  },

  summaryValue: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 4,
  },

  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },

  createBtn: {
    flexDirection: "row",
    backgroundColor: "#8b4513",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  createBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  listContent: {
    paddingBottom: 80,
  },

  shiftCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#f1e6da",
    overflow: "hidden",
    elevation: 2,
  },

  shiftHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f5ece3",
  },

  shiftIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#4b3621",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  shiftTitleBox: {
    flex: 1,
  },

  shiftName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#4b3621",
  },

  shiftDate: {
    fontSize: 12,
    color: "#8d6e63",
    marginTop: 3,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },

  statusEmpty: {
    backgroundColor: "#f57c00",
  },

  statusRegistered: {
    backgroundColor: "#2e7d32",
  },

  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },

  shiftBody: {
    padding: 14,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f5ece3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  infoLabel: {
    fontSize: 11,
    color: "#8d6e63",
    fontWeight: "bold",
  },

  infoValue: {
    fontSize: 13,
    color: "#4b3621",
    marginTop: 2,
  },

  noteBox: {
    backgroundColor: "#fff8f0",
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },

  noteLabel: {
    color: "#8d6e63",
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 4,
  },

  noteText: {
    color: "#4b3621",
    fontSize: 13,
    lineHeight: 19,
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#f5ece3",
    gap: 10,
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  editBtn: {
    backgroundColor: "#1976D2",
  },

  deleteBtn: {
    backgroundColor: "#D32F2F",
  },

  actionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 6,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#fff8f0",
    padding: 16,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  modalTitle: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#4b3621",
  },

  formGroup: {
    marginBottom: 14,
  },

  label: {
    color: "#4b3621",
    fontWeight: "bold",
    marginBottom: 7,
  },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 12,
    padding: 12,
    color: "#4b3621",
  },

  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },

  submitBtn: {
    backgroundColor: "#4b3621",
    padding: 14,
    borderRadius: 13,
    alignItems: "center",
    marginTop: 10,
  },

  submitText: {
    color: "#fff",
    fontWeight: "bold",
  },

  cancelModalBtn: {
    padding: 14,
    alignItems: "center",
    marginBottom: 20,
  },

  cancelModalText: {
    color: "#4b3621",
    fontWeight: "bold",
  },

  emptyBox: {
    alignItems: "center",
    marginTop: 50,
  },

  emptyText: {
    color: "#8d6e63",
    fontSize: 15,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff8f0",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: "#4b3621",
    marginTop: 12,
  },
});
