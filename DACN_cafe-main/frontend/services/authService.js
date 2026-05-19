import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../redux/api";

export const loginApi = async (tenDangNhap, matKhau) => {
  const response = await api.post("/auth/login", {
    tenDangNhap,
    matKhau,
  });

  const { token, user } = response.data;

  await AsyncStorage.setItem("token", token);
  await AsyncStorage.setItem("user", JSON.stringify(user));

  return response.data;
};

export const logoutApi = async () => {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");
};

export const getCurrentUserApi = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};
