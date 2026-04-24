// EditEmployeeScreen.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import EditEmployeeForm from "../components/EditEmployeeForm";

export default function MHChinhSuaTTNhanVien({ route, navigation }) {
  const { id } = route.params;
  const [form, setForm] = useState({
    tenDangNhap: "",
    MatKhau: "",
    HoTen: "",
    Email: "",
    SDT: "",
  });

  useEffect(() => {
    axios
      .get(`http://localhost:5555/nhanvien/${id}`)
      .then((res) => setForm(res.data))
      .catch((err) => console.error("Lỗi khi lấy dữ liệu:", err));
  }, [id]);

  const handleSave = () => {
    axios
      .put(`http://localhost:5555/nhanvien/${id}`, form)
      .then(() => {
        alert("Cập nhật thành công!");
        navigation.goBack();
      })
      .catch((err) => alert("Lỗi khi cập nhật: " + err));
  };

  return <EditEmployeeForm form={form} setForm={setForm} onSave={handleSave} />;
}
