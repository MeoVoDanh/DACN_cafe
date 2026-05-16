import React, { useState } from "react";
import LoginScreen from "./screen/LoginScreen";
import DashboardScreen from "./screen/DashboardScreen";
import EmployeeScreen from "./screen/EmployeeScreen";
import ShiftScreen from "./screen/ShiftScreen";
import MenuScreen from "./screen/MenuScreen";
import RevenueScreen from "./screen/RevenueScreen";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState("LOGIN");

  // Danh sách tài khoản hệ thống (Khởi tạo sẵn tài khoản Admin quản lý và một vài nhân viên mẫu)
  const [accounts, setAccounts] = useState([
    {
      id: "1",
      user: "admin",
      pass: "123",
      name: "Quản Lý Trưởng",
      role: "Quản lý",
      cccd: "123456789012",
      phone: "0901234567",
    },
    {
      id: "2",
      user: "quanquet",
      pass: "123",
      name: "Trần Nguyễn Minh Quân",
      role: "Phục vụ",
      cccd: "098765432109",
      phone: "0912345678",
    },
    {
      id: "3",
      user: "vipro",
      pass: "123",
      name: "Trần Trí Vĩ",
      role: "Pha chế",
      cccd: "012345678901",
      phone: "0988888888",
    },
  ]);

  const [menuItems, setMenuItems] = useState([
    { id: "1", name: "Cà phê đá truyền thống", price: 29000, icon: "coffee" },
    { id: "2", name: "Cà phê sữa Sài Gòn", price: 32000, icon: "coffee" },
    {
      id: "3",
      name: "Bạc xỉu ba tầng",
      price: 35000,
      icon: "glass-martini-alt",
    },
    { id: "4", name: "Trà đào cam sả", price: 39000, icon: "leaf" },
    {
      id: "5",
      name: "Matcha đá xay kem béo",
      price: 45000,
      icon: "cloud-meatball",
    },
  ]);

  // Hàm xử lý kiểm tra đăng nhập
  const handleLogin = (username, password) => {
    const matched = accounts.find(
      (acc) =>
        acc.user.toLowerCase() === username.toLowerCase() &&
        acc.pass === password,
    );
    if (matched) {
      setCurrentScreen("DASHBOARD");
    } else {
      alert("Tên đăng nhập hoặc mật khẩu không chính xác rồi ní ơi!");
    }
  };

  const handleLogout = () => {
    setCurrentScreen("LOGIN");
  };

  switch (currentScreen) {
    case "LOGIN":
      return <LoginScreen onLogin={handleLogin} />;
    case "DASHBOARD":
      return (
        <DashboardScreen
          onLogout={handleLogout}
          onNavigate={setCurrentScreen}
        />
      );
    case "EMPLOYEE":
      // TRUYỀN danh sách tài khoản xuống trang quản lý nhân viên để thêm/sửa/xóa nội bộ
      return (
        <EmployeeScreen
          onBack={() => setCurrentScreen("DASHBOARD")}
          accounts={accounts}
          setAccounts={setAccounts}
        />
      );
    case "SHIFT":
      return <ShiftScreen onBack={() => setCurrentScreen("DASHBOARD")} />;
    case "MENU":
      return (
        <MenuScreen
          onBack={() => setCurrentScreen("DASHBOARD")}
          menuItems={menuItems}
          setMenuItems={setMenuItems}
        />
      );
    case "REVENUE":
      return <RevenueScreen onBack={() => setCurrentScreen("DASHBOARD")} />;
    default:
      return <LoginScreen onLogin={handleLogin} />;
  }
}
