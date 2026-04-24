import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import MHLogin from "../screens/MHLogin";
import HomeNhanVien from "../screens/HomeNhanVien";
import HomeQuanLy from "../screens/HomeQuanLy";
import MHTaoTaiKhoan from "../screens/MHTaoTaiKhoan";
import MangHinhQLNV from "../screens/MangHinhQLNV";
import MHChiTietNhanVien from "../screens/MHChiTietNhanVien";
import MHChinhSuaTTNhanVien from "../screens/MHChinhSuaTTNhanVien";
import MHXacNhanXoaNhanVien from "../screens/MHXacNhanXoaNhanVien";

const Stack = createStackNavigator();

export default function Navigation() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={MHLogin} />
      <Stack.Screen name="Home Nhan Vien" component={HomeNhanVien} />
      <Stack.Screen name="Home Quan Ly" component={HomeQuanLy} />
      <Stack.Screen name="Tao Tai Khoan" component={MHTaoTaiKhoan} />
      <Stack.Screen name="QLNV" component={MangHinhQLNV} />
      <Stack.Screen name="Chi Tiet Nhan Vien" component={MHChiTietNhanVien} />
      <Stack.Screen name="Chinh Sua Thong Tin Nhan Vien" component={MHChinhSuaTTNhanVien} />
      <Stack.Screen name="Xac Nhan Xoa Nhan Vien" component={MHXacNhanXoaNhanVien} />
    </Stack.Navigator>
  );
}
