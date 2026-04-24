// CreateAccountScreen.js
import React, { useState } from "react";
import axios from "axios";
import CreateAccountForm from "../components/CreateAccountForm";

export default function MHTaoTaiKhoan() {
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [hoTen, setHoTen] = useState("");
  const [email, setEmail] = useState("");
  const [sdt, setSdt] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!tenDangNhap || !matKhau || !hoTen || !email || !sdt) {
      setMessage("Lỗi: Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5555/create-account", {
        tenDangNhap, matKhau, hoTen, email, sdt
      });

      setMessage(res.data.message + " Mã số nhân viên: " + res.data.maNhanVien);
    } catch (err) {
      setMessage("Lỗi: " + err.response?.data?.error);
    }
  };

  const handleReset = () => {
    setTenDangNhap("");
    setMatKhau("");
    setHoTen("");
    setEmail("");
    setSdt("");
    setMessage("");
  };

  return (
    <CreateAccountForm
      tenDangNhap={tenDangNhap}
      setTenDangNhap={setTenDangNhap}
      matKhau={matKhau}
      setMatKhau={setMatKhau}
      hoTen={hoTen}
      setHoTen={setHoTen}
      email={email}
      setEmail={setEmail}
      sdt={sdt}
      setSdt={setSdt}
      message={message}
      onSubmit={handleSubmit}
      onReset={handleReset}
    />
  );
}
