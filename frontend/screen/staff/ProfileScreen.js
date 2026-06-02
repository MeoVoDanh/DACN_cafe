import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Platform,
  TouchableOpacity,
  Image,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile } from "../../redux/profileSlice";
import { FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // Import Expo Image Picker
import api from "../../redux/api"; // Import api để thực hiện upload

export default function ProfileScreen({ navigation }) {
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

  // Lấy động đường dẫn Server chứa ảnh (Hỗ trợ chạy mượt cả trên giả lập lẫn máy thật)
  const imageBaseUrl = useMemo(() => {
    if (api.defaults.baseURL) {
      return api.defaults.baseURL.replace("/api", "/img");
    }
    return "http://localhost:3000/img";
  }, []);

  // Hàm kích hoạt chọn ảnh từ thư viện thiết bị
  const handlePickImage = async () => {
    // Xin quyền truy cập thư viện ảnh của máy
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền truy cập",
        "Vui lòng cấp quyền truy cập thư viện ảnh trong cài đặt để đổi ảnh đại diện!",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Cắt tỉ lệ vuông hoàn hảo cho avatar
      quality: 0.8,
    });

    if (!result.canceled) {
      const pickedUri = result.assets[0].uri;
      await handleUploadAvatar(pickedUri);
    }
  };

  // Hàm tải ảnh lên Backend và cập nhật cơ sở dữ liệu
  const handleUploadAvatar = async (uri) => {
    try {
      const formData = new FormData();

      // Xử lý File Upload tương thích cả Web và Mobile Native
      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append("image", blob, "avatar.jpg");
      } else {
        formData.append("image", {
          uri: uri,
          name: "avatar.jpg",
          type: "image/jpeg",
        });
      }

      // 1. Tải ảnh lên Server (Trả về fileName)
      const uploadResponse = await api.post("/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const fileName = uploadResponse.data.fileName;

      // 2. Cập nhật tên file ảnh mới vào database của nhân viên
      await api.put("/canhan/cap-nhat-avatar", { HinhAnh: fileName });

      // 3. Tải lại profile mới
      dispatch(fetchProfile());
      Alert.alert("Thành công", "Đã cập nhật ảnh đại diện mới của bạn!");
    } catch (err) {
      console.error("Lỗi cập nhật ảnh đại diện nhân viên:", err);
      Alert.alert("Lỗi", "Không thể cập nhật ảnh đại diện lúc này. Vui lòng thử lại!");
    }
  };

  if (isLoading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b3621" />
        <Text style={styles.loadingText}>Đang tải thông tin cá nhân...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerBox}>
          <TouchableOpacity
            onPress={() => navigation.navigate("EmployeeDashboardScreen")}
            style={styles.backBtn}
          >
            <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
          </TouchableOpacity>
          <Text style={styles.titleText}>Thông tin cá nhân</Text>
        </View>

        <View style={styles.card}>
          {/* Avatar Container cho phép chạm đổi ảnh */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity 
              style={styles.avatarWrapper} 
              onPress={handlePickImage} 
              activeOpacity={0.8}
            >
              {profile?.HinhAnh ? (
                <Image 
                  source={{ uri: `${imageBaseUrl}/${profile.HinhAnh}` }} 
                  style={styles.avatarImage} 
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <FontAwesome5 name="user" size={32} color="#fff" />
                </View>
              )}
              
              {/* Nút badge camera nhỏ đè lên ở góc dưới phải */}
              <View style={styles.cameraIconBadge}>
                <FontAwesome5 name="camera" size={10} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.hintText}>Chạm để đổi ảnh đại diện</Text>
          </View>

          <Text style={styles.name}>{profile?.HoTen || "Chưa có họ tên"}</Text>
          <Text style={styles.role}>{profile?.vaiTro || "Nhân viên"}</Text>

          <View style={styles.infoBox}>
            <InfoRow label="Tên đăng nhập" value={profile?.tenDangNhap} />
            <InfoRow label="Email" value={profile?.Email} />
            <InfoRow label="Số điện thoại" value={profile?.SDT} />
            <InfoRow label="Mã nhân viên" value={profile?.MaNhanVien} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Bổ sung helper InfoRow

const InfoRow = ({ label, value }) => {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "Chưa có"}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f1e9",
    height: Platform.OS === "web" ? "100vh" : "100%",
    maxHeight: Platform.OS === "web" ? "100vh" : "100%",
    overflow: "hidden",
  },
  container: {
    backgroundColor: "#f8f1e9",
    padding: 16,
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

  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4b3621",
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

  /* AVATAR INTERACTIVE STYLES */
  avatarContainer: {
    alignItems: "center",
    marginBottom: 18,
  },
  avatarWrapper: {
    position: "relative",
    width: 90,
    height: 90,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#c9a66b",
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#4b3621",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#c9a66b",
  },
  cameraIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#8d6e63",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  hintText: {
    fontSize: 11,
    color: "#8d6e63",
    marginTop: 8,
    fontStyle: "italic",
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
