// HomeQuanLy.js
import React from "react";
import QuanLyOptions from "../components/QuanLyOptions";

export default function HomeQuanLy({ route, navigation }) {
  const { profile } = route.params;

  const handleLogout = () => {
    navigation.replace("Login");
  };

  return (
    <QuanLyOptions
      navigation={navigation}
      onLogout={handleLogout}
    />
  );
}
