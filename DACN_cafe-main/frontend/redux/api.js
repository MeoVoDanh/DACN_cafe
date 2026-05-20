import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Nếu chạy Expo trên điện thoại thật, dùng IP máy tính của bạn
// Ví dụ: http://192.168.203.1:3000/api
const API_BASE_URL = "http://192.168.1.171:3000/api";

// Nếu chạy web hoặc emulator có thể tùy trường hợp:
// const API_BASE_URL = "http://localhost:3000/api";
// Android emulator thường dùng:
// const API_BASE_URL = "http://10.0.2.2:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Tự động gắn token vào mọi request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
