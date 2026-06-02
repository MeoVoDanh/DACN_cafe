import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Image,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

const bgWeb = require("../assets/coffee-bg-web.png");
const bgMobile = require("../assets/coffee-bg-mobile.png");

export default function RegisterScreen({ onRegister, onSwitchToLogin }) {
  const { width } = useWindowDimensions();
  const backgroundImage = width > 768 ? bgWeb : bgMobile;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = () => {
    if (!username || !password || !confirmPassword) {
      alert("Vui lòng điền đủ thông tin!");
      return;
    }
    if (password !== confirmPassword) {
      alert("Mật khẩu không khớp!");
      return;
    }
    onRegister(username, password);
  };

  return (
    <View style={styles.outerContainer}>
      <ImageBackground
        source={backgroundImage}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={styles.overlay}
          keyboardShouldPersistTaps="handled"
        >
          <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.keyboardView}
            >
              <View style={styles.box}>
                <Image
                  source={require("../assets/logo.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <Text style={styles.title}>TẠO TÀI KHOẢN</Text>
                <View style={styles.form}>
                  <View style={styles.inputWrapper}>
                    <FontAwesome5
                      name="user"
                      size={16}
                      color="#8d6e63"
                      style={styles.icon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Tên đăng nhập"
                      value={username}
                      onChangeText={setUsername}
                    />
                  </View>
                  <View style={styles.inputWrapper}>
                    <FontAwesome5
                      name="lock"
                      size={16}
                      color="#8d6e63"
                      style={styles.icon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Mật khẩu"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>
                  <View style={styles.inputWrapper}>
                    <FontAwesome5
                      name="check-circle"
                      size={16}
                      color="#8d6e63"
                      style={styles.icon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Xác nhận mật khẩu"
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={handleRegister}
                  >
                    <Text style={styles.buttonText}>ĐĂNG KÝ NGAY</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={onSwitchToLogin}
                  style={styles.switchBtn}
                >
                  <Text style={styles.switchText}>
                    Đã có tài khoản?{" "}
                    <Text style={styles.boldText}>Đăng nhập</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1 },
  backgroundImage: { width: "100%", height: "100%" },
  overlay: {
    flexGrow: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: { width: "100%", alignItems: "center" },
  safeArea: { width: "100%", justifyContent: "center", alignItems: "center" },
  box: {
    width: "90%",
    maxWidth: 420,
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingVertical: 50,
    paddingHorizontal: 40,
    borderRadius: 28,
    alignItems: "center",
    elevation: 10,
  },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignSelf: "center",
    marginBottom: 25,
    borderWidth: 1.5,
    borderColor: "#4b3621",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#4b3621",
    marginBottom: 40,
    letterSpacing: 2,
  },
  form: { width: "100%" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    height: 58,
  },
  icon: { width: 25, textAlign: "center", marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: "#4b3621" },
  button: {
    backgroundColor: "#4b3621",
    height: 58,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  switchBtn: { marginTop: 30 },
  switchText: { color: "#6d4c41", fontSize: 14 },
  boldText: { fontWeight: "bold", textDecorationLine: "underline" },
});
