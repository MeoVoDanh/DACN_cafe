import { setStorageItem, removeStorageItem } from "../redux/storage";
import api from "../redux/api";

export const loginApi = async (tenDangNhap, matKhau) => {
  const response = await api.post("/auth/login", {
    tenDangNhap,
    matKhau,
  });

  const { token, user } = response.data;

  await setStorageItem("token", token);
  await setStorageItem("user", JSON.stringify(user));

  return response.data;
};

export const logoutApi = async () => {
  await removeStorageItem("token");
  await removeStorageItem("user");
};

export const getCurrentUserApi = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};
