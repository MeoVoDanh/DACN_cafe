import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Modal,
  Platform,
  StatusBar,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchInvoices } from "../../redux/invoiceSlice";
import { FontAwesome5 } from "@expo/vector-icons";
import api from "../../redux/api";

const getLocalDateString = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  const ss = date.getSeconds().toString().padStart(2, "0");
  
  if (hh === "00" && mm === "00" && ss === "00") {
    return `${d}/${m}/${y}`;
  }
  
  return `${hh}:${mm}:${ss} - ${d}/${m}/${y}`;
};

export default function RevenueScreen({ navigation }) {
  const dispatch = useDispatch();
  const { invoices, isLoading } = useSelector((state) => state.invoice);

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const [ngayLam, setNgayLam] = useState(todayStr);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [lastLoadedTime, setLastLoadedTime] = useState(0);

  const lastLoadedTimeRef = useRef(lastLoadedTime);
  useEffect(() => {
    lastLoadedTimeRef.current = lastLoadedTime;
  }, [lastLoadedTime]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Accordion control for shifts
  const [expandedShift, setExpandedShift] = useState("Ca Sáng"); // Mở sẵn Ca Sáng cho trực quan
  const [showCalendar, setShowCalendar] = useState(false);

  // Invoice detail states
  const [showDetails, setShowDetails] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetails, setInvoiceDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadDataAndResetBadge = async () => {
    dispatch(fetchInvoices());
    try {
      const res = await api.get("/check-updates");
      setLastLoadedTime(res.data.revenueTime);
      setHasNewUpdates(false);
    } catch (err) {
      console.log("Error checking updates:", err);
    }
  };

  const handleManualReload = () => {
    loadDataAndResetBadge();
  };

  // Fetch invoices when screen is focused and poll check-updates every 5 seconds
  useFocusEffect(
    useCallback(() => {
      loadDataAndResetBadge();

      const interval = setInterval(async () => {
        try {
          const res = await api.get("/check-updates");
          if (res.data.revenueTime > lastLoadedTimeRef.current) {
            setHasNewUpdates(true);
          }
        } catch (err) {
          console.log("Error checking updates:", err);
        }
      }, 5000);

      return () => clearInterval(interval);
    }, [dispatch])
  );

  const BASE_URL = api.defaults.baseURL.replace("/api", "");

  // Sync calendar month/year when ngayLam changes
  useEffect(() => {
    if (ngayLam) {
      const [y, m] = ngayLam.split("-");
      setSelectedMonth(parseInt(m, 10));
      setSelectedYear(parseInt(y, 10));
    }
  }, [ngayLam]);

  // Dynamic Date Navigation
  const handlePrevDay = () => {
    const parts = ngayLam.split("-");
    let currentDate = new Date();
    if (parts.length === 3) {
      currentDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    currentDate.setDate(currentDate.getDate() - 1);
    setNgayLam(getLocalDateString(currentDate));
  };

  const handleNextDay = () => {
    const parts = ngayLam.split("-");
    let currentDate = new Date();
    if (parts.length === 3) {
      currentDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    currentDate.setDate(currentDate.getDate() + 1);
    setNgayLam(getLocalDateString(currentDate));
  };

  const formatDateDisplayLarge = (dateStr) => {
    if (!dateStr) return "";
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

  // Filter invoices for the chosen date
  const dailyInvoices = useMemo(() => {
    return invoices.filter((item) => {
      const d = new Date(item.createdAt || item.ngaylap);
      return getLocalDateString(d) === ngayLam;
    });
  }, [invoices, ngayLam]);

  // Group invoices into shifts based on creation hour
  const shiftGroupedData = useMemo(() => {
    const sang = [];
    const chieu = [];
    const toi = [];
    const ngoaiCa = [];

    dailyInvoices.forEach((item) => {
      const d = new Date(item.createdAt || item.ngaylap);
      const hour = d.getHours();

      if (hour >= 7 && hour < 12) {
        sang.push(item);
      } else if (hour >= 12 && hour < 17) {
        chieu.push(item);
      } else if (hour >= 17 && hour < 22) {
        toi.push(item);
      } else {
        ngoaiCa.push(item);
      }
    });

    const getStats = (list) => {
      const paid = list.filter((item) => item.trangthaithanhtoan === "Đã thanh toán");
      const revenue = paid.reduce((sum, item) => sum + Number(item.tongtien || 0), 0);
      
      const cashRevenue = paid
        .filter((item) => !item.phuongThuc || item.phuongThuc === "TienMat")
        .reduce((sum, item) => sum + Number(item.tongtien || 0), 0);

      const transferRevenue = paid
        .filter((item) => item.phuongThuc === "ChuyenKhoan")
        .reduce((sum, item) => sum + Number(item.tongtien || 0), 0);

      return {
        totalOrders: list.length,
        paidOrders: paid.length,
        revenue,
        cashRevenue,
        transferRevenue,
      };
    };

    return {
      sang: { list: sang, stats: getStats(sang) },
      chieu: { list: chieu, stats: getStats(chieu) },
      toi: { list: toi, stats: getStats(toi) },
      ngoaiCa: { list: ngoaiCa, stats: getStats(ngoaiCa) },
    };
  }, [dailyInvoices]);

  // Daily totals
  const dailyStats = useMemo(() => {
    const totalOrders = dailyInvoices.length;
    const paidOrders = dailyInvoices.filter((item) => item.trangthaithanhtoan === "Đã thanh toán");
    const totalRevenue = paidOrders.reduce((sum, item) => sum + Number(item.tongtien || 0), 0);
    
    const cashRevenue = paidOrders
      .filter((item) => !item.phuongThuc || item.phuongThuc === "TienMat")
      .reduce((sum, item) => sum + Number(item.tongtien || 0), 0);

    const transferRevenue = paidOrders
      .filter((item) => item.phuongThuc === "ChuyenKhoan")
      .reduce((sum, item) => sum + Number(item.tongtien || 0), 0);

    return {
      totalOrders,
      totalRevenue,
      cashRevenue,
      transferRevenue,
    };
  }, [dailyInvoices]);

  // Set of dates with orders in the current month to show dots on Calendar
  const daysWithOrders = useMemo(() => {
    const dates = new Set();
    invoices.forEach((item) => {
      const d = new Date(item.createdAt || item.ngaylap);
      if (d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear) {
        dates.add(getLocalDateString(d));
      }
    });
    return dates;
  }, [invoices, selectedMonth, selectedYear]);

  // Calendar days grid calculation
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    const daysArray = [];
    
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push({ id: `empty-${i}`, isPadding: true });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      daysArray.push({
        id: `day-${day}`,
        dayNum: day,
        dateString,
        isPadding: false,
      });
    }
    return daysArray;
  }, [selectedMonth, selectedYear]);

  const toggleExpandShift = (shiftName) => {
    setExpandedShift(expandedShift === shiftName ? null : shiftName);
  };

  const handleViewInvoiceDetails = async (invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceDetails([]);
    setLoadingDetails(true);
    setShowDetails(true);
    
    try {
      const response = await api.get(`/hoadon/${invoice.maHoaDon}`);
      if (response.data && response.data.chiTiet) {
        setInvoiceDetails(response.data.chiTiet);
      }
    } catch (error) {
      console.error("Lỗi lấy chi tiết hóa đơn:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const isWeb = Platform.OS === "web";

  // Shift card render helper
  const renderShiftCard = (title, time, icon, data, bgColor, iconBg, shiftKey) => {
    const isExpanded = expandedShift === shiftKey;
    const { list, stats } = data;

    return (
      <View style={styles.shiftCard}>
        <TouchableOpacity
          style={[styles.shiftCardHeader, { backgroundColor: bgColor }]}
          onPress={() => toggleExpandShift(shiftKey)}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <View style={[styles.shiftIconBox, { backgroundColor: iconBg }]}>
              <FontAwesome5 name={icon} size={15} color="#fff" />
            </View>
            <View>
              <Text style={styles.shiftCardTitle}>{title}</Text>
              <Text style={styles.shiftCardTime}>{time}</Text>
            </View>
          </View>
          
          <View style={{ alignItems: "flex-end", marginRight: 15 }}>
            <Text style={styles.shiftRevenueText}>
              {stats.revenue.toLocaleString("vi-VN")}đ
            </Text>
            <Text style={styles.shiftOrdersCountText}>
              💵{stats.cashRevenue.toLocaleString("vi-VN")} | 💳{stats.transferRevenue.toLocaleString("vi-VN")}
            </Text>
          </View>

          <FontAwesome5
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={12}
            color="#4b3621"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.shiftCardBody}>
            {list.length === 0 ? (
              <View style={styles.shiftEmptyContainer}>
                <FontAwesome5 name="store-slash" size={24} color="#d7ccc8" style={{ marginBottom: 6 }} />
                <Text style={styles.shiftEmptyText}>Chưa phát sinh hóa đơn nào trong ca này</Text>
              </View>
            ) : (
              list.map((item) => {
                const isPaid = item.trangthaithanhtoan === "Đã thanh toán";
                return (
                  <TouchableOpacity
                    key={item.maHoaDon}
                    style={styles.shiftInvoiceRow}
                    onPress={() => handleViewInvoiceDetails(item)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={styles.shiftInvoiceTitle}>Đơn #{item.maHoaDon}</Text>
                        <Text style={styles.shiftInvoiceTime}>
                          {formatDate(item.createdAt || item.ngaylap).split(" - ")[0]}
                        </Text>
                      </View>
                      <Text style={styles.shiftInvoiceStaff}>
                        <FontAwesome5 name="user-tie" size={10} color="#8d6e63" /> Lập bởi: {item.HoTen || "Không rõ"}
                      </Text>
                    </View>

                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <Text style={styles.shiftInvoicePrice}>
                        {Number(item.tongtien || 0).toLocaleString("vi-VN")}đ
                      </Text>
                      <View style={[
                        styles.miniBadge, 
                        isPaid ? styles.paidBadge : styles.unpaidBadge
                      ]}>
                        <Text style={[styles.miniBadgeText, isPaid ? styles.paidText : styles.unpaidText]}>
                          {isPaid ? (item.phuongThuc === "ChuyenKhoan" ? "💳 CK" : "💵 TM") : "Chưa trả"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("DashboardScreen")} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
        </TouchableOpacity>
        <Text style={styles.title}>BÁO CÁO DOANH THU</Text>
        <TouchableOpacity
          onPress={handleManualReload}
          style={[
            styles.refreshBtn,
            hasNewUpdates && styles.reloadBtnHighlight
          ]}
          activeOpacity={0.7}
        >
          <FontAwesome5 
            name="sync-alt" 
            size={14} 
            color={hasNewUpdates ? "#fff" : "#4b3621"} 
          />
          {hasNewUpdates && (
            <Text style={styles.reloadBtnText}>Có cập nhật mới</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.mainContainer} showsVerticalScrollIndicator={false}>
        {/* PREMIUM DATE SELECTOR */}
        <Text style={styles.sectionTitle}>Chọn ngày làm việc</Text>
        <View style={styles.dateSelectorContainer}>
          <TouchableOpacity onPress={handlePrevDay} style={styles.arrowBtn} activeOpacity={0.7}>
            <FontAwesome5 name="chevron-left" size={18} color="#4b3621" />
          </TouchableOpacity>

          <View style={styles.dateCenterWrapper}>
            <TouchableOpacity onPress={() => setShowCalendar(true)} style={styles.dateTextTrigger} activeOpacity={0.7}>
              <FontAwesome5 name="calendar-day" size={18} color="#8d6e63" style={styles.centerCalendarIcon} />
              <Text style={styles.dateTextLarge}>
                {formatDateDisplayLarge(ngayLam)}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleNextDay} style={styles.arrowBtn} activeOpacity={0.7}>
            <FontAwesome5 name="chevron-right" size={18} color="#4b3621" />
          </TouchableOpacity>
        </View>

        {/* DAILY SUMMARY CARD */}
        <View style={styles.monthSummaryCard}>
          <View style={styles.summaryHeader}>
            <FontAwesome5 name="chart-line" size={16} color="#c9a66b" />
            <Text style={styles.summaryTitle}>TỔNG QUAN NGÀY {ngayLam.split("-").reverse().join("/")}</Text>
          </View>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryVal}>
                {dailyStats.totalRevenue.toLocaleString("vi-VN")}đ
              </Text>
              <Text style={styles.summaryLbl}>Tổng doanh thu ngày</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryVal}>{dailyStats.totalOrders}</Text>
              <Text style={styles.summaryLbl}>Tổng đơn đã bán</Text>
            </View>
          </View>

          <View style={styles.summaryMethodDivider} />

          <View style={styles.summaryPaymentMethodsRow}>
            <Text style={styles.summaryPaymentText}>
              💵 Tiền mặt: <Text style={{fontWeight: "bold", color: "#fff"}}>{dailyStats.cashRevenue.toLocaleString("vi-VN")}đ</Text>
            </Text>
            <View style={styles.summaryPaymentVerticalDivider} />
            <Text style={styles.summaryPaymentText}>
              💳 Chuyển khoản: <Text style={{fontWeight: "bold", color: "#fff"}}>{dailyStats.transferRevenue.toLocaleString("vi-VN")}đ</Text>
            </Text>
          </View>
        </View>

        {/* SHIFTS BREAKDOWN SECTION */}
        <Text style={styles.sectionTitle}>Báo cáo chi tiết theo Ca</Text>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4b3621" />
            <Text style={styles.loaderText}>Đang tải dữ liệu doanh thu...</Text>
          </View>
        ) : (
          <View style={styles.shiftsListContainer}>
            {renderShiftCard(
              "Ca Sáng",
              "07:00 - 12:00 (5 tiếng)",
              "sun",
              shiftGroupedData.sang,
              "#FFF9C4",
              "#FBC02D",
              "Ca Sáng"
            )}
            
            {renderShiftCard(
              "Ca Chiều",
              "12:00 - 17:00 (5 tiếng)",
              "cloud-sun",
              shiftGroupedData.chieu,
              "#FFE0B2",
              "#F57C00",
              "Ca Chiều"
            )}
            
            {renderShiftCard(
              "Ca Tối",
              "17:00 - 22:00 (5 tiếng)",
              "moon",
              shiftGroupedData.toi,
              "#E1BEE7",
              "#7B1FA2",
              "Ca Tối"
            )}

            {/* Chỉ hiện Ngoài Ca khi có đơn ngoài ca để tránh rác giao diện */}
            {shiftGroupedData.ngoaiCa.list.length > 0 && renderShiftCard(
              "Ngoài ca làm việc",
              "Các khung giờ còn lại",
              "clock",
              shiftGroupedData.ngoaiCa,
              "#ECEFF1",
              "#607D8B",
              "Ngoài Ca"
            )}
          </View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* CALENDAR MODAL */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalContainer}>
            {/* Modal Header */}
            <View style={[styles.calendarHeader, { justifyContent: "flex-start" }]}>
              <TouchableOpacity onPress={() => setShowCalendar(false)} style={{ marginRight: 12, padding: 4 }}>
                <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>
                Tháng {selectedMonth} / {selectedYear}
              </Text>
            </View>

            {/* Week days header */}
            <View style={styles.weekDaysRow}>
              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day, idx) => (
                <Text key={day} style={[styles.weekDayText, idx === 0 && { color: "#d32f2f" }]}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Days grid */}
            <View style={styles.daysGrid}>
              {calendarDays.map((item) => {
                if (item.isPadding) {
                  return <View key={item.id} style={styles.dayCellEmpty} />;
                }

                const isSelected = ngayLam === item.dateString;
                const hasOrders = daysWithOrders.has(item.dateString);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellActive
                    ]}
                    onPress={() => {
                      setNgayLam(item.dateString);
                      setShowCalendar(false);
                    }}
                  >
                    <Text style={[
                      styles.dayNumberText,
                      isSelected && styles.dayNumberTextActive,
                      hasOrders && !isSelected && { fontWeight: "bold", color: "#4b3621" }
                    ]}>
                      {item.dayNum}
                    </Text>

                    {hasOrders && (
                      <View style={[
                        styles.orderDot,
                        isSelected ? styles.orderDotActive : styles.orderDotInactive
                      ]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Legend / Month selectors in modal */}
            <View style={styles.calendarFooter}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={styles.legendDot} />
                <Text style={styles.legendText}>Ngày có đơn hàng</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity 
                  style={styles.monthNavBtn}
                  onPress={() => {
                    if (selectedMonth === 1) {
                      setSelectedMonth(12);
                      setSelectedYear(selectedYear - 1);
                    } else {
                      setSelectedMonth(selectedMonth - 1);
                    }
                  }}
                >
                  <FontAwesome5 name="chevron-left" size={10} color="#4b3621" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.monthNavBtn}
                  onPress={() => {
                    if (selectedMonth === 12) {
                      setSelectedMonth(1);
                      setSelectedYear(selectedYear + 1);
                    } else {
                      setSelectedMonth(selectedMonth + 1);
                    }
                  }}
                >
                  <FontAwesome5 name="chevron-right" size={10} color="#4b3621" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* DETAILED INVOICE DETAILS MODAL */}
      <Modal
        visible={showDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContainer}>
            {/* Header Modal */}
            <View style={[styles.detailsHeader, { justifyContent: "flex-start" }]}>
              <TouchableOpacity onPress={() => setShowDetails(false)} style={{ marginRight: 12, padding: 4 }}>
                <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
              </TouchableOpacity>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={styles.detailsIconCircle}>
                  <FontAwesome5 name="file-invoice" size={18} color="#fff" />
                </View>
                <Text style={styles.detailsTitle}>
                  Chi Tiết Đơn #{selectedInvoice?.maHoaDon}
                </Text>
              </View>
            </View>

            {/* Invoice summary info */}
            <View style={styles.detailsSummaryBox}>
              <Text style={styles.detailsSummaryText}>
                <FontAwesome5 name="user" size={11} color="#8d6e63" /> <Text style={{fontWeight: "bold"}}>Nhân viên lập:</Text> {selectedInvoice?.HoTen || "Không rõ"}
              </Text>
              <Text style={styles.detailsSummaryText}>
                <FontAwesome5 name="calendar-alt" size={11} color="#8d6e63" /> <Text style={{fontWeight: "bold"}}>Thời gian lập:</Text> {formatDate(selectedInvoice?.createdAt || selectedInvoice?.ngaylap)}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                <Text style={[styles.detailsSummaryText, {marginRight: 8}]}><Text style={{fontWeight: "bold"}}>Trạng thái:</Text></Text>
                <View style={[
                  styles.miniBadge, 
                  selectedInvoice?.trangthaithanhtoan === "Đã thanh toán" ? styles.paidBadge : styles.unpaidBadge
                ]}>
                  <Text style={[styles.miniBadgeText, selectedInvoice?.trangthaithanhtoan === "Đã thanh toán" ? styles.paidText : styles.unpaidText]}>
                    {selectedInvoice?.trangthaithanhtoan}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailsDivider} />
            <Text style={styles.detailsListTitle}>DANH SÁCH MÓN ĐÃ BÁN</Text>

            {/* List of items in invoice */}
            {loadingDetails ? (
              <View style={styles.detailsLoader}>
                <ActivityIndicator size="large" color="#4b3621" />
                <Text style={styles.detailsLoaderText}>Đang tải chi tiết đơn hàng...</Text>
              </View>
            ) : invoiceDetails.length === 0 ? (
              <View style={styles.detailsEmptyBox}>
                <FontAwesome5 name="mug-hot" size={30} color="#d7ccc8" />
                <Text style={styles.detailsEmptyText}>Không tìm thấy món ăn nào của hóa đơn này</Text>
              </View>
            ) : (
              <ScrollView style={styles.detailsScroll} showsVerticalScrollIndicator={true}>
                {invoiceDetails.map((drink, idx) => (
                  <View key={`${drink.maDoUong}-${idx}`} style={styles.detailItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailItemName}>{drink.tenDoUong}</Text>
                      {drink.duong && drink.da && (
                        <Text style={{ fontSize: 11, color: "#8d6e63", marginTop: 2 }}>
                          Ghi chú: {drink.duong} đường, {drink.da} đá
                        </Text>
                      )}
                      <Text style={styles.detailItemSub}>
                        Số lượng: <Text style={{ fontWeight: "bold", color: "#4b3621" }}>{drink.soluong}</Text> x {Number(drink.dongia).toLocaleString("vi-VN")}đ
                      </Text>
                    </View>
                    <Text style={styles.detailItemTotal}>
                      {Number(drink.thanhtien).toLocaleString("vi-VN")}đ
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.detailsDivider} />

            {/* Total invoice sum */}
            <View style={styles.detailsTotalRow}>
              <Text style={styles.detailsTotalLabel}>TỔNG CỘNG HÓA ĐƠN</Text>
              <Text style={styles.detailsTotalValue}>
                {Number(selectedInvoice?.tongtien || 0).toLocaleString("vi-VN")}đ
              </Text>
            </View>

            {/* Close button */}
            <TouchableOpacity 
              style={styles.closeDetailsModalBtn} 
              onPress={() => setShowDetails(false)}
            >
              <Text style={styles.closeDetailsModalBtnText}>Đóng cửa sổ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f1e9",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 12 : 0,
    height: Platform.OS === "web" ? "100vh" : "100%",
    maxHeight: Platform.OS === "web" ? "100vh" : "100%",
    overflow: Platform.OS === "web" ? "hidden" : "visible",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eadfd3",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5ece3",
    justifyContent: "center",
    alignItems: "center",
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5ece3",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#4b3621" },
  mainContainer: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8d6e63",
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  // Premium Date Selector styles
  dateSelectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 15,
    fontWeight: "bold",
    color: "#4b3621",
    textAlign: "center",
  },
  monthSummaryCard: {
    backgroundColor: "#4b3621",
    borderRadius: 16,
    padding: 20,
    marginTop: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.15)",
    paddingBottom: 10,
    marginBottom: 14,
  },
  summaryTitle: {
    color: "#c9a66b",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  summaryGrid: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryCol: {
    flex: 1,
    alignItems: "center",
  },
  summaryVal: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  summaryLbl: {
    color: "#d7ccc8",
    fontSize: 11,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  summaryMethodDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginVertical: 12,
  },
  summaryPaymentMethodsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryPaymentText: {
    color: "#d7ccc8",
    fontSize: 12,
    flex: 1,
    textAlign: "center",
  },
  summaryPaymentVerticalDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  // Shifts breakdown styling
  shiftsListContainer: {
    flexDirection: "column",
    gap: 14,
    marginTop: 4,
  },
  shiftCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1e6da",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  shiftCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    justifyContent: "space-between",
  },
  shiftIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  shiftCardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4b3621",
  },
  shiftCardTime: {
    fontSize: 10,
    color: "#8d6e63",
    marginTop: 1,
  },
  shiftRevenueText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2e7d32",
    textAlign: "right",
  },
  shiftOrdersCountText: {
    fontSize: 11,
    color: "#8d6e63",
    marginTop: 1,
    textAlign: "right",
  },
  shiftCardBody: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#f5ece3",
    backgroundColor: "#faf6f0",
  },
  shiftEmptyContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  shiftEmptyText: {
    fontSize: 12,
    color: "#8d6e63",
    fontStyle: "italic",
    textAlign: "center",
  },
  shiftInvoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1e6da",
  },
  shiftInvoiceTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4b3621",
  },
  shiftInvoiceTime: {
    fontSize: 10,
    color: "#8d6e63",
    marginLeft: 6,
  },
  shiftInvoiceStaff: {
    fontSize: 11,
    color: "#8d6e63",
    marginTop: 4,
  },
  shiftInvoicePrice: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#2e7d32",
    textAlign: "right",
  },
  // Badges
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
  },
  paidBadge: {
    backgroundColor: "#e8f5e9",
  },
  paidText: {
    color: "#2e7d32",
  },
  unpaidBadge: {
    backgroundColor: "#ffebee",
  },
  unpaidText: {
    color: "#c62828",
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loaderText: {
    marginTop: 8,
    color: "#8d6e63",
    fontSize: 12,
  },
  // Calendar picker styles inside modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  calendarModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 360,
    padding: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "#eadfd3",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5ece3",
    paddingBottom: 12,
  },
  calendarTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#4b3621",
  },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  weekDayText: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    color: "#8d6e63",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    height: 40,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    position: "relative",
  },
  dayCellActive: {
    backgroundColor: "#4b3621",
  },
  dayNumberText: {
    fontSize: 14,
    color: "#8d6e63",
  },
  dayNumberTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  orderDot: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  orderDotActive: {
    backgroundColor: "#fff",
  },
  orderDotInactive: {
    backgroundColor: "#2e7d32",
  },
  calendarFooter: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f5ece3",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2e7d32",
  },
  legendText: {
    fontSize: 11,
    color: "#8d6e63",
  },
  monthNavBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f5ece3",
    alignItems: "center",
    justifyContent: "center",
  },
  // Detailed bill details modal
  detailsModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 380,
    padding: 24,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: "#eadfd3",
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  detailsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4b3621",
    justifyContent: "center",
    alignItems: "center",
  },
  detailsTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#4b3621",
  },
  closeDetailsBtn: {
    padding: 4,
  },
  detailsSummaryBox: {
    backgroundColor: "#f8f1e9",
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "#eadfd3",
  },
  detailsSummaryText: {
    fontSize: 12,
    color: "#4b3621",
  },
  detailsDivider: {
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#eadfd3",
    marginVertical: 16,
    borderRadius: 1,
  },
  detailsListTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#8d6e63",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  detailsScroll: {
    maxHeight: 180,
  },
  detailItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f5ece3",
  },
  detailItemName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4b3621",
  },
  detailItemSub: {
    fontSize: 12,
    color: "#8d6e63",
    marginTop: 2,
  },
  detailItemTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4b3621",
  },
  detailsTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    marginBottom: 18,
  },
  detailsTotalLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#8d6e63",
  },
  detailsTotalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  closeDetailsModalBtn: {
    backgroundColor: "#4b3621",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  closeDetailsModalBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  detailsLoader: {
    paddingVertical: 30,
    alignItems: "center",
  },
  detailsLoaderText: {
    marginTop: 8,
    color: "#8d6e63",
    fontSize: 12,
  },
  detailsEmptyBox: {
    paddingVertical: 30,
    alignItems: "center",
  },
  detailsEmptyText: {
    marginTop: 8,
    color: "#bbb",
    fontSize: 12,
    textAlign: "center",
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
