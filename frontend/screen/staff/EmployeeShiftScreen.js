import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  RefreshControl,
  ScrollView,
  TextInput,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import {
  cancelShift,
  fetchAvailableShifts,
  fetchMyShifts,
  registerShift,
} from "../../redux/employeeShiftSlice";
import { FontAwesome5 } from "@expo/vector-icons";
import api from "../../redux/api";


export default function EmployeeShiftScreen({ navigation }) {
  const dispatch = useDispatch();

  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [tab, setTab] = useState("available"); // "available" (Đăng ký ca) hoặc "mine" (Ca của tôi)
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateInputStr, setDateInputStr] = useState(getLocalDateString(new Date()));
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [lastLoadedTime, setLastLoadedTime] = useState(0);

  const lastLoadedTimeRef = useRef(lastLoadedTime);
  useEffect(() => {
    lastLoadedTimeRef.current = lastLoadedTime;
  }, [lastLoadedTime]);

  const { availableShifts, myShifts, isLoading, error, message } = useSelector(
    (state) => state.employeeShift,
  );

  const [refreshing, setRefreshing] = useState(false);

  const isWeb = Platform.OS === "web";

  const formatDateDisplay = (dateStr) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatDateDisplayLarge = (dateStr) => {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const dayName = days[date.getDay()];
    return `${dayName}, ${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const handlePrevDay = () => {
    const parts = dateInputStr.split("-");
    let currentDate = new Date();
    if (parts.length === 3) {
      currentDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    currentDate.setDate(currentDate.getDate() - 1);
    const prevDateStr = getLocalDateString(currentDate);
    setSelectedDate(currentDate);
    setDateInputStr(prevDateStr);
  };

  const handleNextDay = () => {
    const parts = dateInputStr.split("-");
    let currentDate = new Date();
    if (parts.length === 3) {
      currentDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDateStr = getLocalDateString(currentDate);
    setSelectedDate(currentDate);
    setDateInputStr(nextDateStr);
  };

  const handleDateChangeWithConfirmation = (newDateStr) => {
    if (!newDateStr) return;
    if (Platform.OS === "web") {
      const confirmChange = window.confirm(`Bạn có muốn chuyển sang xem lịch ngày ${formatDateDisplay(newDateStr)} không?`);
      if (confirmChange) {
        const parts = newDateStr.split("-");
        let newDate = new Date();
        if (parts.length === 3) {
          newDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
          newDate = new Date(newDateStr);
        }
        setSelectedDate(newDate);
        setDateInputStr(newDateStr);
      }
      return;
    }
    Alert.alert(
      "Xác nhận",
      `Bạn có muốn chuyển sang xem lịch ngày ${formatDateDisplay(newDateStr)} không?`,
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Chuyển ngày",
          onPress: () => {
            const parts = newDateStr.split("-");
            let newDate = new Date();
            if (parts.length === 3) {
              newDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            } else {
              newDate = new Date(newDateStr);
            }
            setSelectedDate(newDate);
            setDateInputStr(newDateStr);
          },
        },
      ]
    );
  };

  const handleOpenDatePicker = () => {
    if (!isWeb) {
      Alert.prompt(
        "Chọn ngày",
        "Nhập ngày muốn chuyển (YYYY-MM-DD):",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Đồng ý",
            onPress: (val) => {
              if (val && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
                 handleDateChangeWithConfirmation(val.trim());
              } else {
                 Alert.alert("Thông báo", "Ngày nhập không đúng định dạng YYYY-MM-DD");
              }
            }
          }
        ],
        "plain-text",
        dateInputStr
      );
    }
  };

  // Khung giờ và icon mặc định của 3 ca làm việc
  const shiftConfigs = [
    {
      tenCa: "Ca Sáng",
      time: "07:00 - 12:00",
      icon: "sun",
      iconColor: "#FBC02D",
      headerBg: "#FFFDE7",
    },
    {
      tenCa: "Ca Chiều",
      time: "12:00 - 17:00",
      icon: "cloud-sun",
      iconColor: "#F57C00",
      headerBg: "#FFF3E0",
    },
    {
      tenCa: "Ca Tối",
      time: "17:00 - 22:00",
      icon: "moon",
      iconColor: "#7B1FA2",
      headerBg: "#F3E5F5",
    },
  ];

  const loadDataAndResetBadge = async () => {
    dispatch(fetchAvailableShifts());
    dispatch(fetchMyShifts());
    try {
      const res = await api.get("/check-updates");
      setLastLoadedTime(res.data.shiftTime);
      setHasNewUpdates(false);
    } catch (err) {
      console.log("Error checking updates:", err);
    }
  };

  const handleManualReload = () => {
    loadDataAndResetBadge();
  };

  // Fetch dữ liệu mỗi khi người dùng quay lại màn hình này và check cập nhật mỗi 5 giây
  useFocusEffect(
    useCallback(() => {
      loadDataAndResetBadge();

      const interval = setInterval(async () => {
        try {
          const res = await api.get("/check-updates");
          if (res.data.shiftTime > lastLoadedTimeRef.current) {
            setHasNewUpdates(true);
          }
        } catch (err) {
          console.log("Error checking updates:", err);
        }
      }, 5000);

      return () => clearInterval(interval);
    }, [dispatch])
  );

  useEffect(() => {
    if (error) {
      Alert.alert("Lỗi", error);
    }
  }, [error]);

  useEffect(() => {
    if (message) {
      Alert.alert("Thông báo", message);
    }
  }, [message]);

  const reloadData = async () => {
    setRefreshing(true);
    await loadDataAndResetBadge();
    setRefreshing(false);
  };

  const handleRegister = async (maCa) => {
    const result = await dispatch(registerShift(maCa));

    if (registerShift.fulfilled.match(result)) {
      reloadData();
    }
  };

  const handleCancel = async (maCa) => {
    if (Platform.OS === "web") {
      const confirmCancel = window.confirm("Bạn có chắc muốn hủy đăng ký ca này không?");
      if (confirmCancel) {
        const result = await dispatch(cancelShift(maCa));
        if (cancelShift.fulfilled.match(result)) {
          reloadData();
        }
      }
      return;
    }
    Alert.alert("Xác nhận", "Bạn có chắc muốn hủy đăng ký ca này không?", [
      { text: "Không", style: "cancel" },
      {
        text: "Hủy ca",
        style: "destructive",
        onPress: async () => {
          const result = await dispatch(cancelShift(maCa));

          if (cancelShift.fulfilled.match(result)) {
            reloadData();
          }
        },
      },
    ]);
  };

  // Hàm so sánh 2 ngày có cùng ngày/tháng/năm hay không (an toàn múi giờ)
  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };



  // Hợp nhất dữ liệu và trả về đúng 3 ca làm việc cho ngày được chọn
  const getShiftsForSelectedDate = () => {
    return shiftConfigs.map((config) => {
      // 1. Kiểm tra xem ca này nhân viên đã đăng ký chưa
      const myShift = myShifts.find(
        (s) => isSameDay(s.ngayLam, selectedDate) && s.tenCa === config.tenCa
      );
      if (myShift) {
        return {
          ...myShift,
          ...config,
          type: "mine", // Ca của tôi
        };
      }

      // 2. Kiểm tra xem ca này có trống để đăng ký không
      const availableShift = availableShifts.find(
        (s) => isSameDay(s.ngayLam, selectedDate) && s.tenCa === config.tenCa
      );
      if (availableShift) {
        return {
          ...availableShift,
          ...config,
          type: "available", // Ca trống
        };
      }

      // 3. Không có sẵn (đã có người khác đăng ký hoặc chưa mở)
      return {
        maCa: null,
        tenCa: config.tenCa,
        ngayLam: selectedDate,
        trangThai: "Không khả dụng",
        ghiChu: "Ca làm này hiện đã có người đăng ký hoặc chưa được mở.",
        ...config,
        type: "unavailable",
        soNguoiDaDangKy: 5,
      };
    });
  };

  // Render card ca làm việc trên màn hình Đăng ký
  const renderShiftCard = (item) => {
    const isMine = item.type === "mine";
    const isAvailable = item.type === "available";
    const isUnavailable = item.type === "unavailable";

    return (
      <View key={item.tenCa} style={[styles.card, isUnavailable && styles.cardUnavailable]}>
        <View style={[styles.cardHeader, { backgroundColor: item.headerBg }]}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.shiftIconBox, { backgroundColor: item.iconColor }]}>
              <FontAwesome5 name={item.icon} size={14} color="#fff" />
            </View>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <Text style={styles.shiftName}>{item.tenCa}</Text>
                {(item.soNguoiDaDangKy ?? 0) < 3 && (
                  <View style={styles.warningBadge}>
                    <FontAwesome5 name="exclamation-circle" size={9} color="#d84315" />
                    <Text style={styles.warningBadgeText}>Thiếu người ({(item.soNguoiDaDangKy ?? 0)}/3)</Text>
                  </View>
                )}
              </View>
              <Text style={styles.shiftTime}>{item.time}</Text>
            </View>
          </View>
          <View style={styles.statusBox}>
            <Text
              style={[
                styles.statusText,
                isMine && (item.trangThai === "Chờ duyệt" ? styles.statusPending : styles.statusApproved),
                isAvailable && styles.statusAvailable,
                isUnavailable && styles.statusUnavailableText,
              ]}
            >
              {isAvailable ? "Còn trống" : (isMine ? item.trangThai : "Đã đầy / Chưa mở")}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.text}>
            <FontAwesome5 name="calendar-day" size={12} color="#8d6e63" style={{ marginRight: 6 }} />
            {" "}Ngày làm: {formatDate(item.ngayLam)}
          </Text>
          {!isUnavailable && (
            <>
              <Text style={styles.text}>
                <FontAwesome5 name="clock" size={12} color="#8d6e63" style={{ marginRight: 6 }} />
                {" "}Bắt đầu: {formatDateTime(item.gioBatDau)}
              </Text>
              <Text style={styles.text}>
                <FontAwesome5 name="hourglass-end" size={12} color="#8d6e63" style={{ marginRight: 6 }} />
                {" "}Kết thúc: {formatDateTime(item.gioKetThuc)}
              </Text>
            </>
          )}
          <Text style={styles.note}>
            <FontAwesome5 name="info-circle" size={12} color="#8d6e63" style={{ marginRight: 6 }} />
            {" "}Ghi chú: {item.ghiChu || "Không có ghi chú"}
          </Text>

          {isMine ? (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                item.coTheHuy === 1 ? styles.cancelBtn : styles.disabledBtn,
              ]}
              disabled={item.coTheHuy !== 1}
              onPress={() => handleCancel(item.maCa)}
            >
              <FontAwesome5 name="times-circle" size={14} color="#fff" />
              <Text style={styles.actionText}>
                {item.coTheHuy === 1 ? "Hủy đăng ký" : "Không thể hủy"}
              </Text>
            </TouchableOpacity>
          ) : isAvailable ? (
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => handleRegister(item.maCa)}
            >
              <FontAwesome5 name="check-circle" size={14} color="#fff" />
              <Text style={styles.actionText}>Đăng ký ca</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.actionBtn, styles.disabledBtn]}>
              <FontAwesome5 name="ban" size={14} color="#fff" />
              <Text style={styles.actionText}>Không khả dụng</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render ca làm việc cho tab "Ca của tôi" (danh sách dọc toàn bộ)
  const renderMyShiftItem = ({ item }) => {
    const config = shiftConfigs.find((c) => c.tenCa === item.tenCa) || {
      time: "00:00 - 00:00",
      icon: "calendar-alt",
      iconColor: "#8d6e63",
      headerBg: "#f5ece3",
    };

    const isPending = item.trangThai === "Chờ duyệt";

    return (
      <View style={styles.card}>
        <View style={[styles.cardHeader, { backgroundColor: config.headerBg }]}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.shiftIconBox, { backgroundColor: config.iconColor }]}>
              <FontAwesome5 name={config.icon} size={14} color="#fff" />
            </View>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <Text style={styles.shiftName}>{item.tenCa}</Text>
                {(item.soNguoiDaDangKy ?? 0) < 3 && (
                  <View style={styles.warningBadge}>
                    <FontAwesome5 name="exclamation-circle" size={9} color="#d84315" />
                    <Text style={styles.warningBadgeText}>Thiếu người ({(item.soNguoiDaDangKy ?? 0)}/3)</Text>
                  </View>
                )}
              </View>
              <Text style={styles.shiftTime}>{config.time}</Text>
            </View>
          </View>
          <View style={styles.statusBox}>
            <Text
              style={[
                styles.statusText,
                isPending ? styles.statusPending : styles.statusApproved,
              ]}
            >
              {item.trangThai}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.text}>
            <FontAwesome5 name="calendar-day" size={12} color="#8d6e63" /> Ngày làm: {formatDate(item.ngayLam)}
          </Text>
          <Text style={styles.text}>
            <FontAwesome5 name="clock" size={12} color="#8d6e63" /> Bắt đầu: {formatDateTime(item.gioBatDau)}
          </Text>
          <Text style={styles.text}>
            <FontAwesome5 name="hourglass-end" size={12} color="#8d6e63" /> Kết thúc: {formatDateTime(item.gioKetThuc)}
          </Text>
          <Text style={styles.note}>
            <FontAwesome5 name="info-circle" size={12} color="#8d6e63" /> Ghi chú: {item.ghiChu || "Không có ghi chú"}
          </Text>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              item.coTheHuy === 1 ? styles.cancelBtn : styles.disabledBtn,
            ]}
            disabled={item.coTheHuy !== 1}
            onPress={() => handleCancel(item.maCa)}
          >
            <FontAwesome5 name="times-circle" size={14} color="#fff" />
            <Text style={styles.actionText}>
              {item.coTheHuy === 1 ? "Hủy đăng ký" : "Không thể hủy"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading && availableShifts.length === 0 && myShifts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b3621" />
        <Text style={styles.loadingText}>Đang tải danh sách ca...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.headerBox, { justifyContent: "space-between", alignItems: "center", gap: 10 }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => navigation.navigate("EmployeeDashboardScreen")}
            style={styles.backBtn}
          >
            <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
          </TouchableOpacity>
          <Text style={styles.title}>Quản lý ca làm</Text>
          {hasNewUpdates && (
            <View style={{
              backgroundColor: "#ffe0b2",
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 4,
              marginLeft: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 4
            }}>
              <FontAwesome5 name="exclamation-circle" size={10} color="#e65100" />
              <Text style={{ fontSize: 9, fontWeight: "bold", color: "#e65100" }}>Mới</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.tabBox}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "available" && styles.tabActive]}
          onPress={() => setTab("available")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "available" && styles.tabTextActive,
            ]}
          >
            Đăng ký ca
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, tab === "mine" && styles.tabActive]}
          onPress={() => setTab("mine")}
        >
          <Text
            style={[styles.tabText, tab === "mine" && styles.tabTextActive]}
          >
            Ca của tôi
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Selector Row - Moved outside to be visible for both tabs */}
      <View style={styles.dateSelectorContainer}>
        <TouchableOpacity onPress={handlePrevDay} style={styles.arrowBtn} activeOpacity={0.7}>
          <FontAwesome5 name="chevron-left" size={18} color="#4b3621" />
        </TouchableOpacity>

        <View style={styles.dateCenterWrapper}>
          <TouchableOpacity onPress={handleOpenDatePicker} style={styles.dateTextTrigger} activeOpacity={0.7}>
            <FontAwesome5 name="calendar-alt" size={18} color="#8d6e63" style={styles.centerCalendarIcon} />
            <Text style={styles.dateTextLarge}>
              {formatDateDisplayLarge(dateInputStr)}
            </Text>
          </TouchableOpacity>

          {isWeb ? (
            <input
              type="date"
              value={dateInputStr}
              onChange={(e) => handleDateChangeWithConfirmation(e.target.value)}
              style={{
                position: "absolute",
                opacity: 0,
                width: "100%",
                height: "100%",
                top: 0,
                left: 0,
                cursor: "pointer",
              }}
            />
          ) : null}
        </View>

        <TouchableOpacity onPress={handleNextDay} style={styles.arrowBtn} activeOpacity={0.7}>
          <FontAwesome5 name="chevron-right" size={18} color="#4b3621" />
        </TouchableOpacity>
      </View>

      {tab === "available" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={reloadData}
              tintColor="#4b3621"
              colors={["#4b3621"]}
            />
          }
        >
          {/* 3 Ca làm việc */}
          <View style={styles.shiftsContainer}>
            <Text style={styles.sectionTitle}>
              Lịch trực ngày {formatDate(selectedDate)}
            </Text>
            {getShiftsForSelectedDate().map((item) => renderShiftCard(item))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={myShifts.filter((s) => isSameDay(s.ngayLam, selectedDate))}
          keyExtractor={(item) => item.maCa.toString()}
          renderItem={renderMyShiftItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={reloadData}
              tintColor="#4b3621"
              colors={["#4b3621"]}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Bạn không có ca làm nào trong ngày này</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
};

const formatDateTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN");
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f1e9",
    padding: 16,
    height: Platform.OS === "web" ? "100vh" : "100%",
    maxHeight: Platform.OS === "web" ? "100vh" : "100%",
    overflow: "hidden",
  },

  headerBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5ece3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4b3621",
  },

  tabBox: {
    flexDirection: "row",
    backgroundColor: "#eadfd3",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },

  tabBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  tabActive: {
    backgroundColor: "#4b3621",
  },

  tabText: {
    color: "#4b3621",
    fontWeight: "bold",
  },

  tabTextActive: {
    color: "#fff",
  },

  scrollContent: {
    paddingBottom: 40,
  },

  listContent: {
    paddingBottom: 120,
  },

  // Date Selector Premium Style
  dateSelectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 16,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5ece3",
    justifyContent: "center",
    alignItems: "center",
  },
  dateCenterWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
  },
  dateTextTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    width: "100%",
  },
  centerCalendarIcon: {
    marginRight: 10,
  },
  dateTextLarge: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4b3621",
    textAlign: "center",
  },

  // Shift List
  shiftsContainer: {
    marginTop: 8,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#8d6e63",
    marginBottom: 10,
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eadfd3",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  cardUnavailable: {
    borderColor: "#e0e0e0",
    backgroundColor: "#fafafa",
    opacity: 0.85,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1e6da",
  },

  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  shiftIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  shiftName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#4b3621",
  },

  shiftTime: {
    fontSize: 11,
    color: "#8d6e63",
    marginTop: 1,
  },

  statusBox: {
    alignItems: "flex-end",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "bold",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },

  statusPending: {
    backgroundColor: "#FFF3E0",
    color: "#E65100",
  },

  statusApproved: {
    backgroundColor: "#E8F5E9",
    color: "#1B5E20",
  },

  statusAvailable: {
    backgroundColor: "#E0F2F1",
    color: "#004D40",
  },

  statusUnavailableText: {
    backgroundColor: "#EEEEEE",
    color: "#616161",
  },

  cardBody: {
    padding: 16,
  },

  text: {
    fontSize: 13,
    color: "#6d4c41",
    marginBottom: 6,
    lineHeight: 18,
  },

  note: {
    fontSize: 13,
    color: "#4b3621",
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },

  registerBtn: {
    flexDirection: "row",
    backgroundColor: "#2e7d32",
    padding: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  cancelBtn: {
    backgroundColor: "#d32f2f",
  },

  disabledBtn: {
    backgroundColor: "#bdbdbd",
  },

  actionBtn: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  actionText: {
    color: "#fff",
    fontWeight: "bold",
  },

  emptyText: {
    textAlign: "center",
    color: "#8d6e63",
    marginTop: 60,
    fontSize: 15,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f1e9",
  },

  loadingText: {
    color: "#4b3621",
    marginTop: 12,
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    borderColor: "#FFCCBC",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  warningBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#d84315",
  },
  reloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5ece3",
    justifyContent: "center",
    alignItems: "center",
  },
  reloadBtnHighlight: {
    width: "auto",
    paddingHorizontal: 12,
    flexDirection: "row",
    backgroundColor: "#e65100",
    gap: 6,
  },
  reloadBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
});
