import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllEmployees, updateEmployee, createEmployee } from "../redux/DS_employee";

export default function EmployeeScreen({ navigation }) {
  const dispatch = useDispatch();
  const rawAccounts = useSelector((state) => state.dsEmployee.items);

  useEffect(() => {
    dispatch(fetchAllEmployees());
  }, [dispatch]);

  const accounts = rawAccounts.map((emp) => ({
    id: emp.MaNhanVien ? emp.MaNhanVien.toString() : Math.random().toString(),
    user: emp.tenDangNhap || "Chưa có",
    pass: emp.MatKhau || "***",
    name: emp.HoTen || "Không tên",
    role: emp.vaiTro || "Phục vụ",
    cccd: emp.SoCCCD || "Không có",
    email: emp.Email || "Không có",
    phone: emp.SDT || "Không có",
    status: emp.TrangThai || "Đang làm việc",
  }));

  // Điều khiển đóng mở form Tạo tài khoản mới
  const [isAddingMode, setIsAddingMode] = useState(false);
  // Lưu tài khoản đang được chọn để bấm xem chi tiết hồ sơ
  const selectedFromList = useSelector((state) => state.employee.selected);
  const [selectedEmpId, setSelectedEmpId] = useState(
    selectedFromList && selectedFromList.MaNhanVien 
      ? selectedFromList.MaNhanVien.toString() 
      : (accounts.length > 0 ? accounts[0].id : null)
  );

  // Cập nhật selectedEmpId nếu có thay đổi từ màn hình list truyền sang
  useEffect(() => {
    if (selectedFromList && selectedFromList.MaNhanVien) {
      setSelectedEmpId(selectedFromList.MaNhanVien.toString());
    }
  }, [selectedFromList]);

  // --- Các State phục vụ form tạo tài khoản nhân viên mới ---
  const [newName, setNewName] = useState("");
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newCccd, setNewCccd] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState(""); // Định nghĩa là setNewPhone chuẩn chỉnh
  const [newRole, setNewRole] = useState("Phục vụ");
  const [newStatus, setNewStatus] = useState("Đang làm việc");

  // --- Các State phục vụ bộ lọc nhân viên ---
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // --- Các State phục vụ Cập nhật hồ sơ nhân viên ---
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCccd, setEditCccd] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState("Đang làm việc");

  const activeEmp = accounts.find((acc) => acc.id === selectedEmpId) || accounts[0];

  // Hàm bật chế độ chỉnh sửa và nạp dữ liệu cũ
  const handleEditToggle = () => {
    if (!isEditingProfile && activeEmp) {
      setEditName(activeEmp.name);
      setEditCccd(activeEmp.cccd !== "Không có" ? activeEmp.cccd : "");
      setEditEmail(activeEmp.email !== "Không có" ? activeEmp.email : "");
      setEditPhone(activeEmp.phone !== "Không có" ? activeEmp.phone : "");
      setEditStatus(activeEmp.status);
    }
    setIsEditingProfile(!isEditingProfile);
  };

  // Hàm lưu dữ liệu cập nhật
  const handleSaveUpdate = () => {
    if (!activeEmp) return;
    const data = {
      name: editName,
      cccd: editCccd,
      email: editEmail,
      phone: editPhone,
      status: editStatus,
    };
    // Gọi API update
    dispatch(updateEmployee({ id: activeEmp.id, data }))
      .unwrap()
      .then(() => {
        // Load lại list sau khi update
        dispatch(fetchAllEmployees());
        setIsEditingProfile(false);
        alert("Đã lưu cập nhật thông tin thành công!");
      })
      .catch((err) => {
        // err now contains the exact MySQL error message passed from rejectWithValue
        alert("Lỗi SQL từ Server: " + (err || "Không gõ được lỗi"));
      });
  };

  // Danh sách vị trí của quán để chọn nhanh
  const rolesList = ["Quản lý", "Pha chế", "Phục vụ", "Thu ngân", "Tạp vụ"];

  // Xử lý tạo tài khoản nhân viên mới
  const handleCreateAccount = () => {
    if (
      !newName.trim() ||
      !newUser.trim() ||
      !newPass ||
      !newCccd.trim() ||
      !newEmail.trim() ||
      !newPhone.trim()
    ) {
      return alert(
        "Vui lòng điền đầy đủ thông tin hồ sơ để tạo tài khoản ní ơi!",
      );
    }

    const isExist = accounts.some(
      (acc) => acc.user.toLowerCase() === newUser.trim().toLowerCase(),
    );
    if (isExist) return alert("Tên đăng nhập này đã tồn tại trên hệ thống!");

    const newEmp = {
      name: newName.trim(),
      user: newUser.trim(),
      pass: newPass,
      role: newRole,
      cccd: newCccd.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      status: newStatus,
    };

    dispatch(createEmployee(newEmp)).then((action) => {
      if (createEmployee.fulfilled.match(action)) {
        alert(`Đã cấp tài khoản thành công cho nhân viên: ${newName}`);
        // Reset và đóng form quay về màn hình xem
        setIsAddingMode(false);
        setNewName("");
        setNewUser("");
        setNewPass("");
        setNewCccd("");
        setNewEmail("");
        setNewPhone("");
        setNewRole("Phục vụ");
        setNewStatus("Đang làm việc");
        
        // Refresh danh sách
        dispatch(fetchAllEmployees());
        
        if (action.payload && action.payload.id) {
           setSelectedEmpId(action.payload.id.toString());
        }
      } else {
        alert("Có lỗi xảy ra khi tạo nhân viên: " + (action.payload || "Lỗi không xác định"));
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header chính */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("DashboardScreen")} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
        </TouchableOpacity>
        <Text style={styles.title}>QUẢN LÝ TÀI KHOẢN NHÂN VIÊN</Text>
      </View>

      {/* KHUNG LAYOUT CHÍNH GRID CHIA TỶ LỆ CỐ ĐỊNH */}
      <View style={styles.mainLayout}>
        {/* ================= CỘT TRÁI: DANH SÁCH NHÂN VIÊN (Chiếm 4 phần) ================= */}
        <View style={styles.leftColumn}>
          <View style={[styles.columnHeader, { zIndex: 100 }]}>
            <Text style={styles.columnTitle}>DANH SÁCH CỬA HÀNG</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* DROPDOWN LỌC */}
              <View style={{ position: 'relative', marginRight: 10 }}>
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1e6da', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}
                  onPress={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <Text style={{ fontSize: 11, color: '#4b3621', marginRight: 5, fontWeight: 'bold' }}>Lọc: {filterStatus}</Text>
                  <FontAwesome5 name={isFilterOpen ? "chevron-up" : "chevron-down"} size={10} color="#4b3621" />
                </TouchableOpacity>

                {isFilterOpen && (
                  <View style={{ position: 'absolute', top: 30, right: 0, backgroundColor: '#fff', borderRadius: 6, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, width: 110, zIndex: 999, borderWidth: 1, borderColor: '#eee' }}>
                    {["Tất cả", "Đang làm việc", "Đã nghỉ việc"].map((opt) => (
                      <TouchableOpacity 
                        key={opt}
                        style={{ padding: 10, borderBottomWidth: opt !== "Đã nghỉ việc" ? 1 : 0, borderBottomColor: '#eee' }}
                        onPress={() => { setFilterStatus(opt); setIsFilterOpen(false); }}
                      >
                        <Text style={{ fontSize: 11, color: opt === filterStatus ? '#d32f2f' : '#4b3621', fontWeight: opt === filterStatus ? 'bold' : 'normal' }}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.addStaffToggleBtn,
                  isAddingMode && { backgroundColor: "#d32f2f" },
                ]}
                onPress={() => setIsAddingMode(!isAddingMode)}
              >
                <FontAwesome5
                  name={isAddingMode ? "times" : "user-plus"}
                  size={11}
                  color="#fff"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.addStaffToggleText}>
                  {isAddingMode ? "Hủy bỏ" : "Thêm mới"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.listScrollView}
            showsVerticalScrollIndicator={false}
          >
            {accounts.filter(emp => filterStatus === "Tất cả" || emp.status === filterStatus).map((emp) => (
              <TouchableOpacity
                key={emp.id}
                style={[
                  styles.empItemCard,
                  selectedEmpId === emp.id &&
                    !isAddingMode &&
                    styles.empItemActive,
                ]}
                onPress={() => {
                  setSelectedEmpId(emp.id);
                  setIsAddingMode(false);
                  setIsEditingProfile(false);
                }}
              >
                <View style={styles.avatarMini}>
                  <FontAwesome5 name="user" size={12} color="#4b3621" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.listName}>{emp.name}</Text>
                    <View style={[styles.statusDot, { backgroundColor: emp.status === "Đã nghỉ việc" ? "#d32f2f" : "#4caf50" }]} />
                  </View>
                  <Text style={styles.listRole}>
                    Vị trí: {emp.role} | @{emp.user}
                  </Text>
                </View>
                <FontAwesome5 name="chevron-right" size={10} color="#bbb" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ================= CỘT PHẢI: FORM HOẶC HỒ SƠ (Chiếm 6 phần) ================= */}
        <View style={styles.rightColumn}>
          {isAddingMode ? (
            // FORM ĐĂNG KÝ TÀI KHOẢN MỚI
            <ScrollView
              style={styles.formCard}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.formSectionTitle}>
                TẠO TÀI KHOẢN NHÂN VIÊN MỚI
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Họ và tên nhân viên</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Nhập tên thật..."
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Tên đăng nhập hệ thống (Username)
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Tên viết liền không dấu..."
                  autoCapitalize="none"
                  value={newUser}
                  onChangeText={setNewUser}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Mật khẩu khởi tạo</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Mật khẩu đăng nhập..."
                  secureTextEntry
                  value={newPass}
                  onChangeText={setNewPass}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Số CCCD (12 số)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Nhập mã định danh..."
                  keyboardType="numeric"
                  value={newCccd}
                  onChangeText={setNewCccd}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Nhập email..."
                  keyboardType="email-address"
                  value={newEmail}
                  onChangeText={setNewEmail}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Số điện thoại liên lạc</Text>
                {/* ĐÃ VÁ LỖI: Đổi thành setNewPhone ở dòng onChangeText dưới đây */}
                <TextInput
                  style={styles.formInput}
                  placeholder="Số di động..."
                  keyboardType="phone-pad"
                  value={newPhone}
                  onChangeText={setNewPhone}
                />
              </View>

              {/* Thanh chọn vị trí công tác */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Chọn vị trí công tác:{" "}
                  <Text style={{ color: "#8b4513" }}>{newRole}</Text>
                </Text>
                <View style={styles.chipsRow}>
                  {rolesList.map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.roleSelectChip,
                        newRole === r && styles.roleSelectChipActive,
                      ]}
                      onPress={() => setNewRole(r)}
                    >
                      <Text
                        style={[
                          styles.roleSelectText,
                          newRole === r && { color: "#fff" },
                        ]}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitCreateBtn}
                onPress={handleCreateAccount}
                activeOpacity={0.8}
              >
                <FontAwesome5
                  name="check"
                  size={12}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.submitCreateText}>
                  Cấp tài khoản & Lưu hồ sơ
                </Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            // HỒ SƠ CHI TIẾT
            activeEmp && (
              <View style={styles.profileCard}>
                <Text style={styles.profileSectionTitle}>
                  HỒ SƠ TÀI KHOẢN CHI TIẾT
                </Text>
                <View style={styles.badgeRow}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{activeEmp.role}</Text>
                  </View>
                  <Text style={styles.idSubText}>Mã NV: #{activeEmp.id}</Text>
                </View>

                {isEditingProfile ? (
                  // Chế độ chỉnh sửa
                  <View style={{ marginTop: 10 }}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Họ và tên:</Text>
                      <TextInput 
                        style={styles.editInput} 
                        value={editName} 
                        onChangeText={setEditName} 
                      />
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Số CCCD:</Text>
                      <TextInput 
                        style={styles.editInput} 
                        value={editCccd} 
                        onChangeText={setEditCccd} 
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Email:</Text>
                      <TextInput 
                        style={styles.editInput} 
                        value={editEmail} 
                        onChangeText={setEditEmail} 
                        keyboardType="email-address"
                      />
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Điện thoại:</Text>
                      <TextInput 
                        style={styles.editInput} 
                        value={editPhone} 
                        onChangeText={setEditPhone} 
                        keyboardType="phone-pad"
                      />
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Trạng thái:</Text>
                      <TouchableOpacity 
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} 
                        onPress={() => setEditStatus(editStatus === "Đang làm việc" ? "Đã nghỉ việc" : "Đang làm việc")}
                      >
                        <View style={[styles.statusDot, { backgroundColor: editStatus === "Đã nghỉ việc" ? "#d32f2f" : "#4caf50", marginLeft: 10 }]} />
                        <Text style={{ fontSize: 13, color: '#4b3621', marginLeft: 6, fontWeight: 'bold' }}>{editStatus}</Text>
                        <Text style={{ fontSize: 10, color: '#888', marginLeft: 10 }}>(Chạm để đổi)</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={{ flexDirection: 'row', marginTop: 15, justifyContent: 'flex-end' }}>
                      <TouchableOpacity 
                        style={[styles.submitCreateBtn, { backgroundColor: '#888', marginRight: 10, paddingHorizontal: 15 }]} 
                        onPress={handleEditToggle}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Hủy</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.submitCreateBtn, { paddingHorizontal: 20 }]} 
                        onPress={handleSaveUpdate}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Lưu thay đổi</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  // Chế độ xem
                  <View style={{ marginTop: 10 }}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Họ và tên:</Text>
                      <Text style={styles.infoValue}>{activeEmp.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Tên tài khoản:</Text>
                      <Text
                        style={[
                          styles.infoValue,
                          { fontWeight: "bold", color: "#8b4513" },
                        ]}
                      >
                        @{activeEmp.user}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Mật khẩu:</Text>
                      <Text style={styles.infoValue}>{activeEmp.pass}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Số CCCD:</Text>
                      <Text style={styles.infoValue}>{activeEmp.cccd}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Email:</Text>
                      <Text style={styles.infoValue}>{activeEmp.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Điện thoại:</Text>
                      <Text style={styles.infoValue}>{activeEmp.phone}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Trạng thái:</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={[styles.statusDot, { backgroundColor: activeEmp.status === "Đã nghỉ việc" ? "#d32f2f" : "#4caf50", marginLeft: 0 }]} />
                        <Text style={{ fontSize: 13, color: activeEmp.status === "Đã nghỉ việc" ? "#d32f2f" : "#4caf50", marginLeft: 6, fontWeight: 'bold' }}>{activeEmp.status}</Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={{ alignSelf: 'flex-start', marginTop: 15, padding: 8, backgroundColor: '#f1e6da', borderRadius: 8 }}
                      onPress={handleEditToggle}
                    >
                      <Text style={{ color: '#8b4513', fontWeight: 'bold', fontSize: 13 }}>Sửa thông tin</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.footerNoteBox}>
                  <FontAwesome5
                    name="info-circle"
                    size={12}
                    color="#8d6e63"
                    style={{ marginRight: 8, marginTop: 2 }}
                  />
                  <Text style={styles.noteText}>
                    Tài khoản này dùng để đăng nhập hệ thống, xếp lịch trực ca
                    nhật trình và chấm công nội bộ cho quán.
                  </Text>
                </View>
              </View>
            )
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff8f0", padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  backBtn: { padding: 5 },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4b3621",
    marginLeft: 15,
    letterSpacing: 0.5,
  },

  mainLayout: { flex: 1, flexDirection: "row", marginTop: 10, minHeight: 600 },

  leftColumn: {
    flex: 4,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1e6da",
    padding: 15,
    marginRight: 15,
    display: "flex",
  },
  columnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f5ece3",
    paddingBottom: 10,
  },
  columnTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#8d6e63",
    letterSpacing: 0.5,
  },
  addStaffToggleBtn: {
    flexDirection: "row",
    backgroundColor: "#4b3621",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  addStaffToggleText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  listScrollView: { flex: 1 },
  empItemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#fff8f0",
    borderWidth: 1,
    borderColor: "#f5ece3",
  },
  empItemActive: { backgroundColor: "#f5ece3", borderColor: "#4b3621" },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e2d4c5",
  },
  listName: { fontSize: 13, fontWeight: "bold", color: "#4b3621" },
  listRole: { fontSize: 11, color: "#8d6e63", marginTop: 2 },

  rightColumn: { flex: 6, display: "flex" },

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f1e6da",
    elevation: 2,
  },
  profileSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4b3621",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f5ece3",
    paddingBottom: 8,
  },
  badgeRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  roleBadge: {
    backgroundColor: "#8b4513",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  roleBadgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  idSubText: { fontSize: 11, color: "#aaa", marginLeft: 10, fontWeight: "500" },
  infoRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f9f4ee",
  },
  infoLabel: {
    width: "30%",
    fontSize: 13,
    fontWeight: "bold",
    color: "#8d6e63",
  },
  infoValue: { flex: 1, fontSize: 13, color: "#4b3621", fontWeight: "500" },
  footerNoteBox: {
    flexDirection: "row",
    backgroundColor: "#fff8f0",
    padding: 12,
    borderRadius: 10,
    marginTop: 25,
    borderWidth: 1,
    borderColor: "#f5ece3",
  },
  editInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
    paddingVertical: 2,
    fontSize: 13,
    color: "#4b3621",
    fontWeight: "bold",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: "#8d6e63",
    lineHeight: 18,
    fontStyle: "italic",
  },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f1e6da",
    flex: 1,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4b3621",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f5ece3",
    paddingBottom: 8,
    letterSpacing: 0.5,
  },
  formGroup: { marginBottom: 14 },
  formLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#8d6e63",
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#4b3621",
    backgroundColor: "#fff8f0",
    outlineStyle: "none",
  },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  roleSelectChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fff8f0",
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  roleSelectChipActive: { backgroundColor: "#4b3621", borderColor: "#4b3621" },
  roleSelectText: { fontSize: 12, color: "#4b3621", fontWeight: "bold" },
  submitCreateBtn: {
    flexDirection: "row",
    backgroundColor: "#4b3621",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  submitCreateText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});
