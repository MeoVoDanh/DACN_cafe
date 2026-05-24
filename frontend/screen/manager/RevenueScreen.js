import React, { useEffect, useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchInvoices } from "../../redux/invoiceSlice";
import { FontAwesome5 } from "@expo/vector-icons";
import api from "../../redux/api"; // Import api trực tiếp để lấy chi tiết hóa đơn nhanh chóng

const getLocalDateString = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function RevenueScreen({ navigation }) {
  const dispatch = useDispatch();
  const { invoices, isLoading } = useSelector((state) => state.invoice);

  // Khởi tạo bộ lọc mặc định là Tháng hiện tại
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Trạng thái hiển thị Lịch chọn ngày (Calendar Modal)
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeDateFilter, setActiveDateFilter] = useState(null); // Ngày được chọn để lọc (YYYY-MM-DD)

  // Trạng thái hiển thị Chi tiết Hóa đơn (Details Modal)
  const [showDetails, setShowDetails] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null); // Hóa đơn đang chọn xem chi tiết
  const [invoiceDetails, setInvoiceDetails] = useState([]); // Món ăn trong hóa đơn
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    dispatch(fetchInvoices());
  }, [dispatch]);

  // Danh sách các tháng để hiển thị thanh chọn
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Ngày hôm nay động
  const todayStr = useMemo(() => {
    return getLocalDateString(new Date());
  }, []);

  const todayLabel = useMemo(() => {
    const today = new Date();
    return `Hôm nay (${today.getDate()}/${today.getMonth() + 1})`;
  }, []);

  const handleSelectToday = () => {
    const today = new Date();
    setSelectedMonth(today.getMonth() + 1);
    setSelectedYear(today.getFullYear());
    setActiveDateFilter(todayStr);
  };

  // 1. Lọc hóa đơn theo tháng và năm được chọn
  const monthlyInvoices = useMemo(() => {
    return invoices.filter((item) => {
      const d = new Date(item.createdAt || item.ngaylap);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [invoices, selectedMonth, selectedYear]);

  // 2. Tính toán tổng hợp cho THÁNG được chọn
  const monthlyStats = useMemo(() => {
    const totalOrders = monthlyInvoices.length;
    const paidOrders = monthlyInvoices.filter((item) => item.trangthaithanhtoan === "Đã thanh toán");
    const totalRevenue = paidOrders.reduce((sum, item) => sum + Number(item.tongtien || 0), 0);
    
    return {
      totalOrders,
      paidCount: paidOrders.length,
      totalRevenue,
    };
  }, [monthlyInvoices]);

  // Xác định những ngày nào trong tháng đang có hóa đơn để hiển thị chấm tròn nhỏ trên lịch
  const daysWithOrders = useMemo(() => {
    const dates = new Set();
    monthlyInvoices.forEach((item) => {
      const d = new Date(item.createdAt || item.ngaylap);
      const dateStr = getLocalDateString(d); // YYYY-MM-DD
      dates.add(dateStr);
    });
    return dates;
  }, [monthlyInvoices]);

  // Tính toán lưới ngày cho lịch
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    // Lấy thứ của ngày đầu tiên trong tháng (0 = CN, 1 = T2, ..., 6 = T7)
    const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    
    const daysArray = [];
    
    // Thêm các ô trống đệm trước ngày đầu tiên
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push({ id: `empty-${i}`, isPadding: true });
    }
    
    // Thêm các ngày thực tế của tháng
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

  // 3. Lọc hóa đơn theo ngày được tick chọn trên lịch
  const filteredInvoices = useMemo(() => {
    let result = monthlyInvoices;

    if (activeDateFilter) {
      result = result.filter((item) => {
        const d = new Date(item.createdAt || item.ngaylap);
        const dateStr = getLocalDateString(d); // YYYY-MM-DD
        return dateStr === activeDateFilter;
      });
    }

    return result;
  }, [monthlyInvoices, activeDateFilter]);

  // 4. Tính toán tổng hợp cho danh sách ĐÃ LỌC
  const filteredStats = useMemo(() => {
    const totalOrders = filteredInvoices.length;
    const paidOrders = filteredInvoices.filter((item) => item.trangthaithanhtoan === "Đã thanh toán");
    const totalRevenue = paidOrders.reduce((sum, item) => sum + Number(item.tongtien || 0), 0);

    return {
      totalOrders,
      totalRevenue,
    };
  }, [filteredInvoices]);

  // Định dạng hiển thị ngày lọc (VD: 2026-05-23 -> 23/05/2026)
  const formattedFilterDate = useMemo(() => {
    if (!activeDateFilter) return "";
    const [y, m, d] = activeDateFilter.split("-");
    return `${d}/${m}/${y}`;
  }, [activeDateFilter]);

  // Hàm gọi API lấy chi tiết danh sách món ăn trong hóa đơn khi nhấn click
  const handleViewInvoiceDetails = async (invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceDetails([]);
    setLoadingDetails(true);
    setShowDetails(true);
    
    try {
      const response = await api.get(`/hoadon/${invoice.maHoaDon}`);
      // response.data có định dạng: { hoaDon: {...}, chiTiet: [...] }
      if (response.data && response.data.chiTiet) {
        setInvoiceDetails(response.data.chiTiet);
      }
    } catch (error) {
      console.error("Lỗi lấy chi tiết món ăn của hóa đơn:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const renderInvoiceItem = ({ item }) => {
    const isPaid = item.trangthaithanhtoan === "Đã thanh toán";
    return (
      <TouchableOpacity 
        style={styles.invoiceCard}
        onPress={() => handleViewInvoiceDetails(item)}
        activeOpacity={0.85}
      >
        <View style={styles.invoiceHeader}>
          <View>
            <Text style={styles.invoiceTitle}>Hóa đơn #{item.maHoaDon}</Text>
            <Text style={styles.staffName}>
              <FontAwesome5 name="user-edit" size={10} color="#8d6e63" /> Nhân viên: {item.HoTen || "Không rõ"}
            </Text>
          </View>
          <View style={[styles.statusBadge, isPaid ? styles.paidBadge : styles.unpaidBadge]}>
            <Text style={styles.statusText}>{item.trangthaithanhtoan}</Text>
          </View>
        </View>

        <View style={styles.invoiceDivider} />

        <View style={styles.invoiceFooter}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.invoiceTime}>
              <FontAwesome5 name="clock" size={10} color="#8d6e63" /> {formatDate(item.createdAt || item.ngaylap)}
            </Text>
            <Text style={styles.viewDetailsText}>• Bấm xem chi tiết</Text>
          </View>
          <Text style={styles.invoiceTotal}>
            {Number(item.tongtien || 0).toLocaleString("vi-VN")}đ
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("DashboardScreen")} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
        </TouchableOpacity>
        <Text style={styles.title}>BÁO CÁO DOANH THU</Text>
        <TouchableOpacity onPress={() => dispatch(fetchInvoices())} style={styles.refreshBtn}>
          <FontAwesome5 name="sync-alt" size={16} color="#4b3621" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.mainContainer} showsVerticalScrollIndicator={false}>
        {/* THANH CHỌN THÁNG (Capsule list scroll ngang) */}
        <Text style={styles.sectionTitle}>Chọn tháng báo cáo (Năm {selectedYear})</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.monthScroll}
        >
          {months.map((month) => {
            const isSelected = selectedMonth === month;
            return (
              <TouchableOpacity
                key={month}
                style={[styles.monthCapsule, isSelected && styles.monthCapsuleActive]}
                onPress={() => {
                  setSelectedMonth(month);
                  setActiveDateFilter(null); // Reset lọc ngày khi đổi tháng
                }}
              >
                <Text style={[styles.monthText, isSelected && styles.monthTextActive]}>
                  Tháng {month}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* TỔNG KẾT THÁNG */}
        <View style={styles.monthSummaryCard}>
          <View style={styles.summaryHeader}>
            <FontAwesome5 name="calendar-alt" size={16} color="#c9a66b" />
            <Text style={styles.summaryTitle}>TỔNG QUAN THÁNG {selectedMonth}/{selectedYear}</Text>
          </View>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryVal}>
                {monthlyStats.totalRevenue.toLocaleString("vi-VN")}đ
              </Text>
              <Text style={styles.summaryLbl}>Doanh thu tháng</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryVal}>{monthlyStats.totalOrders}</Text>
              <Text style={styles.summaryLbl}>Tổng đơn đã bán</Text>
            </View>
          </View>
        </View>

        {/* BỘ LỌC CHỌN LỊCH NGÀY */}
        <Text style={styles.sectionTitle}>Lọc đơn theo ngày cụ thể</Text>
        <View style={styles.filterBox}>
          {/* Thanh hiển thị & nhấn để mở Lịch */}
          <TouchableOpacity 
            style={styles.calendarSelector}
            onPress={() => setShowCalendar(true)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <FontAwesome5 name="calendar-day" size={16} color="#8d6e63" style={{ marginRight: 10 }} />
              <Text style={[styles.calendarText, activeDateFilter && styles.calendarTextActive]}>
                {activeDateFilter ? `Ngày đã chọn: ${formattedFilterDate}` : "Nhấn để mở lịch chọn ngày cụ thể..."}
              </Text>
            </View>
            
            {activeDateFilter ? (
              <TouchableOpacity 
                onPress={() => setActiveDateFilter(null)}
                style={styles.clearDateBtn}
              >
                <FontAwesome5 name="times-circle" size={16} color="#d32f2f" />
              </TouchableOpacity>
            ) : (
              <FontAwesome5 name="chevron-down" size={12} color="#8d6e63" />
            )}
          </TouchableOpacity>

          {/* Các nút lọc nhanh (Đã lược bỏ nút Hôm qua) */}
          <View style={styles.quickFilterRow}>
            <TouchableOpacity
              style={[styles.quickFilterBtn, activeDateFilter === null && styles.quickFilterBtnActive]}
              onPress={() => setActiveDateFilter(null)}
            >
              <Text style={[styles.quickFilterText, activeDateFilter === null && styles.quickFilterTextActive]}>
                Tất cả đơn tháng {selectedMonth}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickFilterBtn, activeDateFilter === todayStr && styles.quickFilterBtnActive]}
              onPress={handleSelectToday}
            >
              <Text style={[styles.quickFilterText, activeDateFilter === todayStr && styles.quickFilterTextActive]}>
                {todayLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* THÔNG TIN TỔNG HỢP DANH SÁCH LỌC */}
        <View style={styles.filteredStatsRow}>
          <Text style={styles.resultsCount}>
            Kết quả: <Text style={{ fontWeight: "bold" }}>{filteredInvoices.length}</Text> đơn hàng
          </Text>
          <Text style={styles.resultsRevenue}>
            Doanh thu nhóm: <Text style={{ fontWeight: "bold", color: "#2e7d32" }}>{filteredStats.totalRevenue.toLocaleString("vi-VN")}đ</Text>
          </Text>
        </View>

        {/* DANH SÁCH HÓA ĐƠN ĐÃ LỌC */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4b3621" />
            <Text style={styles.loaderText}>Đang tải danh sách hóa đơn...</Text>
          </View>
        ) : filteredInvoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="folder-open" size={40} color="#d7ccc8" />
            <Text style={styles.emptyText}>Không tìm thấy đơn hàng nào trong ngày được chọn</Text>
          </View>
        ) : (
          <FlatList
            data={filteredInvoices}
            keyExtractor={(item) => item.maHoaDon.toString()}
            renderItem={renderInvoiceItem}
            scrollEnabled={false} // Lồng FlatList vào ScrollView an toàn
            contentContainerStyle={styles.listContent}
          />
        )}

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* MODAL LỊCH CHỌN NGÀY CỔ ĐIỂN - PHONG CÁCH COFFEE PREMIUM */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalContainer}>
            {/* Modal Header */}
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>
                Tháng {selectedMonth} / {selectedYear}
              </Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <FontAwesome5 name="times" size={18} color="#4b3621" />
              </TouchableOpacity>
            </View>

            {/* Thứ trong tuần */}
            <View style={styles.weekDaysRow}>
              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day, idx) => (
                <Text key={day} style={[styles.weekDayText, idx === 0 && { color: "#d32f2f" }]}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Lưới các ngày trong tháng */}
            <View style={styles.daysGrid}>
              {calendarDays.map((item) => {
                if (item.isPadding) {
                  return <View key={item.id} style={styles.dayCellEmpty} />;
                }

                const isSelected = activeDateFilter === item.dateString;
                const hasOrders = daysWithOrders.has(item.dateString);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellActive
                    ]}
                    onPress={() => {
                      setActiveDateFilter(item.dateString);
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

                    {/* Dấu chấm báo hiệu ngày này có đơn hàng */}
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

            {/* Lớp thông báo chú thích lịch */}
            <View style={styles.calendarFooter}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={styles.legendDot} />
                <Text style={styles.legendText}>Ngày có đơn hàng</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeModalBtn}
                onPress={() => {
                  setActiveDateFilter(null);
                  setShowCalendar(false);
                }}
              >
                <Text style={styles.closeModalBtnText}>Xóa bộ lọc ngày</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CHI TIẾT ĐƠN HÀNG (MÓN ĂN ĐÃ BÁN) */}
      <Modal
        visible={showDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContainer}>
            {/* Header Modal */}
            <View style={styles.detailsHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={styles.detailsIconCircle}>
                  <FontAwesome5 name="file-invoice" size={18} color="#fff" />
                </View>
                <Text style={styles.detailsTitle}>
                  Chi Tiết Đơn #{selectedInvoice?.maHoaDon}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowDetails(false)} style={styles.closeDetailsBtn}>
                <FontAwesome5 name="times" size={18} color="#4b3621" />
              </TouchableOpacity>
            </View>

            {/* Tóm tắt thông tin hóa đơn */}
            <View style={styles.detailsSummaryBox}>
              <Text style={styles.detailsSummaryText}>
                <FontAwesome5 name="user" size={11} color="#8d6e63" /> <Text style={{fontWeight: "bold"}}>Nhân viên lập:</Text> {selectedInvoice?.HoTen || "Không rõ"}
              </Text>
              <Text style={styles.detailsSummaryText}>
                <FontAwesome5 name="calendar-alt" size={11} color="#8d6e63" /> <Text style={{fontWeight: "bold"}}>Thời gian:</Text> {formatDate(selectedInvoice?.createdAt || selectedInvoice?.ngaylap)}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                <Text style={[styles.detailsSummaryText, {marginRight: 8}]}><Text style={{fontWeight: "bold"}}>Trạng thái:</Text></Text>
                <View style={[styles.statusBadge, selectedInvoice?.trangthaithanhtoan === "Đã thanh toán" ? styles.paidBadge : styles.unpaidBadge]}>
                  <Text style={styles.statusText}>{selectedInvoice?.trangthaithanhtoan}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailsDivider} />
            <Text style={styles.detailsListTitle}>DANH SÁCH MÓN ĐÃ BÁN</Text>

            {/* Danh sách món ăn chi tiết */}
            {loadingDetails ? (
              <View style={styles.detailsLoader}>
                <ActivityIndicator size="large" color="#4b3621" />
                <Text style={styles.detailsLoaderText}>Đang tải danh sách món ăn...</Text>
              </View>
            ) : invoiceDetails.length === 0 ? (
              <View style={styles.detailsEmptyBox}>
                <FontAwesome5 name="mug-hot" size={30} color="#d7ccc8" />
                <Text style={styles.detailsEmptyText}>Không tìm thấy thông tin món ăn nào của hóa đơn này</Text>
              </View>
            ) : (
              <ScrollView style={styles.detailsScroll} showsVerticalScrollIndicator={true}>
                {invoiceDetails.map((drink, idx) => (
                  <View key={`${drink.maDoUong}-${idx}`} style={styles.detailItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailItemName}>{drink.tenDoUong}</Text>
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

            {/* Tổng cộng hóa đơn */}
            <View style={styles.detailsTotalRow}>
              <Text style={styles.detailsTotalLabel}>TỔNG CỘNG HÓA ĐƠN</Text>
              <Text style={styles.detailsTotalValue}>
                {Number(selectedInvoice?.tongtien || 0).toLocaleString("vi-VN")}đ
              </Text>
            </View>

            {/* Nút đóng */}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f1e9",
    height: Platform.OS === "web" ? "100vh" : "100%",
    maxHeight: Platform.OS === "web" ? "100vh" : "100%",
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
  monthScroll: {
    paddingVertical: 4,
    gap: 8,
    flexDirection: "row",
  },
  monthCapsule: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
  },
  monthCapsuleActive: {
    backgroundColor: "#4b3621",
    borderColor: "#4b3621",
  },
  monthText: {
    fontSize: 13,
    color: "#8d6e63",
    fontWeight: "bold",
  },
  monthTextActive: {
    color: "#fff",
  },
  monthSummaryCard: {
    backgroundColor: "#4b3621",
    borderRadius: 16,
    padding: 20,
    marginTop: 18,
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
  filterBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eadfd3",
  },
  calendarSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f1e9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#eadfd3",
  },
  calendarText: {
    fontSize: 13,
    color: "#bbb",
  },
  calendarTextActive: {
    color: "#4b3621",
    fontWeight: "bold",
  },
  clearDateBtn: {
    padding: 4,
  },
  quickFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 10,
  },
  quickFilterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f8f1e9",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eadfd3",
  },
  quickFilterBtnActive: {
    backgroundColor: "#8d6e63",
    borderColor: "#8d6e63",
  },
  quickFilterText: {
    fontSize: 12,
    color: "#8d6e63",
    fontWeight: "bold",
  },
  quickFilterTextActive: {
    color: "#fff",
  },
  filteredStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  resultsCount: {
    fontSize: 12,
    color: "#8d6e63",
  },
  resultsRevenue: {
    fontSize: 12,
    color: "#8d6e63",
  },
  listContent: {
    paddingBottom: 20,
  },
  invoiceCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eadfd3",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  invoiceTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#4b3621",
  },
  staffName: {
    fontSize: 11,
    color: "#8d6e63",
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paidBadge: {
    backgroundColor: "#e8f5e9",
  },
  unpaidBadge: {
    backgroundColor: "#fff3e0",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#4b3621",
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: "#f5ece3",
    marginVertical: 10,
  },
  invoiceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  invoiceTime: {
    fontSize: 11,
    color: "#8d6e63",
  },
  viewDetailsText: {
    fontSize: 11,
    color: "#8d6e63",
    fontStyle: "italic",
    opacity: 0.8,
  },
  invoiceTotal: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2e7d32",
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
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eadfd3",
  },
  emptyText: {
    marginTop: 10,
    color: "#bbb",
    fontSize: 12,
    textAlign: "center",
  },
  
  /* LỊCH CHỌN NGÀY CHUYÊN NGHIỆP */
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
    fontSize: 18,
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
  closeModalBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f5ece3",
  },
  closeModalBtnText: {
    fontSize: 11,
    color: "#d32f2f",
    fontWeight: "bold",
  },

  /* MODAL CHI TIẾT HÓA ĐƠN */
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
    fontSize: 18,
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
    maxHeight: 180, // Giới hạn chiều cao danh sách món để tránh tràn màn hình
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
});
