// EmployeeDetailScreen.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import EmployeeDetail from "../components/EmployeeDetail";

export default function MHChiTietNhanVien({ route }) {
  const { id } = route.params;
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    axios
      .get(`http://localhost:5555/nhanvien/${id}`)
      .then((res) => setEmployee(res.data))
      .catch((err) => console.error("Lỗi khi gọi API:", err));
  }, [id]);

  return <EmployeeDetail employee={employee} />;
}
