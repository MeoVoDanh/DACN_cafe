import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile } from "../../redux/profileSlice";
import { FontAwesome5 } from "@expo/vector-icons";

export default function ProfileScreen() {
  const dispatch = useDispatch();

  const { profile, isLoading, error } = useSelector((state) => state.profile);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      Alert.alert("Lỗi", error);
    }
  }, [error]);

  if (isLoading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b3621" />
        <Text style={styles.loadingText}>Đang tải thông tin cá nhân...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <FontAwesome5 name="user" size={34} color="#fff" />
        </View>

        <Text style={styles.name}>{profile?.HoTen || "Chưa có họ tên"}</Text>
        <Text style={styles.role}>{profile?.vaiTro || "Nhân viên"}</Text>

        <View style={styles.infoBox}>
          <InfoRow label="Tên đăng nhập" value={profile?.tenDangNhap} />
          <InfoRow label="Email" value={profile?.Email} />
          <InfoRow label="Số điện thoại" value={profile?.SDT} />
          <InfoRow label="Mã nhân viên" value={profile?.MaNhanVien} />
          <InfoRow label="Mã tài khoản" value={profile?.MaTaiKhoan} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value }) => {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "Chưa có"}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f1e9",
    padding: 16,
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

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eadfd3",
    elevation: 3,
  },

  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#4b3621",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4b3621",
    textAlign: "center",
  },

  role: {
    fontSize: 14,
    color: "#8d6e63",
    marginTop: 4,
    marginBottom: 20,
    fontWeight: "bold",
  },

  infoBox: {
    width: "100%",
  },

  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0e3d8",
  },

  infoLabel: {
    fontSize: 12,
    color: "#8d6e63",
    fontWeight: "bold",
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 15,
    color: "#4b3621",
  },
});
