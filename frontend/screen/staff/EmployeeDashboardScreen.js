import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  StatusBar,
  ScrollView,
  Image,
  Modal,
  FlatList,
  RefreshControl,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { logout } from "../../redux/authSlice";
import { fetchNotifications, markAllNotificationsRead } from "../../redux/profileSlice";
import api from "../../redux/api"; // Import api để lấy cấu hình đường dẫn ảnh

const backgroundImage = require("../../assets/coffee-bg.png");

export default function EmployeeDashboardScreen({ navigation }) {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { notifications, isLoading } = useSelector((state) => state.profile);

  const [notificationModalVisible, setNotificationModalVisible] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, user]);

  // Tự động fetch thông báo khi màn hình chính được mở/focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        dispatch(fetchNotifications());
      }
    }, [dispatch, user])
  );

  const unreadCount = React.useMemo(() => {
    return notifications ? notifications.filter((n) => n.trangThai === "Chưa đọc").length : 0;
  }, [notifications]);

  // Tính toán đường dẫn server ảnh động tương thích localhost và IP máy thật
  const imageBaseUrl = React.useMemo(() => {
    if (api.defaults.baseURL) {
      return api.defaults.baseURL.replace("/api", "/img");
    }
    return "http://localhost:3000/img";
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.iconCircle}>
                  {user?.HinhAnh ? (
                    <Image 
                      source={{ uri: `${imageBaseUrl}/${user.HinhAnh}` }} 
                      style={styles.avatarImage} 
                    />
                  ) : (
                    <FontAwesome5 name="user-tie" size={24} color="#4b3621" />
                  )}
                </View>

                <View style={styles.headerTextGroup}>
                  <Text style={styles.title}>{user?.HoTen || "Nhân viên"}</Text>
                  <Text style={styles.subtitle}>
                    Chức danh: {user?.vaiTro || "Nhân viên"}
                  </Text>
                </View>
              </View>

              {/* Nút Quả chuông Thông báo */}
              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() => {
                  setNotificationModalVisible(true);
                  dispatch(fetchNotifications());
                }}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="bell" size={16} color="#fff" />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="sign-out-alt" size={12} color="#fff" />
                <Text style={styles.logoutText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("InvoiceScreen")}
              >
                <View style={styles.iconWrapper}>
                  <FontAwesome5
                    name="file-invoice-dollar"
                    size={18}
                    color="#fff"
                  />
                </View>
                <Text style={styles.buttonText}>QUẢN LÝ HÓA ĐƠN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("MyOrderCountScreen")}
              >
                <View style={styles.iconWrapper}>
                  <FontAwesome5 name="clipboard-list" size={18} color="#fff" />
                </View>
                <Text style={styles.buttonText}>SỐ LƯỢNG ĐƠN ĐÃ THỰC HIỆN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("EmployeeShiftScreen")}
              >
                <View style={styles.iconWrapper}>
                  <FontAwesome5 name="calendar-check" size={18} color="#fff" />
                </View>
                <Text style={styles.buttonText}>QUẢN LÝ CA</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonSpecial]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("ProfileScreen")}
              >
                <View style={styles.iconWrapper}>
                  <FontAwesome5 name="id-card" size={18} color="#fff" />
                </View>
                <Text style={styles.buttonText}>THÔNG TIN CÁ NHÂN</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <View style={styles.line} />
              <FontAwesome5
                name="mug-hot"
                size={15}
                color="#c9a66b"
                style={{ marginHorizontal: 10 }}
              />
              <View style={styles.line} />
            </View>
          </ScrollView>

          {/* Modal hiển thị danh sách thông báo */}
          <Modal
            visible={notificationModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setNotificationModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <FontAwesome5 name="bell" size={16} color="#4b3621" style={{ marginRight: 8 }} />
                    <Text style={styles.modalTitle}>Thông báo của tôi</Text>
                  </View>
                  <TouchableOpacity onPress={() => setNotificationModalVisible(false)}>
                    <FontAwesome5 name="times" size={18} color="#4b3621" />
                  </TouchableOpacity>
                </View>

                {unreadCount > 0 && (
                  <TouchableOpacity
                    style={styles.markReadBtn}
                    onPress={() => dispatch(markAllNotificationsRead())}
                    activeOpacity={0.7}
                  >
                    <FontAwesome5 name="check-double" size={12} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.markReadText}>Đánh dấu đọc tất cả</Text>
                  </TouchableOpacity>
                )}

                <FlatList
                  data={notifications}
                  keyExtractor={(item) => String(item.maThongBao)}
                  style={styles.notificationList}
                  showsVerticalScrollIndicator={true}
                  refreshControl={
                    <RefreshControl
                      refreshing={isLoading}
                      onRefresh={() => dispatch(fetchNotifications())}
                      tintColor="#4b3621"
                      colors={["#4b3621"]}
                    />
                  }
                  ListEmptyComponent={
                    <View style={styles.emptyNotificationBox}>
                      <FontAwesome5 name="bell-slash" size={26} color="#8d6e63" style={{ marginBottom: 12 }} />
                      <Text style={styles.emptyNotificationText}>Bạn chưa có thông báo mới nào</Text>
                    </View>
                  }
                  renderItem={({ item }) => {
                    const isApproved = item.noiDung.includes("PHÊ DUYỆT");
                    const dateStr = new Date(item.createdAt).toLocaleString("vi-VN");
                    return (
                      <View style={[styles.notificationItem, item.trangThai === "Chưa đọc" && styles.unreadItem]}>
                        <View style={[styles.notifyIconBox, { backgroundColor: isApproved ? "#e8f5e9" : "#ffebee" }]}>
                          <FontAwesome5
                            name={isApproved ? "check-circle" : "times-circle"}
                            size={15}
                            color={isApproved ? "#2e7d32" : "#d32f2f"}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.notificationBody, item.trangThai === "Chưa đọc" && styles.unreadText]}>
                            {item.noiDung}
                          </Text>
                          <Text style={styles.notificationTime}>{dateStr}</Text>
                        </View>
                        {item.trangThai === "Chưa đọc" && (
                          <View style={styles.unreadDot} />
                        )}
                      </View>
                    );
                  }}
                />
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  safeArea: {
    flex: 1,
    width: "100%",
  },

  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    width: "100%",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%",
    marginTop: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 10,
    borderRadius: 15,
  },

  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  headerTextGroup: {
    marginLeft: 10,
    flex: 1,
  },

  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 248, 240, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden", // Để ảnh bo tròn đẹp mắt
  },

  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#c9a66b",
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 2,
  },

  subtitle: {
    fontSize: 11,
    color: "#fdf8f0",
    marginTop: 2,
    fontStyle: "italic",
    opacity: 0.9,
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d32f2f",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },

  logoutText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 5,
  },

  menuContainer: {
    width: "90%",
    maxWidth: 380,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(75, 54, 33, 0.85)",
    marginBottom: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
  },

  buttonSpecial: {
    backgroundColor: "rgba(139, 69, 19, 0.9)",
  },

  iconWrapper: {
    width: 30,
    alignItems: "center",
  },

  buttonText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
    letterSpacing: 0.3,
    flex: 1,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    marginTop: 10,
  },

  line: {
    height: 1,
    width: 40,
    backgroundColor: "#c9a66b",
  },

  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#d32f2f",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalContent: {
    width: "95%",
    maxWidth: 400,
    height: 450, // Định nghĩa chiều cao cụ thể giúp FlatList flex: 1 hoạt động chính xác không bị co cụm về 0
    backgroundColor: "#fff8f0",
    borderRadius: 20,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
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

  markReadBtn: {
    flexDirection: "row",
    backgroundColor: "#8d6e63",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: "flex-end",
    alignItems: "center",
    marginBottom: 12,
  },

  markReadText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },

  notificationList: {
    flex: 1,
  },

  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1e6da",
  },

  unreadItem: {
    backgroundColor: "#fdf8f4",
    borderColor: "#eadfd3",
  },

  notifyIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  notificationBody: {
    fontSize: 12,
    color: "#4b3621",
    lineHeight: 16,
  },

  unreadText: {
    fontWeight: "bold",
  },

  notificationTime: {
    fontSize: 10,
    color: "#8d6e63",
    marginTop: 4,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#d32f2f",
    marginLeft: 8,
  },

  emptyNotificationBox: {
    paddingVertical: 60,
    alignItems: "center",
  },

  emptyNotificationText: {
    color: "#8d6e63",
    fontSize: 13,
    fontStyle: "italic",
  },
});
