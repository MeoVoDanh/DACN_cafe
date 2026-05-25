import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  Platform,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchInvoices } from "../../redux/invoiceSlice";
import { FontAwesome5 } from "@expo/vector-icons";
import api from "../../redux/api"; // Import api để lấy chi tiết món ăn trong hóa đơn

const getLocalDateString = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function MyOrderCountScreen({ navigation }) {
  const dispatch = useDispatch();

  const { invoices, isLoading } = useSelector((state) => state.invoice);
  const { user } = useSelector((state) => state.auth);

  // Bộ lọc danh sách hóa đơn hiển thị ở dưới: 'today' (Hôm nay), 'month' (Trong tháng), 'calendar' (Lọc theo Lịch chọn ngày)
  const [listFilter, setListFilter] = useState("today"); 

  // Trạng thái hiển thị Lịch chọn ngày (Calendar Modal)
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeDateFilter, setActiveDateFilter] = useState(null); // Ngày được chọn để lọc (YYYY-MM-DD)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Tháng hiện tại để hiển thị trên lịch
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Năm hiện tại

  // Trạng thái hiển thị Chi tiết Hóa đơn (Details Modal)
  const [showDetails, setShowDetails] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetails, setInvoiceDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    dispatch(fetchInvoices());
  }, [dispatch]);

  // Lọc lấy tất cả hóa đơn của riêng nhân viên này
  const myInvoices = useMemo(() => {
    return invoices.filter(
      (item) => Number(item.MaNhanVien) === Number(user?.MaNhanVien),
    );
  }, [invoices, user]);

  // Xác định những ngày nào nhân viên này thực tế có đơn hàng để hiện chấm tròn trên Lịch
  const daysWithMyOrders = useMemo(() => {
    const dates = new Set();
    myInvoices.forEach((item) => {
      const d = new Date(item.createdAt || item.ngaylap);
      const dateStr = getLocalDateString(d); // YYYY-MM-DD
      dates.add(dateStr);
    });
    return dates;
  }, [myInvoices]);

  // Tính toán lưới ngày cho lịch
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

  // Tính toán thống kê: Đơn trong ngày và Đơn trong tháng
  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = getLocalDateString(today);
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // 1. Đơn trong ngày hôm nay
    const todayInvoices = myInvoices.filter((item) => {
      const d = new Date(item.createdAt || item.ngaylap);
      const dateStr = getLocalDateString(d);
      return dateStr === todayStr;
    });
    const todayOrdersCount = todayInvoices.length;
    const todayRevenue = todayInvoices
      .filter((item) => item.trangthaithanhtoan === "Đã thanh toán")
      .reduce((sum, item) => sum + Number(item.tongtien || 0), 0);

    // 2. Đơn trong tháng
    const monthlyInvoices = myInvoices.filter((item) => {
      const d = new Date(item.createdAt || item.ngaylap);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    });
    const monthlyOrdersCount = monthlyInvoices.length;
    const monthlyRevenue = monthlyInvoices
      .filter((item) => item.trangthaithanhtoan === "Đã thanh toán")
      .reduce((sum, item) => sum + Number(item.tongtien || 0), 0);

    return {
      todayOrdersCount,
      todayRevenue,
      monthlyOrdersCount,
      monthlyRevenue,
    };
  }, [myInvoices]);

  // Danh sách hóa đơn sau khi áp dụng bộ lọc hiển thị ở dưới
  const displayedInvoices = useMemo(() => {
    const today = new Date();
    const todayStr = getLocalDateString(today);
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    let result = myInvoices;

    if (listFilter === "today") {
      result = result.filter((item) => {
        const d = new Date(item.createdAt || item.ngaylap);
        const dateStr = getLocalDateString(d);
        return dateStr === todayStr;
      });
    } else if (listFilter === "month") {
      result = result.filter((item) => {
        const d = new Date(item.createdAt || item.ngaylap);
        return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
      });
    } else if (listFilter === "calendar") {
      if (activeDateFilter) {
        result = result.filter((item) => {
          const d = new Date(item.createdAt || item.ngaylap);
          const dateStr = getLocalDateString(d);
          return dateStr === activeDateFilter;
        });
      }
      // Nếu chọn tab lịch nhưng chưa tick chọn ngày cụ thể thì hiện toàn bộ đơn
    }

    return result;
  }, [myInvoices, listFilter, activeDateFilter]);

  // Tên hiển thị trên nút Tab lịch chọn ngày
  const calendarTabLabel = useMemo(() => {
    if (!activeDateFilter) return "Chọn ngày";
    const [y, m, d] = activeDateFilter.split("-");
    return `Ngày ${d}/${m}`;
  }, [activeDateFilter]);

  // Hàm gọi API lấy chi tiết các món ăn của hóa đơn khi click vào card
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
      console.error("Lỗi lấy chi tiết hóa đơn nhân viên:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (isLoading && invoices.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b3621" />
        <Text style={styles.loadingText}>Đang tải thống kê đơn...</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <>
      {/* Tiêu đề & Nút Back */}
      <View style={styles.headerBox}>
        <TouchableOpacity
          onPress={() => navigation.navigate("EmployeeDashboardScreen")}
          style={styles.backBtn}
        >
          <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
        </TouchableOpacity>
        <Text style={styles.title}>Đơn đã thực hiện</Text>
      </View>

      {/* Grid thống kê Đơn trong ngày & Đơn trong tháng */}
      <View style={styles.statsGrid}>
        {/* Đơn hôm nay */}
        <StatCard
          icon="calendar-day"
          label="Đơn hôm nay"
          value={stats.todayOrdersCount}
          color="#2e7d32"
        />

        {/* Doanh thu hôm nay */}
        <StatCard
          icon="money-bill-wave"
          label="Doanh thu hôm nay"
          value={`${stats.todayRevenue.toLocaleString("vi-VN")}đ`}
          color="#2e7d32"
        />

        {/* Đơn trong tháng */}
        <StatCard
          icon="calendar-alt"
          label="Đơn trong tháng"
          value={stats.monthlyOrdersCount}
          color="#4b3621"
        />

        {/* Doanh thu trong tháng */}
        <StatCard
          icon="wallet"
          label="Doanh thu tháng"
          value={`${stats.monthlyRevenue.toLocaleString("vi-VN")}đ`}
          color="#4b3621"
        />
      </View>

      {/* Thanh bộ lọc Tab tích hợp Lịch cho nhân viên */}
      <Text style={styles.sectionTitle}>Bộ lọc danh sách đơn</Text>
      <View style={styles.tabFilterRow}>
        <TouchableOpacity
          style={[styles.tabFilterBtn, listFilter === "today" && styles.tabFilterBtnActive]}
          onPress={() => setListFilter("today")}
        >
          <Text style={[styles.tabFilterText, listFilter === "today" && styles.tabFilterTextActive]}>
            Hôm nay
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabFilterBtn, listFilter === "month" && styles.tabFilterBtnActive]}
          onPress={() => setListFilter("month")}
        >
          <Text style={[styles.tabFilterText, listFilter === "month" && styles.tabFilterTextActive]}>
            Tháng này
          </Text>
        </TouchableOpacity>

        {/* Tab Lịch sử có biểu tượng Cuốn Lịch để nhấn tick chọn ngày */}
        <TouchableOpacity
          style={[styles.tabFilterBtn, listFilter === "calendar" && styles.tabFilterBtnActive]}
          onPress={() => {
            setListFilter("calendar");
            setShowCalendar(true); // Tự động mở lịch khi nhấn vào tab Chọn ngày
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <FontAwesome5 
              name="calendar-alt" 
              size={12} 
              color={listFilter === "calendar" ? "#fff" : "#8d6e63"} 
            />
            <Text style={[styles.tabFilterText, listFilter === "calendar" && styles.tabFilterTextActive]}>
              {calendarTabLabel}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={displayedInvoices}
        keyExtractor={(item) => item.maHoaDon.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="folder-open" size={36} color="#d7ccc8" />
            <Text style={styles.emptyText}>
              {listFilter === "calendar" && activeDateFilter 
                ? `Bạn không có đơn nào trong ngày ${formattedFilterDate(activeDateFilter)}` 
                : "Bạn không có đơn hàng nào trong nhóm lọc này"}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
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
                  <Text style={styles.text}>
                    <FontAwesome5 name="clock" size={10} color="#8d6e63" /> {formatDate(item.createdAt || item.ngaylap)}
                  </Text>
                  <Text style={styles.viewDetailsText}>• Xem chi tiết món</Text>
                </View>

                <Text style={styles.total}>
                  {Number(item.tongtien || 0).toLocaleString("vi-VN")}đ
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* MODAL LỊCH CHỌN NGÀY DÀNH CHO NHÂN VIÊN */}
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
                const hasOrders = daysWithMyOrders.has(item.dateString);

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

                    {/* Dấu chấm báo hiệu ngày này nhân viên có đơn hàng */}
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

            {/* Lớp chú thích dưới lịch */}
            <View style={styles.calendarFooter}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={styles.legendDot} />
                <Text style={styles.legendText}>Ngày bạn có đơn</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeModalBtn}
                onPress={() => {
                  setActiveDateFilter(null);
                  setShowCalendar(false);
                }}
              >
                <Text style={styles.closeModalBtnText}>Xóa bộ lọc</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CHI TIẾT ĐƠN HÀNG DÀNH CHO NHÂN VIÊN */}
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
                  <FontAwesome5 name="receipt" size={18} color="#fff" />
                </View>
                <Text style={styles.detailsTitle}>
                  Hóa đơn #{selectedInvoice?.maHoaDon}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowDetails(false)} style={styles.closeDetailsBtn}>
                <FontAwesome5 name="times" size={18} color="#4b3621" />
              </TouchableOpacity>
            </View>

            {/* Tóm tắt thông tin hóa đơn */}
            <View style={styles.detailsSummaryBox}>
              <Text style={styles.detailsSummaryText}>
                <FontAwesome5 name="calendar-alt" size={11} color="#8d6e63" /> <Text style={{fontWeight: "bold"}}>Thời gian lập:</Text> {formatDate(selectedInvoice?.createdAt || selectedInvoice?.ngaylap)}
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
                <Text style={styles.detailsEmptyText}>Không tìm thấy chi tiết món ăn</Text>
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

            {/* Tổng cộng hóa đơn */}
            <View style={styles.detailsTotalRow}>
              <Text style={styles.detailsTotalLabel}>TỔNG TIỀN THANH TOÁN</Text>
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

const StatCard = ({ icon, label, value, color }) => {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <FontAwesome5 name={icon} size={16} color="#fff" />
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const formattedFilterDate = (value) => {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f1e9",
    height: Platform.OS === "web" ? "100vh" : "100%",
    maxHeight: Platform.OS === "web" ? "100vh" : "100%",
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
  headerBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
  },
  statCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eadfd3",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4b3621",
  },
  statLabel: {
    fontSize: 12,
    color: "#8d6e63",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8d6e63",
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 16,
    letterSpacing: 0.5,
  },
  tabFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "#eadfd3",
    marginBottom: 12,
    gap: 4,
  },
  tabFilterBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  tabFilterBtnActive: {
    backgroundColor: "#4b3621",
  },
  tabFilterText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#8d6e63",
  },
  tabFilterTextActive: {
    color: "#fff",
  },
  listContent: {
    paddingBottom: 40,
  },
  invoiceCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    marginHorizontal: 16,
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
    alignItems: "center",
  },
  invoiceTitle: {
    fontWeight: "bold",
    color: "#4b3621",
    fontSize: 16,
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
    color: "#4b3621",
    fontWeight: "bold",
    fontSize: 10,
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
  text: {
    fontSize: 11,
    color: "#8d6e63",
  },
  viewDetailsText: {
    fontSize: 11,
    color: "#8d6e63",
    fontStyle: "italic",
    opacity: 0.8,
  },
  total: {
    color: "#2e7d32",
    fontWeight: "bold",
    fontSize: 15,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#eadfd3",
  },
  emptyText: {
    marginTop: 10,
    color: "#bbb",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  /* LỊCH CHỌN NGÀY CHUYÊN NGHIỆP DÀNH CHO NHÂN VIÊN */
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
});
