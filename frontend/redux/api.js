import axios from "axios";
import { getStorageItem } from "./storage";

//dùng trên máy mình thì chỉ dùng localhost
//con sài trên điện thoại thì dùng địa chị ip của máy và tắt firewall
const API_BASE_URL = "http://172.30.16.1:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Tự động gắn token vào mọi request
api.interceptors.request.use(
  async (config) => {
    const token = await getStorageItem("token");

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
