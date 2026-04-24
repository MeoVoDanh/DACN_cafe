// HomeNhanVien.js
import React from "react";
import NhanVienOptions from "../components/NhanVienOptions";

export default function HomeNhanVien({ route, navigation }) {
  const { profile } = route.params;

  const handleLogout = () => {
    navigation.replace("Login");
  };

  return (
    <NhanVienOptions
      profile={profile}
      navigation={navigation}
      onLogout={handleLogout}
    />
  );
}
