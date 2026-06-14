import React, { useEffect, useMemo, useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
  Image,
  TextInput,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployees } from "../../redux/employeeSlice";
import { FontAwesome5 } from "@expo/vector-icons";
import api from "../../redux/api";

export default function EmployeeListScreen({ navigation }) {
  const dispatch = useDispatch();

  const { employees, isLoading, error } = useSelector(
    (state) => state.employee,
  );

  const [searchQuery, setSearchQuery] = useState("");

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const query = searchQuery.toLowerCase().trim();
    return employees.filter(
      (emp) => emp.HoTen && emp.HoTen.toLowerCase().includes(query)
    );
  }, [employees, searchQuery]);

  const imageBaseUrl = useMemo(() => {
    if (api.defaults.baseURL) {
      return api.defaults.baseURL.replace("/api", "/img");
    }
    return "http://localhost:3000/img";
  }, []);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchEmployees());
    }, [dispatch])
  );

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
    if (role === "Admin") return "Quản lý";
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
        activeOpacity={0.8}
      >
        {/* Card Header: Avatar & Name/Role */}
        <View style={styles.cardHeader}>
          <View style={styles.rowAvatar}>
            {item.HinhAnh ? (
              <Image
                source={{ uri: `${imageBaseUrl}/${item.HinhAnh}` }}
                style={styles.avatarImage}
              />
            ) : (
              <FontAwesome5 name="user" size={16} color="#fff" />
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.rowName} numberOfLines={1}>
              {item.HoTen}
            </Text>
            <View style={styles.roleBadge}>
              <FontAwesome5
                name={item.vaiTro === "Admin" ? "user-shield" : "user-tie"}
                size={9}
                color="#6d4c41"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.roleBadgeText}>
                {getRoleDisplayName(item.vaiTro)}
              </Text>
            </View>
          </View>
        </View>

        {/* Card Divider */}
        <View style={styles.cardDivider} />

        {/* Card Body: Contact Info */}
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <FontAwesome5 name="envelope" size={11} color="#8d6e63" style={styles.infoIcon} />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.Email || "Chưa cấu hình Email"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome5 name="phone" size={11} color="#8d6e63" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              {item.SDT || "Chưa cấu hình SĐT"}
            </Text>
          </View>
          {item.SoCCCD ? (
            <View style={styles.infoRow}>
              <FontAwesome5 name="id-card" size={11} color="#8d6e63" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                {item.SoCCCD}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Card Footer: Status & Action Indicator */}
        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {item.TrangThai || "Đang làm việc"}
            </Text>
          </View>
          <View style={styles.editBtn}>
            <Text style={styles.editBtnText}>Chi tiết</Text>
            <FontAwesome5 name="chevron-right" size={9} color="#8d6e63" style={{ marginLeft: 4 }} />
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

  const isWeb = Platform.OS === "web";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBox}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.navigate("DashboardScreen")}
            style={styles.backBtn}
          >
            <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
          </TouchableOpacity>
          <Text style={styles.title}>Danh sách nhân viên</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <FontAwesome5
            name="plus"
            size={12}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.addBtnText}>Thêm nhân viên</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <FontAwesome5 name="search" size={14} color="#8d6e63" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm nhân viên theo tên..."
            placeholderTextColor="#8d6e63"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn}>
              <FontAwesome5 name="times-circle" size={16} color="#8d6e63" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        style={styles.list}
        data={filteredEmployees}
        keyExtractor={(item, index) =>
          String(item.MaNhanVien ?? item.maNhanVien ?? item.MaTaiKhoan ?? index)
        }
        renderItem={renderEmployeeRow}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={[styles.listContent, isWeb && styles.listContentWeb]}
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
            <Text style={styles.emptyText}>
              {searchQuery ? "Không tìm thấy nhân viên phù hợp" : "Chưa có nhân viên nào"}
            </Text>
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
  headerBox: {
    flexDirection: Platform.OS === "web" ? "row" : "column",
    justifyContent: Platform.OS === "web" ? "space-between" : "flex-start",
    alignItems: Platform.OS === "web" ? "center" : "stretch",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5ece3",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4b3621",
  },
  addBtn: {
    flexDirection: "row",
    backgroundColor: "#4b3621",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: Platform.OS === "web" ? "auto" : "stretch",
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
  listContentWeb: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "flex-start",
  },
  rowCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eadfd3",
    padding: 16,
    marginBottom: 12,
    width: Platform.OS === "web" ? "31%" : "100%",
    minWidth: Platform.OS === "web" ? 280 : "100%",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4b3621",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4b3621",
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5ece3",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#6d4c41",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#f1e6da",
    marginVertical: 12,
  },
  cardBody: {
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  infoIcon: {
    width: 16,
    marginRight: 8,
    textAlign: "center",
  },
  infoText: {
    fontSize: 12,
    color: "#5d4037",
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#8d6e63",
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eadfd3",
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#4b3621",
    fontSize: 14,
    height: "100%",
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
});
