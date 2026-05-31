import React, { useEffect } from "react";
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
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployees } from "../../redux/employeeSlice";
import { FontAwesome5 } from "@expo/vector-icons";

export default function EmployeeListScreen({ navigation }) {
  const dispatch = useDispatch();

  const { employees, isLoading, error } = useSelector(
    (state) => state.employee,
  );

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

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

  const getRoleDisplayName = (role) => {
    if (role === "Admin") return "Quản lý (Admin)";
    if (role === "NhanVien") return "Nhân viên";
    return role;
  };

  const renderEmployeeRow = ({ item }) => {
    const statusBg = item.TrangThai === "Đang làm việc" ? "#E8F5E9" : "#FFEBEE";
    const statusColor = item.TrangThai === "Đang làm việc" ? "#2E7D32" : "#C62828";

    return (
      <TouchableOpacity
        style={styles.rowCard}
        onPress={() => {
          navigation.navigate("EmployeeScreen", {
            mode: "edit",
            employee: item,
          });
        }}
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
