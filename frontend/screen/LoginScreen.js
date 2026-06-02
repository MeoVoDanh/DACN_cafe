import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
  Image,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../redux/authSlice";
import { FontAwesome5 } from "@expo/vector-icons";

const bgWeb = require("../assets/coffee-bg-web.png");
const bgMobile = require("../assets/coffee-bg-mobile.png");

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();

  const { isLoading, error, user } = useSelector((state) => state.auth);

  const { width } = useWindowDimensions();
  const backgroundImage = width > 768 ? bgWeb : bgMobile;

  useEffect(() => {
    if (error) {
      alert(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // useEffect(() => {
  //   if (user) {
  //     if (user.vaiTro === "Admin") {
  //       navigation.replace("DashboardScreen");
  //     } else {
  //       navigation.replace("NhanVienHome");
  //     }
  //   }
  // }, [user, navigation]);

  const checkLogin = () => {
    if (!username.trim() || !password) {
      return alert("Vui lòng điền đầy đủ Tên đăng nhập và Mật khẩu nhé ní!");
    }

    dispatch(
      loginUser({
        tenDangNhap: username.trim(),
        matKhau: password,
      }),
    );
  };

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.container}
      resizeMode="cover"
    >
      <ScrollView
        contentContainerStyle={styles.overlayContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />

          <Text style={styles.brand}>O’Leon Cat Coffee</Text>
          <Text style={styles.subTitle}>HỆ THỐNG ĐĂNG NHẬP NỘI BỘ</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên đăng nhập</Text>

            <View style={styles.inputBox}>
              <FontAwesome5
                name="user"
                size={14}
                color="#8d6e63"
                style={{ marginRight: 10 }}
              />

              <TextInput
                style={styles.input}
                placeholder="Nhập username..."
                placeholderTextColor="#bbb"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu bảo mật</Text>

            <View style={styles.inputBox}>
              <FontAwesome5
                name="lock"
                size={14}
                color="#8d6e63"
                style={{ marginRight: 10 }}
              />

              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu..."
                placeholderTextColor="#bbb"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.btn}
            onPress={checkLogin}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome5
                  name="sign-in-alt"
                  size={14}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />

                <Text style={styles.btnText}>Đăng nhập hệ thống</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  overlayContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },

  card: {
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: "#f1e6da",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignSelf: "center",
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#4b3621",
    backgroundColor: "#fff",
  },

  brand: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4b3621",
    textAlign: "center",
    letterSpacing: 0.5,
  },

  subTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#8d6e63",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 25,
    letterSpacing: 0.5,
  },

  inputGroup: {
    marginBottom: 18,
  },

  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4b3621",
    marginBottom: 6,
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    backgroundColor: "#fff8f0",
    paddingHorizontal: 12,
  },

  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#4b3621",
    borderWidth: 0,
    outlineStyle: "none",
  },

  btn: {
    flexDirection: "row",
    backgroundColor: "#4b3621",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
