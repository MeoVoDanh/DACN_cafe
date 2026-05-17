import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { loginAdmin, clearError } from "../redux/authSlice";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error) {
      alert(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const checkLogin = () => {
    if (!username.trim() || !password) {
      return alert("Vui lòng điền đầy đủ Tên đăng nhập và Mật khẩu nhé ní!");
    }
    dispatch(loginAdmin({ username: username.trim(), password }));
  };

  return (
    <ImageBackground
      source={require("../assets/coffee-bg.png")}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Lớp phủ mờ nhẹ toàn màn hình giúp Form đăng nhập nổi bật và dễ nhìn hơn */}
      <View style={styles.overlayContainer}>
        {/* Hộp card chứa Form đăng nhập */}
        <View style={styles.card}>
          <View style={styles.logoCircle}>
            <FontAwesome5 name="store" size={24} color="#fff" />
          </View>
          <Text style={styles.brand}>CAFE MANAGEMENT</Text>
          <Text style={styles.subTitle}>HỆ THỐNG ĐĂNG NHẬP NỘI BỘ</Text>

          {/* Ô nhập Tên Đăng Nhập */}
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

          {/* Ô nhập Mật Khẩu */}
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

          {/* Nút bấm Đăng Nhập */}
          <TouchableOpacity
            style={styles.btn}
            onPress={checkLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
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
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // Ép ảnh nền trải rộng phủ kín 100% màn hình thiết bị
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  // Vùng đệm căn giữa card đăng nhập và tạo hiệu ứng mờ nhẹ lên ảnh nền
  overlayContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.15)", // Độ mờ nền đen (tăng giảm tùy thích)
  },

  // Tấm thẻ đăng nhập trắng tinh tế, hơi mờ nhẹ đổ bóng sang trọng
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

  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4b3621",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
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
  inputGroup: { marginBottom: 18 },
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
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});
