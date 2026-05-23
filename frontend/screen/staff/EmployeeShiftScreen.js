import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  RefreshControl,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import {
  cancelShift,
  fetchAvailableShifts,
  fetchMyShifts,
  registerShift,
} from "../../redux/employeeShiftSlice";
import { FontAwesome5 } from "@expo/vector-icons";

export default function EmployeeShiftScreen({ navigation }) {
  const dispatch = useDispatch();

  const [tab, setTab] = useState("available");

  const { availableShifts, myShifts, isLoading, error, message } = useSelector(
    (state) => state.employeeShift,
  );

  const [refreshing, setRefreshing] = useState(false);

  // Fetch dữ liệu mỗi khi người dùng quay lại màn hình này
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchAvailableShifts());
      dispatch(fetchMyShifts());
    }, [dispatch])
  );

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

  const reloadData = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchAvailableShifts()),
      dispatch(fetchMyShifts()),
    ]);
    setRefreshing(false);
  };

  const handleRegister = async (maCa) => {
    const result = await dispatch(registerShift(maCa));

    if (registerShift.fulfilled.match(result)) {
      reloadData();
    }
  };

  const handleCancel = async (maCa) => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn hủy đăng ký ca này không?", [
      { text: "Không", style: "cancel" },
      {
        text: "Hủy ca",
        style: "destructive",
        onPress: async () => {
          const result = await dispatch(cancelShift(maCa));

          if (cancelShift.fulfilled.match(result)) {
            reloadData();
          }
        },
      },
    ]);
  };

  const data = tab === "available" ? availableShifts : myShifts;

  const renderShift = ({ item }) => {
    const isMyShiftTab = tab === "mine";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.shiftName}>{item.tenCa}</Text>
          <Text style={styles.status}>{item.trangThai}</Text>
        </View>

        <Text style={styles.text}>Ngày làm: {formatDate(item.ngayLam)}</Text>
        <Text style={styles.text}>
          Bắt đầu: {formatDateTime(item.gioBatDau)}
        </Text>
        <Text style={styles.text}>
          Kết thúc: {formatDateTime(item.gioKetThuc)}
        </Text>

        <Text style={styles.note}>
          Ghi chú: {item.ghiChu || "Không có ghi chú"}
        </Text>

        {isMyShiftTab ? (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              item.coTheHuy === 1 ? styles.cancelBtn : styles.disabledBtn,
            ]}
            disabled={item.coTheHuy !== 1}
            onPress={() => handleCancel(item.maCa)}
          >
            <FontAwesome5 name="times-circle" size={14} color="#fff" />
            <Text style={styles.actionText}>
              {item.coTheHuy === 1 ? "Hủy đăng ký" : "Không thể hủy"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => handleRegister(item.maCa)}
          >
            <FontAwesome5 name="check-circle" size={14} color="#fff" />
            <Text style={styles.actionText}>Đăng ký ca</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading && availableShifts.length === 0 && myShifts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b3621" />
        <Text style={styles.loadingText}>Đang tải danh sách ca...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBox}>
        <TouchableOpacity
          onPress={() => navigation.navigate("EmployeeDashboardScreen")}
          style={styles.backBtn}
        >
          <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
        </TouchableOpacity>
        <Text style={styles.title}>Quản lý ca làm</Text>
      </View>

      <View style={styles.tabBox}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "available" && styles.tabActive]}
          onPress={() => setTab("available")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "available" && styles.tabTextActive,
            ]}
          >
            Ca còn trống
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, tab === "mine" && styles.tabActive]}
          onPress={() => setTab("mine")}
        >
          <Text
            style={[styles.tabText, tab === "mine" && styles.tabTextActive]}
          >
            Ca của tôi
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.maCa.toString()}
        renderItem={renderShift}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={reloadData}
            tintColor="#4b3621"
            colors={["#4b3621"]}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {tab === "available"
              ? "Hiện chưa có ca trống"
              : "Bạn chưa đăng ký ca nào"}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
};

const formatDateTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN");
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f1e9",
    padding: 16,
    height: Platform.OS === "web" ? "100vh" : "100%",
    maxHeight: Platform.OS === "web" ? "100vh" : "100%",
    overflow: "hidden",
  },

  headerBox: {
    flexDirection: "row",
    alignItems: "center",
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

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4b3621",
  },

  tabBox: {
    flexDirection: "row",
    backgroundColor: "#eadfd3",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },

  tabBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  tabActive: {
    backgroundColor: "#4b3621",
  },

  tabText: {
    color: "#4b3621",
    fontWeight: "bold",
  },

  tabTextActive: {
    color: "#fff",
  },

  listContent: {
    paddingBottom: 120,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eadfd3",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  shiftName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#4b3621",
  },

  status: {
    fontSize: 12,
    color: "#8d6e63",
    fontWeight: "bold",
  },

  text: {
    fontSize: 13,
    color: "#6d4c41",
    marginBottom: 4,
  },

  note: {
    fontSize: 13,
    color: "#4b3621",
    marginTop: 6,
    marginBottom: 12,
  },

  registerBtn: {
    flexDirection: "row",
    backgroundColor: "#2e7d32",
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  cancelBtn: {
    backgroundColor: "#d32f2f",
  },

  disabledBtn: {
    backgroundColor: "#9e9e9e",
  },

  actionBtn: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  actionText: {
    color: "#fff",
    fontWeight: "bold",
  },

  emptyText: {
    textAlign: "center",
    color: "#8d6e63",
    marginTop: 60,
    fontSize: 15,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f1e9",
  },

  loadingText: {
    color: "#4b3621",
    marginTop: 12,
  },
});
