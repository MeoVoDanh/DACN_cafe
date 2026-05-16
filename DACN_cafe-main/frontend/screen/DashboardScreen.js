import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  StatusBar,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

const backgroundImage = require("../assets/coffee-bg.png");

export default function DashboardScreen({ onLogout, onNavigate }) {
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

        {/* Vùng an toàn bọc toàn bộ content */}
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            {/* Header Mới: Gom nút Đăng xuất vào trong để nó nằm dưới tai thỏ */}
            <View style={styles.header}>
              {/* Logo và Tiêu đề bên trái */}
              <View style={styles.headerContent}>
                <View style={styles.iconCircle}>
                  <FontAwesome5 name="coffee" size={24} color="#4b3621" />
                </View>
                <View style={styles.headerTextGroup}>
                  <Text style={styles.title}>COFFEE SHOP</Text>
                  <Text style={styles.subtitle}>Hệ Thống Quản Lý</Text>
                </View>
              </View>

              {/* Nút Đăng xuất bên phải - Không dùng absolute nữa */}
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={onLogout}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="sign-out-alt" size={12} color="#fff" />
                <Text style={styles.logoutText}>Thoát</Text>
              </TouchableOpacity>
            </View>

            {/* Phần Menu */}
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.7}
                onPress={() => onNavigate("EMPLOYEE")}
              >
                <View style={styles.iconWrapper}>
                  <FontAwesome5 name="users" size={18} color="#fff" />
                </View>
                <Text style={styles.buttonText}>QUẢN LÝ NHÂN VIÊN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.7}
                onPress={() => onNavigate("SHIFT")}
              >
                <View style={styles.iconWrapper}>
                  <FontAwesome5 name="calendar-check" size={18} color="#fff" />
                </View>
                <Text style={styles.buttonText}>QUẢN LÝ CA TRỰC</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.7}
                onPress={() => onNavigate("MENU")}
              >
                <View style={styles.iconWrapper}>
                  <FontAwesome5 name="book-open" size={18} color="#fff" />
                </View>
                <Text style={styles.buttonText}>DANH MỤC MENU</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonSpecial]}
                activeOpacity={0.7}
                onPress={() => onNavigate("REVENUE")}
              >
                <View style={styles.iconWrapper}>
                  <FontAwesome5 name="chart-pie" size={18} color="#fff" />
                </View>
                <Text style={styles.buttonText}>BÁO CÁO DOANH THU</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.line} />
              <FontAwesome5
                name="leaf"
                size={15}
                color="#c9a66b"
                style={{ marginHorizontal: 10 }}
              />
              <View style={styles.line} />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: "100%", height: "100%" },
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.45)" },
  safeArea: { flex: 1, width: "100%" },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20, // Giảm padding dọc xuống một chút
    width: "100%",
  },
  // Header: Bố cục ngang để chia trái/phải
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%",
    marginTop: 10, // Một chút margin để nép sát tai thỏ đẹp hơn
    backgroundColor: "rgba(255, 255, 255, 0.1)", // Một chút nền mờ cho đẹp
    padding: 10,
    borderRadius: 15,
  },
  headerContent: { flexDirection: "row", alignItems: "center" },
  headerTextGroup: { marginLeft: 10 },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 248, 240, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#fff", letterSpacing: 2 },
  subtitle: {
    fontSize: 11,
    color: "#fdf8f0",
    marginTop: 2,
    fontStyle: "italic",
    opacity: 0.9,
  },

  // Nút đăng xuất: Dùng layout bình thường trong Header
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

  menuContainer: { width: "90%", maxWidth: 360 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(75, 54, 33, 0.85)",
    marginBottom: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  buttonSpecial: { backgroundColor: "rgba(139, 69, 19, 0.9)" },
  iconWrapper: { width: 30, alignItems: "center" },
  buttonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    marginTop: 10,
  },
  line: { height: 1, width: 40, backgroundColor: "#c9a66b" },
});
