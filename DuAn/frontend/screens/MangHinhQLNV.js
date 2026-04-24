// EmployeeListScreen.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import EmployeeList from "../components/EmployeeList";

export default function MangHinhQLNV({ navigation }) {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5555/tendangnhapvamanhanvien")
      .then((res) => {
        setEmployees(res.data);
      })
      .catch((err) => console.error("Lỗi khi gọi API:", err));
  }, []);

  const handleCreate = () => {
    navigation.navigate("Tao Tai Khoan");
  };

  return (
    <EmployeeList
      employees={employees}
      navigation={navigation}
      onCreate={handleCreate}
    />
  );
}
