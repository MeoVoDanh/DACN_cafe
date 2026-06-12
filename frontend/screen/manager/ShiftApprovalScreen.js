import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { fetchPendingShifts, pheDuyetCaLam, clearShiftMessage } from "../../redux/shiftSlice";

export default function ShiftApprovalScreen({ navigation }) {
  const dispatch = useDispatch();

  const { pendingShifts, isLoading, error, message } = useSelector(
    (state) => state.shift
  );

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchPendingShifts());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      Alert.alert("Lỗi", error, [
        { text: "OK", onPress: () => dispatch(clearShiftMessage()) }
      ]);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (message) {
      Alert.alert("Thông báo", message, [
        { text: "OK", onPress: () => dispatch(clearShiftMessage()) }
      ]);
    }
  }, [message, dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchPendingShifts());
    setRefreshing(false);
  };

  const handleAction = (maCa, action, employeeName, shiftName) => {
    const actionText = action === "approve" ? "phê duyệt" : "từ chối";
    if (Platform.OS === "web") {
      const confirmAction = window.confirm(`Bạn có chắc chắn muốn ${actionText} yêu cầu đăng ký [${shiftName}] của [${employeeName}] không?`);
      if (confirmAction) {
        dispatch(pheDuyetCaLam({ maCa, action })).then((result) => {
          if (pheDuyetCaLam.fulfilled.match(result)) {
            dispatch(fetchPendingShifts());
          }
        });
      }
      return;
    }
    Alert.alert(
      "Xác nhận",
      `Bạn có chắc chắn muốn ${actionText} yêu cầu đăng ký [${shiftName}] của [${employeeName}] không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: action === "approve" ? "Đồng ý" : "Từ chối",
          style: action === "approve" ? "default" : "destructive",
          onPress: async () => {
            const result = await dispatch(pheDuyetCaLam({ maCa, action }));
            if (pheDuyetCaLam.fulfilled.match(result)) {
              dispatch(fetchPendingShifts());
            }
          },
        },
      ]
    );
  };

  const getShiftColor = (tenCa) => {
    if (tenCa === "Ca Sáng") return { iconBg: "#FBC02D", cardBg: "#FFF9C4" };
    if (tenCa === "Ca Chiều") return { iconBg: "#F57C00", cardBg: "#FFE0B2" };
    return { iconBg: "#7B1FA2", cardBg: "#E1BEE7" };
  };

  const renderPendingItem = ({ item }) => {
    const colors = getShiftColor(item.tenCa);
    const dateStr = new Date(item.ngayLam).toLocaleDateString("vi-VN");

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={[styles.cardHeader, { backgroundColor: colors.cardBg }]}>
          <View style={[styles.shiftIconBox, { backgroundColor: colors.iconBg }]}>
            <FontAwesome5
              name={item.tenCa === "Ca Sáng" ? "sun" : item.tenCa === "Ca Chiều" ? "cloud-sun" : "moon"}
              size={14}
              color="#fff"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shiftTitle}>{item.tenCa}</Text>
            <Text style={styles.shiftTime}>
              {formatTime(item.gioBatDau)} - {formatTime(item.gioKetThuc)}
            </Text>
          </View>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Chờ duyệt</Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <FontAwesome5 name="user-alt" size={13} color="#8d6e63" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Nhân viên đăng ký:</Text>
              <Text style={styles.infoValue}>
                {item.HoTen} <Text style={styles.roleValue}>({item.vaiTro === "Admin" ? "Quản lý" : "Nhân viên"})</Text>
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <FontAwesome5 name="calendar-day" size={13} color="#8d6e63" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Ngày đăng ký trực:</Text>
              <Text style={styles.infoValue}>{dateStr}</Text>
            </View>
          </View>

          {item.ghiChu ? (
            <View style={styles.infoRow}>
              <FontAwesome5 name="comment-alt" size={13} color="#8d6e63" style={styles.infoIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Ghi chú:</Text>
                <Text style={styles.ghiChuText}>{item.ghiChu}</Text>
              </View>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              activeOpacity={0.7}
              onPress={() => handleAction(item.maCa, "reject", item.HoTen, item.tenCa)}
            >
              <FontAwesome5 name="times-circle" size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Từ chối</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              activeOpacity={0.7}
              onPress={() => handleAction(item.maCa, "approve", item.HoTen, item.tenCa)}
            >
              <FontAwesome5 name="check-circle" size={14} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>Phê duyệt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const formatTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const hh = date.getHours().toString().padStart(2, "0");
    const mm = date.getMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
  };

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
            <Text style={styles.title}>DUYỆT CA TRỰC</Text>
            <Text style={styles.subtitle}>Danh sách yêu cầu đăng ký ca từ nhân viên</Text>
          </View>
        </View>

        {/* Content */}
        {isLoading && pendingShifts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4b3621" />
            <Text style={styles.loadingText}>Đang tải yêu cầu duyệt...</Text>
          </View>
        ) : (
          <FlatList
            data={pendingShifts}
            keyExtractor={(item) => String(item.maCa)}
            renderItem={renderPendingItem}
            style={styles.list}
            contentContainerStyle={[styles.listContent, isWeb && styles.listContentWeb]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4b3621" />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <FontAwesome5 name="check-double" size={32} color="#8d6e63" />
                </View>
                <Text style={styles.emptyText}>Tuyệt vời! Hiện tại không có ca trực nào đang chờ duyệt</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
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
  list: {
    flex: 1,
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
  listContent: {
    paddingBottom: 40,
  },
  listContentWeb: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1e6da",
    overflow: "hidden",
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    width: Platform.OS === "web" ? "48%" : "100%",
    minWidth: Platform.OS === "web" ? 300 : "100%",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5ece3",
  },
  shiftIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  shiftTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#4b3621",
  },
  shiftTime: {
    fontSize: 11,
    color: "#8d6e63",
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: "#ffe0b2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pendingText: {
    fontSize: 10,
    color: "#f57c00",
    fontWeight: "bold",
  },
  cardBody: {
    padding: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 3,
  },
  infoLabel: {
    fontSize: 11,
    color: "#8d6e63",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4b3621",
    marginTop: 2,
  },
  roleValue: {
    fontSize: 12,
    fontWeight: "normal",
    color: "#8d6e63",
  },
  ghiChuText: {
    fontSize: 13,
    color: "#6d4c41",
    fontStyle: "italic",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#faf6f0",
    paddingTop: 14,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rejectBtn: {
    backgroundColor: "#d32f2f",
  },
  approveBtn: {
    backgroundColor: "#2e7d32",
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f5ece3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#8d6e63",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
  },
});
