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
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/authSlice";

const backgroundImage = require("../../assets/coffee-bg.png");

export default function EmployeeDashboardScreen({ navigation }) {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);

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
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.iconCircle}>
                  <FontAwesome5 name="user-tie" size={24} color="#4b3621" />
                </View>

                <View style={styles.headerTextGroup}>
                  <Text style={styles.title}>NHÂN VIÊN</Text>
                  <Text style={styles.subtitle}>
                    Xin chào, {user?.HoTen || "Nhân viên"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="sign-out-alt" size={12} color="#fff" />
                <Text style={styles.logoutText}>Thoát</Text>
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
          </View>
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
    flex: 1,
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
});
