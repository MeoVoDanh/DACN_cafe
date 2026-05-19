import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteEmployee,
  fetchEmployees,
  setSelectedEmployee,
} from "../redux/employeeSlice";
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

  const handleEdit = (employee) => {
    dispatch(setSelectedEmployee(employee));

    navigation.navigate("EmployeeScreen", {
      mode: "edit",
      employee,
    });
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
          }
        },
      },
    ]);
  };

  const renderEmployee = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.avatar}>
          <FontAwesome5 name="user" size={20} color="#fff" />
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{item.HoTen}</Text>

          <Text style={styles.text}>Email: {item.Email || "Chưa có"}</Text>
          <Text style={styles.text}>SĐT: {item.SDT || "Chưa có"}</Text>
          <Text style={styles.text}>
            Tài khoản: {item.tenDangNhap || "Chưa có"}
          </Text>
          <Text style={styles.role}>Vai trò: {item.vaiTro}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => handleEdit(item)}
          >
            <FontAwesome5 name="edit" size={14} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item.MaNhanVien)}
          >
            <FontAwesome5 name="trash" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
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
      <ScrollView
        style={styles.list}
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
      >
        <View style={styles.headerBox}>
          <Text style={styles.title}>Quản lý nhân viên</Text>

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

        {employees.length > 0 ? (
          employees.map((item) => renderEmployee({ item }))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Chưa có nhân viên nào</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f1e9",
  },
  headerBox: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
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
  card: {
    minHeight: 130,
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eadfd3",
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4b3621",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4b3621",
    marginBottom: 6,
  },
  text: {
    fontSize: 13,
    color: "#6d4c41",
    marginBottom: 3,
  },
  role: {
    fontSize: 13,
    color: "#8d6e63",
    fontWeight: "bold",
    marginTop: 4,
  },
  actions: {
    justifyContent: "center",
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  editBtn: {
    backgroundColor: "#1976D2",
  },
  deleteBtn: {
    backgroundColor: "#D32F2F",
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
