import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getStorageItem = async (key) => {
  if (Platform.OS === "web") {
    return window.sessionStorage.getItem(key);
  }
  return await AsyncStorage.getItem(key);
};

export const setStorageItem = async (key, value) => {
  if (Platform.OS === "web") {
    window.sessionStorage.setItem(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
};

export const removeStorageItem = async (key) => {
  if (Platform.OS === "web") {
    window.sessionStorage.removeItem(key);
    return;
  }
  await AsyncStorage.removeItem(key);
};
