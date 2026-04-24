// LoginScreen.js
import React, { useState } from "react";
import axios from "axios";
import LoginForm from "../components/LoginForm";

export default function MHLogin({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:5555/login", {
        username,
        password
      });

      const data = response.data;

      if (username.includes("@nhanvien")) {
        navigation.replace("Home Nhan Vien", { profile: data.profile });
      } else if (username.includes("@quanly")) {
        navigation.replace("Home Quan Ly", { profile: data.profile });
      } else {
        alert("Tên đăng nhập không hợp lệ");
      }

    } catch (error) {
      if (error.response) {
        alert(error.response.data.error);
      } else {
        alert("Không kết nối được server");
      }
    }
  };

  return (
    <LoginForm
      username={username}
      setUsername={setUsername}
      password={password}
      setPassword={setPassword}
      onLogin={handleLogin}
    />
  );
}
