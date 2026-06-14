import React, { useEffect, useRef, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal,
  ScrollView,
  Platform,
  TextInput,
  Image,
  Linking,
  KeyboardAvoidingView,
  RefreshControl,
} from "react-native";
import QRCodeLib from "qrcode";
import QRCodeSvg from "react-native-qrcode-svg";
import { useDispatch, useSelector } from "react-redux";
import {
  createInvoice,
  fetchDrinksForInvoice,
  fetchInvoices,
  payInvoice,
  clearInvoiceMessage,
  updateInvoice,
  cancelInvoice,
} from "../../redux/invoiceSlice";
import { FontAwesome5 } from "@expo/vector-icons";
import api from "../../redux/api";
import {
  createPayosPayment,
  getPayosPaymentStatus,
} from "../../services/payosService";

const TOPPINGS = [
  { id: "tranchautrang", name: "Trân châu trắng", price: 5000 },
  { id: "tranchauden", name: "Trân châu đen", price: 5000 },
  { id: "thachsinhto", name: "Thạch trái cây", price: 5000 },
  { id: "kemcheese", name: "Kem Cheese", price: 10000 },
  { id: "hatsen", name: "Hạt sen", price: 10000 },
];

const getToppingsDisplayName = (toppings) => {
  if (!toppings) return "";
  if (Array.isArray(toppings)) {
    const names = toppings.map((t) => t.tenTopping || t.name).filter(Boolean);
    return names.length > 0 ? ` + Topping: ${names.join(", ")}` : "";
  }
  if (typeof toppings === "string") {
    const toppingList = toppings.split(",");
    const names = toppingList
      .map((t) => {
        const found = TOPPINGS.find((top) => top.id === t);
        return found ? found.name : "";
      })
      .filter(Boolean);
    return names.length > 0 ? ` + Topping: ${names.join(", ")}` : "";
  }
  return "";
};

export default function InvoiceScreen({ navigation }) {
  const dispatch = useDispatch();
  const BASE_URL = api.defaults.baseURL.replace("/api", "");
  const { invoices, drinks, isLoading, error, message } = useSelector(
    (state) => state.invoice,
  );
  const safeDrinks = Array.isArray(drinks) ? drinks : [];

  const isDrinkActive = (drink) => {
    return !["Dừng bán", "NgungBan", "Ngừng bán"].includes(drink?.trangThai);
  };

  const getDrinkCategory = (drink) => {
    return drink?.danhMuc || "Khác";
  };

  const uniqueCategories = Array.from(
    new Set(
      safeDrinks
        .filter((d) => isDrinkActive(d))
        .map((d) => getDrinkCategory(d)),
    ),
  );

  const CATEGORIES = [
    { id: "all", name: "Tất cả" },
    ...uniqueCategories.map((cat) => ({ id: cat, name: cat })),
  ];
  const [modalVisible, setModalVisible] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [lastLoadedTime, setLastLoadedTime] = useState(0);

  const lastLoadedTimeRef = useRef(lastLoadedTime);
  useEffect(() => {
    lastLoadedTimeRef.current = lastLoadedTime;
  }, [lastLoadedTime]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [customizingDrink, setCustomizingDrink] = useState(null);
  const [selectedDuong, setSelectedDuong] = useState("100%");
  const [selectedDa, setSelectedDa] = useState("100%");
  const [note, setNote] = useState("");
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [editingCartItemIndex, setEditingCartItemIndex] = useState(null);

  // Detail Modal States
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetailInvoice, setSelectedDetailInvoice] = useState(null);
  const [detailItems, setDetailItems] = useState([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailActiveTab, setDetailActiveTab] = useState("info"); // "info" or "items"


  // Payment States
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPaymentInvoice, setSelectedPaymentInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("tienmat");
  const [customerCash, setCustomerCash] = useState("");
  const [changeDue, setChangeDue] = useState(0);
  const [isCreatingPayos, setIsCreatingPayos] = useState(false);
  const [payosQrImage, setPayosQrImage] = useState("");
  const [payosQrValue, setPayosQrValue] = useState("");
  const [payosCheckoutUrl, setPayosCheckoutUrl] = useState("");
  const [payosOrderCode, setPayosOrderCode] = useState(null);
  const payosPollingRef = useRef(null);
  const [bestsellerIds, setBestsellerIds] = useState([]);

  const loadDataAndResetBadge = async () => {
    dispatch(fetchInvoices());
    dispatch(fetchDrinksForInvoice());
    try {
      const res = await api.get("/check-updates");
      const latestTime = Math.max(res.data.menuTime || 0, res.data.revenueTime || 0);
      setLastLoadedTime(latestTime);
      setHasNewUpdates(false);
    } catch (err) {
      console.log("Error checking updates:", err);
    }

    try {
      const topRes = await api.get("/doanhthu/top-do-uong");
      if (topRes.data && Array.isArray(topRes.data)) {
        const topIds = topRes.data.slice(0, 3).map((item) => item.maDoUong);
        setBestsellerIds(topIds);
      }
    } catch (err) {
      console.log("Error fetching top drinks:", err);
    }
  };

  const handleManualReload = () => {
    if (hasNewUpdates && (cartItems.length > 0 || modalVisible)) {
      if (Platform.OS === "web") {
        const confirmReload = window.confirm("Có cập nhật mới từ database. Tải lại sẽ làm mất các món đang chọn trong giỏ hàng. Bạn có muốn tải lại không?");
        if (!confirmReload) return;
      } else {
        Alert.alert(
          "Cập nhật mới",
          "Có dữ liệu mới từ database. Tải lại sẽ làm mất các món đang chọn trong giỏ hàng. Bạn có muốn tải lại không?",
          [
            { text: "Hủy", style: "cancel" },
            { text: "Tải lại", onPress: () => loadDataAndResetBadge() }
          ]
        );
        return;
      }
    }
    loadDataAndResetBadge();
  };

  // Fetch invoices and drinks when screen is focused and poll check-updates every 5 seconds
  useFocusEffect(
    useCallback(() => {
      loadDataAndResetBadge();

      const interval = setInterval(async () => {
        try {
          const res = await api.get("/check-updates");
          const latestTime = Math.max(res.data.menuTime || 0, res.data.revenueTime || 0);
          if (latestTime > lastLoadedTimeRef.current) {
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
      Alert.alert("Lỗi", error, [
        { text: "OK", onPress: () => dispatch(clearInvoiceMessage()) },
      ]);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (message) {
      Alert.alert("Thông báo", message, [
        { text: "OK", onPress: () => dispatch(clearInvoiceMessage()) },
      ]);
    }
  }, [message, dispatch]);

  // Dọn dẹp thông báo lỗi/thành công khi đóng hoặc rời màn hình
  useEffect(() => {
    return () => {
      dispatch(clearInvoiceMessage());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!paymentModalVisible) {
      if (payosPollingRef.current) {
        clearInterval(payosPollingRef.current);
        payosPollingRef.current = null;
      }
    }
  }, [paymentModalVisible]);

  const reloadData = () => {
    loadDataAndResetBadge();
  };

  const handleAddDrink = (drink, duong = "100%", da = "100%", ghiChu = "", toppings = []) => {
    const itemDuong = drink.duong || duong;
    const itemDa = drink.da || da;
    const itemGhiChu = drink.ghiChu !== undefined ? drink.ghiChu : ghiChu;
    
    let itemToppings = "";
    if (drink.toppings !== undefined) {
      itemToppings = drink.toppings;
    } else {
      itemToppings = Array.isArray(toppings) 
        ? toppings.filter(Boolean).join(",") 
        : toppings;
    }

    const existed = cartItems.find(
      (item) =>
        String(item.maDoUong) === String(drink.maDoUong) &&
        item.duong === itemDuong &&
        item.da === itemDa &&
        (item.ghiChu || "") === (itemGhiChu || "") &&
        (item.toppings || "") === (itemToppings || ""),
    );

    if (existed) {
      setCartItems((prev) =>
        prev.map((item) =>
          String(item.maDoUong) === String(drink.maDoUong) &&
          item.duong === itemDuong &&
          item.da === itemDa &&
          (item.ghiChu || "") === (itemGhiChu || "") &&
          (item.toppings || "") === (itemToppings || "")
            ? { ...item, soluong: item.soluong + 1 }
            : item,
        ),
      );
    } else {
      let toppingPrice = 0;
      if (itemToppings) {
        const toppingList = itemToppings
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        for (const t of toppingList) {
          const found = TOPPINGS.find((top) => top.id === t);
          if (found) toppingPrice += found.price;
        }
      }
      
      const finalPrice = Number(drink.donGia) + toppingPrice;

      setCartItems((prev) => [
        ...prev,
        {
          maDoUong: drink.maDoUong,
          tenDoUong: drink.tenDoUong,
          donGia: finalPrice,
          soluong: 1,
          duong: itemDuong,
          da: itemDa,
          ghiChu: itemGhiChu || "",
          toppings: itemToppings || "",
        },
      ]);
    }
  };

  const handlePressAddDrink = (drink) => {
    setEditingCartItemIndex(null);
    setCustomizingDrink(drink);
    setSelectedDuong("100%");
    setSelectedDa("100%");
    setNote("");
    setSelectedToppings([]);
    setOptionsModalVisible(true);
  };

  const handlePressEditCartItem = (item, index) => {
    setEditingCartItemIndex(index);
    setCustomizingDrink({
      maDoUong: item.maDoUong,
      tenDoUong: item.tenDoUong,
      donGia: item.donGia,
    });
    
    setSelectedDuong(item.duong || "100%");
    setSelectedDa(item.da || "100%");
    setNote(item.ghiChu || "");
    setSelectedToppings(
      item.toppings
        ? item.toppings
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : []
    );
    setOptionsModalVisible(true);
  };

  const handleSaveCustomize = () => {
    const toppingsString = selectedToppings.filter(Boolean).join(",");
    const drinkCatalogItem = safeDrinks.find(
      (d) => String(d.maDoUong) === String(customizingDrink.maDoUong)
    );
    
    let basePrice = customizingDrink.donGia;
    if (drinkCatalogItem) {
      basePrice = Number(drinkCatalogItem.donGia);
    } else if (editingCartItemIndex !== null) {
      const originalItem = cartItems[editingCartItemIndex];
      if (originalItem) {
        let originalToppingPrice = 0;
        if (originalItem.toppings) {
          const originalToppingList = originalItem.toppings
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
          originalToppingList.forEach((t) => {
            const found = TOPPINGS.find((top) => top.id === t);
            if (found) originalToppingPrice += found.price;
          });
        }
        basePrice = Number(originalItem.donGia) - originalToppingPrice;
      }
    }

    let toppingPrice = 0;
    selectedToppings.forEach((t) => {
      const found = TOPPINGS.find((top) => top.id === t);
      if (found) toppingPrice += found.price;
    });

    const finalPrice = basePrice + toppingPrice;

    if (editingCartItemIndex !== null) {
      setCartItems((prev) => {
        const updated = [...prev];
        const originalItem = updated[editingCartItemIndex];

        updated[editingCartItemIndex] = {
          ...originalItem,
          donGia: finalPrice,
          duong: selectedDuong,
          da: selectedDa,
          ghiChu: note || "",
          toppings: toppingsString || "",
        };

        const merged = [];
        updated.forEach((itm) => {
          const duplicateIdx = merged.findIndex(
            (m) =>
              String(m.maDoUong) === String(itm.maDoUong) &&
              m.duong === itm.duong &&
              m.da === itm.da &&
              (m.ghiChu || "") === (itm.ghiChu || "") &&
              (m.toppings || "") === (itm.toppings || "")
          );
          if (duplicateIdx > -1) {
            merged[duplicateIdx].soluong += itm.soluong;
          } else {
            merged.push({ ...itm });
          }
        });

        return merged;
      });
      setEditingCartItemIndex(null);
    } else {
      handleAddDrink(customizingDrink, selectedDuong, selectedDa, note, selectedToppings);
    }

    setOptionsModalVisible(false);
  };

  const handleDecreaseDrink = (maDoUong, duong, da, ghiChu = "", toppings = "") => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          String(item.maDoUong) === String(maDoUong) &&
          item.duong === duong &&
          item.da === da &&
          (item.ghiChu || "") === (ghiChu || "") &&
          (item.toppings || "") === (toppings || "")
            ? { ...item, soluong: item.soluong - 1 }
            : item,
        )
        .filter((item) => item.soluong > 0),
    );
  };

  const getTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.soluong * Number(item.donGia),
      0,
    );
  };

  const handleCreateInvoice = async () => {
    if (cartItems.length === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn ít nhất một đồ uống");
      return;
    }

    const payload = {
      trangthaithanhtoan: "Chưa thanh toán",
      items: cartItems.map((item) => ({
        maDoUong: item.maDoUong,
        soluong: item.soluong,
        duong: item.duong || "100%",
        da: item.da || "100%",
        ghiChu: item.ghiChu || "",
        toppings: item.toppings || "",
      })),
    };

    const result = await dispatch(createInvoice(payload));

    if (createInvoice.fulfilled.match(result)) {
      setCartItems([]);
      setModalVisible(false);
      reloadData();
    }
  };

  const handleOpenDetailModal = async (invoice) => {
    setSelectedDetailInvoice(invoice);
    setDetailItems([]);
    setDetailActiveTab("info");
    setDetailModalVisible(true);
    setIsDetailLoading(true);
    try {
      const response = await api.get(`/hoadon/${invoice.maHoaDon}`);
      if (response.data && response.data.chiTiet) {
        setDetailItems(response.data.chiTiet);
      }
    } catch (err) {
      console.error("Lỗi lấy chi tiết hóa đơn:", err);
      if (Platform.OS === "web") {
        window.alert("Không thể lấy chi tiết hóa đơn");
      } else {
        Alert.alert("Lỗi", "Không thể lấy chi tiết hóa đơn");
      }
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleOpenPaymentModal = (invoice) => {
    setSelectedPaymentInvoice(invoice);
    setPaymentMethod("tienmat");
    setCustomerCash("");
    setChangeDue(0);

    setPayosQrImage("");
    setPayosQrValue("");
    setPayosCheckoutUrl("");
    setPayosOrderCode(null);

    setPaymentModalVisible(true);
  };
  const handleCashChange = (text, total) => {
    const cleanText = text.replace(/[^0-9]/g, "");
    const amount = parseFloat(cleanText) || 0;
    setCustomerCash(cleanText ? amount.toLocaleString("vi-VN") + "đ" : "");

    if (amount >= total) {
      setChangeDue(amount - total);
    } else {
      setChangeDue(0);
    }
  };

  const selectQuickAmount = (amount, total) => {
    const cleanAmount = Math.ceil(amount);
    setCustomerCash(cleanAmount > 0 ? cleanAmount.toLocaleString("vi-VN") + "đ" : "");
    if (cleanAmount >= total) {
      setChangeDue(cleanAmount - total);
    } else {
      setChangeDue(0);
    }
  };
  const executePayment = async () => {
    if (!selectedPaymentInvoice) return;
    const maHoaDon = selectedPaymentInvoice.maHoaDon;
    const result = await dispatch(payInvoice(maHoaDon));

    if (payInvoice.fulfilled.match(result)) {
      setPaymentModalVisible(false);
      reloadData();

      if (paymentMethod === "tienmat") {
        const cashVal =
          customerCash.replace(/[^0-9]/g, "") || selectedPaymentInvoice.tongtien.toString();
        const changeVal = changeDue;
        handlePrintBill(maHoaDon, cashVal, changeVal);
      }
    }
  };
  const handleCreatePayosQr = async () => {
    if (!selectedPaymentInvoice) return;

    try {
      setIsCreatingPayos(true);

      const maHoaDon = selectedPaymentInvoice.maHoaDon;
      const data = await createPayosPayment(maHoaDon);

      console.log("payOS payment data:", data);

      /**
       * payOS thường trả về:
       * - qrCode: chuỗi QR thanh toán
       * - checkoutUrl: link trang thanh toán
       */
      const qrValue = data.qrCode || data.checkoutUrl;

      if (!qrValue) {
        throw new Error("Backend không trả về qrCode hoặc checkoutUrl");
      }

      setPayosQrValue(qrValue);

      if (Platform.OS === "web") {
        const qrImage = await QRCodeLib.toDataURL(qrValue, {
          width: 280,
          margin: 2,
        });
        setPayosQrImage(qrImage);
      } else {
        setPayosQrImage("");
      }
      setPayosCheckoutUrl(data.checkoutUrl || "");
      setPayosOrderCode(data.orderCode || null);

      if (payosPollingRef.current) {
        clearInterval(payosPollingRef.current);
        payosPollingRef.current = null;
      }

      let attempts = 0;
      payosPollingRef.current = setInterval(async () => {
        attempts += 1;
        if (attempts > 120) {
          clearInterval(payosPollingRef.current);
          payosPollingRef.current = null;
          return;
        }

        try {
          const statusResult = await getPayosPaymentStatus(maHoaDon);
          const status = statusResult?.hoaDon?.trangthaithanhtoan;

          if (status === "Đã thanh toán") {
            clearInterval(payosPollingRef.current);
            payosPollingRef.current = null;

            setPaymentModalVisible(false);
            setPayosQrImage("");
            setPayosQrValue("");
            setPayosCheckoutUrl("");
            setPayosOrderCode(null);

            reloadData();
            Alert.alert("Thông báo", "Thanh toán payOS thành công");
            
            const cashVal = selectedPaymentInvoice?.tongtien
              ? selectedPaymentInvoice.tongtien.toString()
              : "0";
            handlePrintBill(maHoaDon, cashVal, 0);
          }
        } catch (statusError) {
          console.log(
            "Lỗi kiểm tra trạng thái payOS:",
            statusError?.message || statusError,
          );
        }
      }, 3000);
    } catch (error) {
      console.log("===== LỖI PAYOS =====");
      console.log("Status:", error.response?.status);
      console.log("Data:", error.response?.data);
      console.log("Message:", error.message);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không tạo được mã QR payOS";

      if (Platform.OS === "web") {
        window.alert(errorMessage);
      } else {
        Alert.alert("Lỗi", errorMessage);
      }
    } finally {
      setIsCreatingPayos(false);
    }
  };
  const handlePrintBill = async (maHoaDon, cashVal, changeVal) => {
    try {
      const response = await api.get(`/hoadon/${maHoaDon}`);
      if (!response.data || !response.data.hoaDon) {
        if (Platform.OS === "web") {
          window.alert("Không tìm thấy thông tin hóa đơn để in!");
        } else {
          Alert.alert("Lỗi", "Không tìm thấy thông tin hóa đơn để in!");
        }
        return;
      }

      const { hoaDon, chiTiet } = response.data;
      const ngayLapStr = formatDate(hoaDon.createdAt || hoaDon.ngaylap);
      const nhanVien = hoaDon.HoTen || "Không rõ";
      const tongTien = Number(hoaDon.tongtien || 0);

      if (Platform.OS === "web") {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          window.alert(
            "Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép bật lên để in hóa đơn.",
          );
          return;
        }

        const itemsHtml = chiTiet
          .map(
            (item) => {
              let toppingsText = "";
              if (item.toppings) {
                if (Array.isArray(item.toppings)) {
                  toppingsText = item.toppings.map((t) => t.tenTopping || t.name).filter(Boolean).join(", ");
                } else if (typeof item.toppings === "string") {
                  toppingsText = item.toppings
                    .split(",")
                    .map((t) => {
                      const found = TOPPINGS.find((top) => top.id === t);
                      return found ? found.name : "";
                    })
                    .filter(Boolean)
                    .join(", ");
                }
              }
              const details = `Đường: ${item.duong} | Đá: ${item.da}${item.ghiChu ? ` | Ghi chú: ${item.ghiChu}` : ""}${toppingsText ? ` | Topping: ${toppingsText}` : ""}`;
              return `
              <tr>
                <td style="padding: 6px 0; text-align: left; vertical-align: top;">
                  <strong>${item.tenDoUong}</strong><br/>
                  <small style="color: #666; font-size: 11px;">${details}</small>
                </td>
                <td style="padding: 6px 0; text-align: center; vertical-align: top;">${item.soluong}</td>
                <td style="padding: 6px 0; text-align: right; vertical-align: top;">${Number(item.dongia).toLocaleString("vi-VN")}đ</td>
                <td style="padding: 6px 0; text-align: right; vertical-align: top;">${Number(item.thanhtien).toLocaleString("vi-VN")}đ</td>
              </tr>
            `;
            }
          )
          .join("");

        const cashInfoHtml = cashVal
          ? `
          <div style="border-top: 1px dashed #000; padding: 10px 0; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Tiền khách đưa:</span>
              <span><strong>${Number(cashVal).toLocaleString("vi-VN")}đ</strong></span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Tiền trả lại:</span>
              <span><strong>${Number(changeVal).toLocaleString("vi-VN")}đ</strong></span>
            </div>
          </div>
        `
          : "";

        const htmlContent = `
          <html>
          <head>
            <title>Hóa đơn #${maHoaDon}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                width: 300px;
                margin: 0 auto;
                padding: 10px;
                color: #000;
              }
              .header {
                text-align: center;
                margin-bottom: 15px;
              }
              .title {
                font-size: 18px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 5px;
              }
              .subtitle {
                font-size: 11px;
                color: #555;
              }
              .info {
                font-size: 12px;
                margin-bottom: 12px;
                line-height: 1.4;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
                margin-bottom: 12px;
              }
              th {
                border-bottom: 1px solid #000;
                padding: 6px 0;
                font-weight: bold;
              }
              .total {
                font-size: 14px;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-top: 1px solid #000;
              }
              .wifi-box {
                border: 1px dashed #4b3621;
                background-color: #fbf9f6;
                padding: 8px;
                border-radius: 4px;
                text-align: center;
                margin-top: 15px;
                font-size: 11px;
                line-height: 1.4;
              }
              .footer {
                text-align: center;
                margin-top: 15px;
                font-size: 11px;
                font-style: italic;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">DACN CAFE</div>
              <div class="subtitle">Địa chỉ: TP. Hồ Chí Minh</div>
              <div class="subtitle">Hotline: 0901 234 567</div>
            </div>
            
            <div style="border-top: 1px solid #000; margin-bottom: 8px;"></div>
            
            <div class="info">
              <strong>HÓA ĐƠN THANH TOÁN</strong><br/>
              Số HD: #${maHoaDon}<br/>
              Thời gian: ${ngayLapStr}<br/>
              Nhân viên: ${nhanVien}
            </div>
            
            <table>
              <thead>
                <tr>
                  <th style="text-align: left; width: 45%;">Món</th>
                  <th style="text-align: center; width: 10%;">SL</th>
                  <th style="text-align: right; width: 22%;">Đơn giá</th>
                  <th style="text-align: right; width: 23%;">T.Tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="total">
              <span>TỔNG CỘNG:</span>
              <span>${tongTien.toLocaleString("vi-VN")}đ</span>
            </div>
            
            ${cashInfoHtml}
            
            <div class="wifi-box">
              <strong>Wifi kết nối miễn phí:</strong><br/>
              Tên Wifi: <strong>DACN Cafe</strong><br/>
              Mật khẩu: <strong>dacncafe2026</strong>
            </div>
            
            <div class="footer">
              Cảm ơn quý khách! Hẹn gặp lại!
            </div>
            
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
          </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        Alert.alert(
          "In hóa đơn",
          `In hóa đơn #${maHoaDon} thành công.\nWifi: DACN Cafe / pass: dacncafe2026`,
        );
      }
    } catch (err) {
      console.error(err);
      if (Platform.OS === "web") {
        window.alert("Có lỗi xảy ra khi in hóa đơn");
      } else {
        Alert.alert("Lỗi", "Có lỗi xảy ra khi in hóa đơn");
      }
    }
  };

  const handleOpenEditModal = async (invoice) => {
    setEditInvoiceId(invoice.maHoaDon);
    setSearchQuery("");
    setCartItems([]);
    setSelectedCategory("all");
    setEditModalVisible(true);

    try {
      const response = await api.get(`/hoadon/${invoice.maHoaDon}`);
      if (response.data && response.data.chiTiet) {
        const prepopulated = response.data.chiTiet.map((item) => ({
          maDoUong: item.maDoUong,
          tenDoUong: item.tenDoUong,
          donGia: Number(item.dongia),
          soluong: item.soluong,
          duong: item.duong || "100%",
          da: item.da || "100%",
          ghiChu: item.ghiChu || "",
          toppings: item.toppings || "",
        }));
        setCartItems(prepopulated);
      }
    } catch (err) {
      console.error(err);
      if (Platform.OS === "web") {
        window.alert("Không thể lấy chi tiết hóa đơn để sửa");
      } else {
        Alert.alert("Lỗi", "Không thể lấy chi tiết hóa đơn để sửa");
      }
    }
  };

  const handleUpdateInvoice = async () => {
    if (cartItems.length === 0) {
      if (Platform.OS === "web") {
        window.alert("Vui lòng chọn ít nhất một đồ uống");
      } else {
        Alert.alert("Thông báo", "Vui lòng chọn ít nhất một đồ uống");
      }
      return;
    }

    const payload = {
      items: cartItems.map((item) => ({
        maDoUong: item.maDoUong,
        soluong: item.soluong,
        duong: item.duong || "100%",
        da: item.da || "100%",
        ghiChu: item.ghiChu || "",
        toppings: item.toppings || "",
      })),
    };

    const result = await dispatch(
      updateInvoice({ maHoaDon: editInvoiceId, invoiceData: payload }),
    );

    if (updateInvoice.fulfilled.match(result)) {
      setCartItems([]);
      setEditModalVisible(false);
      reloadData();
    }
  };

  const handleCancelInvoice = (maHoaDon) => {
    if (Platform.OS === "web") {
      const confirmCancel = window.confirm("Xác nhận hủy hóa đơn này?");
      if (confirmCancel) {
        dispatch(cancelInvoice(maHoaDon)).then((result) => {
          if (cancelInvoice.fulfilled.match(result)) {
            reloadData();
          }
        });
      }
      return;
    }

    Alert.alert("Xác nhận", "Xác nhận hủy hóa đơn này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đồng ý hủy",
        style: "destructive",
        onPress: async () => {
          const result = await dispatch(cancelInvoice(maHoaDon));
          if (cancelInvoice.fulfilled.match(result)) {
            reloadData();
          }
        },
      },
    ]);
  };

  const renderInvoice = ({ item }) => {
    const isPaid = item.trangthaithanhtoan === "Đã thanh toán";
    const isCancelled = item.trangthaithanhtoan === "Đã hủy";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleOpenDetailModal(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.invoiceTitle}>Hóa đơn #{item.maHoaDon}</Text>

          <View
            style={[
              styles.statusBadge,
              isPaid
                ? styles.paid
                : isCancelled
                  ? styles.cancelled
                  : styles.unpaid,
            ]}
          >
            <Text style={styles.statusText}>{item.trangthaithanhtoan}</Text>
          </View>
        </View>

        <Text style={styles.text}>
          Ngày lập: {formatDate(item.createdAt || item.ngaylap)}
        </Text>
        <Text style={styles.text}>Nhân viên: {item.HoTen || "Không rõ"}</Text>
        <Text style={styles.total}>
          Tổng tiền: {Number(item.tongtien || 0).toLocaleString("vi-VN")}đ
        </Text>

        {!isPaid && !isCancelled && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.payBtn}
              onPress={() => handleOpenPaymentModal(item)}
            >
              <FontAwesome5
                name="money-bill-wave"
                size={12}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.payText}>Thanh toán</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => handleOpenEditModal(item)}
            >
              <FontAwesome5
                name="edit"
                size={12}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.editText}>Sửa đơn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancelInvoice(item.maHoaDon)}
            >
              <FontAwesome5
                name="trash-alt"
                size={12}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.cancelText}>Hủy đơn</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderDrinkGridItem = (drink) => {
    const imageUrl = drink.hinhAnh ? `${BASE_URL}/img/${drink.hinhAnh}` : null;
    const bestsellerIndex = bestsellerIds.findIndex((id) => String(id) === String(drink.maDoUong));

    return (
      <TouchableOpacity
        key={drink.maDoUong}
        style={styles.drinkGridCard}
        onPress={() => handlePressAddDrink(drink)}
      >
        {bestsellerIndex > -1 && (
          <View style={[styles.bestsellerDrinkBadge, bestsellerIndex === 0 ? styles.badgeTop1 : styles.badgeTop23]}>
            <Text style={styles.bestsellerDrinkBadgeText}>
              {bestsellerIndex === 0 ? "Bestseller 🔥" : "Hot ⭐"}
            </Text>
          </View>
        )}

        <View style={styles.drinkGridImageWrapper}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.drinkGridImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.drinkGridNoImage}>
              <FontAwesome5 name="coffee" size={24} color="#8d6e63" />
            </View>
          )}
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>
              {Math.round(drink.donGia / 1000)}k
            </Text>
          </View>
        </View>
        <View style={styles.drinkGridInfo}>
          <Text style={styles.drinkGridName} numberOfLines={2}>
            {drink.tenDoUong}
          </Text>
        </View>
        <View style={styles.drinkGridAddIcon}>
          <FontAwesome5 name="plus" size={10} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategorySectionForSelection = (catName, drinksList) => {
    const catDrinks = drinksList.filter(
      (drink) => getDrinkCategory(drink) === catName,
    );

    if (catDrinks.length === 0) return null;

    return (
      <View key={catName} style={styles.categorySection}>
        <View style={styles.categorySectionHeader}>
          <FontAwesome5
            name="folder-open"
            size={13}
            color="#8d6e63"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.categoryHeaderTitle}>{catName.toUpperCase()}</Text>
          <View style={styles.categoryHeaderLine} />
        </View>

        <View style={styles.gridContainer}>
          {catDrinks.map((drink) => renderDrinkGridItem(drink))}
        </View>
      </View>
    );
  };

  const renderDrinksSelection = () => {
    const keyword = searchQuery.trim().toLowerCase();

    const activeDrinks = safeDrinks.filter((drink) => {
      const tenDoUong = drink?.tenDoUong || "";

      return isDrinkActive(drink) && tenDoUong.toLowerCase().includes(keyword);
    });

    if (activeDrinks.length === 0) {
      return (
        <Text style={styles.emptyText}>Không tìm thấy đồ uống phù hợp</Text>
      );
    }

    if (searchQuery.trim().length > 0) {
      return (
        <View style={styles.gridContainer}>
          {activeDrinks.map((drink) => renderDrinkGridItem(drink))}
        </View>
      );
    }

    if (selectedCategory === "all") {
      const categoriesToRender = CATEGORIES.filter((cat) => cat.id !== "all");
      return (
        <View>
          {categoriesToRender.map((cat) =>
            renderCategorySectionForSelection(cat.name, activeDrinks),
          )}
        </View>
      );
    }

    const matchedCat = CATEGORIES.find((cat) => cat.id === selectedCategory);
    const categoryName = matchedCat ? matchedCat.name : selectedCategory;

    const rendered = renderCategorySectionForSelection(categoryName, activeDrinks);
    if (!rendered) {
      return (
        <Text style={styles.emptyText}>Không tìm thấy đồ uống phù hợp</Text>
      );
    }
    return rendered;
  };

  if (isLoading && invoices.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4b3621" />
        <Text style={styles.loadingText}>Đang tải hóa đơn...</Text>
      </View>
    );
  }

  const hasPayosQr =
    Platform.OS === "web" ? Boolean(payosQrImage) : Boolean(payosQrValue);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBox}>
        <View style={styles.titleWrapper}>
          <TouchableOpacity
            onPress={() => navigation.navigate("EmployeeDashboardScreen")}
            style={styles.backBtn}
          >
            <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
          </TouchableOpacity>
          <Text style={styles.title}>Quản lý hóa đơn</Text>
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

        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              setSearchQuery("");
              setCartItems([]);
              setSelectedCategory("all");
              setModalVisible(true);
            }}
          >
            <FontAwesome5 name="plus" size={14} color="#fff" />
            <Text style={styles.addText}>Tạo hóa đơn</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.maHoaDon.toString()}
        renderItem={renderInvoice}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Chưa có hóa đơn nào</Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadDataAndResetBadge}
            tintColor="#4b3621"
            colors={["#4b3621"]}
          />
        }
      />

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={[styles.modalHeader, { justifyContent: "flex-start" }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginRight: 12, padding: 4 }}>
              <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Tạo hóa đơn mới</Text>
          </View>

          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            {/* Search Bar for Drinks */}
            <View style={styles.searchWrapper}>
              <FontAwesome5
                name="search"
                size={14}
                color="#8d6e63"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm đồ uống theo tên..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#aaa"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  style={styles.clearSearchBtn}
                >
                  <FontAwesome5 name="times-circle" size={14} color="#8d6e63" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionTitle}>Chọn đồ uống</Text>

            {/* Category Tab Bar */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryTabBar}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryTab,
                    selectedCategory === cat.id && styles.categoryTabActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      selectedCategory === cat.id &&
                        styles.categoryTabTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {renderDrinksSelection()}

            <Text style={styles.sectionTitle}>Món đã chọn</Text>

            {cartItems.length === 0 ? (
              <Text style={styles.emptyText}>Chưa chọn món nào</Text>
            ) : (
              cartItems.map((item, index) => (
                <View
                  key={`${item.maDoUong}-${item.duong}-${item.da}-${item.ghiChu || ""}-${item.toppings || ""}`}
                  style={styles.cartRow}
                >
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => handlePressEditCartItem(item, index)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.drinkName}>{item.tenDoUong}</Text>
                    <Text
                      style={{ fontSize: 12, color: "#8d6e63", marginTop: 2 }}
                    >
                      Tùy chọn: {item.duong} đường, {item.da} đá{item.ghiChu ? ` | Ghi chú: ${item.ghiChu}` : ""}{getToppingsDisplayName(item.toppings)}
                    </Text>
                    <Text style={styles.drinkPrice}>
                      {item.soluong} x{" "}
                      {Number(item.donGia).toLocaleString("vi-VN")}đ
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.quantityBox}>
                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() =>
                        handleDecreaseDrink(item.maDoUong, item.duong, item.da, item.ghiChu, item.toppings)
                      }
                    >
                      <Text style={styles.quantityText}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.quantityNumber}>{item.soluong}</Text>

                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => handleAddDrink(item, item.duong, item.da, item.ghiChu, item.toppings)}
                    >
                      <Text style={styles.quantityText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>
                {getTotal().toLocaleString("vi-VN")}đ
              </Text>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreateInvoice}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Tạo hóa đơn</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={editModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={[styles.modalHeader, { justifyContent: "flex-start" }]}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={{ marginRight: 12, padding: 4 }}>
              <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sửa hóa đơn #{editInvoiceId}</Text>
          </View>

          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            {/* Search Bar for Drinks */}
            <View style={styles.searchWrapper}>
              <FontAwesome5
                name="search"
                size={14}
                color="#8d6e63"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm đồ uống theo tên..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#aaa"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  style={styles.clearSearchBtn}
                >
                  <FontAwesome5 name="times-circle" size={14} color="#8d6e63" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionTitle}>Chọn đồ uống</Text>

            {/* Category Tab Bar */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryTabBar}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryTab,
                    selectedCategory === cat.id && styles.categoryTabActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      selectedCategory === cat.id &&
                        styles.categoryTabTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {renderDrinksSelection()}

            <Text style={styles.sectionTitle}>Món đã chọn</Text>

            {cartItems.length === 0 ? (
              <Text style={styles.emptyText}>Chưa chọn món nào</Text>
            ) : (
              cartItems.map((item, index) => (
                <View
                  key={`${item.maDoUong}-${item.duong}-${item.da}-${item.ghiChu || ""}-${item.toppings || ""}`}
                  style={styles.cartRow}
                >
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => handlePressEditCartItem(item, index)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.drinkName}>{item.tenDoUong}</Text>
                    <Text
                      style={{ fontSize: 12, color: "#8d6e63", marginTop: 2 }}
                    >
                      Tùy chọn: {item.duong} đường, {item.da} đá{item.ghiChu ? ` | Ghi chú: ${item.ghiChu}` : ""}{getToppingsDisplayName(item.toppings)}
                    </Text>
                    <Text style={styles.drinkPrice}>
                      {item.soluong} x{" "}
                      {Number(item.donGia).toLocaleString("vi-VN")}đ
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.quantityBox}>
                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() =>
                        handleDecreaseDrink(item.maDoUong, item.duong, item.da, item.ghiChu, item.toppings)
                      }
                    >
                      <Text style={styles.quantityText}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.quantityNumber}>{item.soluong}</Text>

                    <TouchableOpacity
                      style={styles.quantityBtn}
                      onPress={() => handleAddDrink(item, item.duong, item.da, item.ghiChu, item.toppings)}
                    >
                      <Text style={styles.quantityText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>
                {getTotal().toLocaleString("vi-VN")}đ
              </Text>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleUpdateInvoice}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Cập nhật đơn</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={optionsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOptionsModalVisible(false)}
      >
        <View style={styles.optionsModalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: "100%", alignItems: "center" }}
          >
            <View style={[styles.optionsModalContainer, { maxHeight: "85%" }]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
                <Text style={styles.optionsModalTitle}>
                  Tùy chỉnh: {customizingDrink?.tenDoUong}
                </Text>

                <Text style={styles.optionsLabel}>Chọn lượng đường:</Text>
                <View style={styles.optionsRow}>
                  {["0%", "30%", "50%", "70%", "100%"].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.optionBtn,
                        selectedDuong === level && styles.optionBtnActive,
                      ]}
                      onPress={() => setSelectedDuong(level)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selectedDuong === level && styles.optionTextActive,
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.optionsLabel}>Chọn lượng đá:</Text>
                <View style={styles.optionsRow}>
                  {["0%", "30%", "50%", "70%", "100%"].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.optionBtn,
                        selectedDa === level && styles.optionBtnActive,
                      ]}
                      onPress={() => setSelectedDa(level)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          selectedDa === level && styles.optionTextActive,
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.optionsLabel}>Chọn Topping (có tính phí):</Text>
                <View style={styles.toppingsGrid}>
                  {TOPPINGS.map((topping) => {
                    const isSelected = selectedToppings.includes(topping.id);
                    return (
                      <TouchableOpacity
                        key={topping.id}
                        style={[
                          styles.toppingBtn,
                          isSelected && styles.toppingBtnActive,
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedToppings(selectedToppings.filter((id) => id !== topping.id));
                          } else {
                            setSelectedToppings([...selectedToppings, topping.id]);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.toppingText,
                            isSelected && styles.toppingTextActive,
                          ]}
                        >
                          {topping.name} (+{topping.price.toLocaleString("vi-VN")}đ)
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.optionsLabel}>Ghi chú:</Text>
                <TextInput
                  style={styles.optionsInput}
                  placeholder="Nhập ghi chú cho đồ uống..."
                  placeholderTextColor="#aaa"
                  value={note}
                  onChangeText={setNote}
                />
              </ScrollView>

              <View style={styles.optionsActionRow}>
                <TouchableOpacity
                  style={styles.optionsCancelBtn}
                  onPress={() => {
                    setOptionsModalVisible(false);
                    setEditingCartItemIndex(null);
                  }}
                >
                  <Text style={styles.optionsCancelText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionsConfirmBtn}
                  onPress={handleSaveCustomize}
                >
                  <Text style={styles.optionsConfirmText}>
                    {editingCartItemIndex !== null ? "Lưu" : "Thêm món"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={paymentModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.optionsModalOverlay}>
          <View
            style={[
              styles.optionsModalContainer,
              { maxWidth: 500, width: "90%" },
            ]}
          >
            <View style={[styles.modalHeader, { justifyContent: "flex-start" }]}>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)} style={{ marginRight: 12, padding: 4 }}>
                <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                Thanh toán hóa đơn #{selectedPaymentInvoice?.maHoaDon}
              </Text>
            </View>

            <View style={styles.invoiceInfoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nhân viên lập:</Text>
                <Text style={styles.infoValue}>
                  {selectedPaymentInvoice?.HoTen || "Không rõ"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tổng tiền:</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: "#2e7d32", fontSize: 18, fontWeight: "bold" },
                  ]}
                >
                  {Number(selectedPaymentInvoice?.tongtien || 0).toLocaleString(
                    "vi-VN",
                  )}
                  đ
                </Text>
              </View>
            </View>

            {/* Method selection tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  paymentMethod === "tienmat" && styles.activeTab,
                ]}
                onPress={() => setPaymentMethod("tienmat")}
              >
                <FontAwesome5
                  name="money-bill-wave"
                  size={14}
                  color={paymentMethod === "tienmat" ? "#fff" : "#8d6e63"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.tabText,
                    paymentMethod === "tienmat" && styles.activeTabText,
                  ]}
                >
                  Tiền mặt
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  paymentMethod === "qr" && styles.activeTab,
                ]}
                onPress={() => setPaymentMethod("qr")}
              >
                <FontAwesome5
                  name="qrcode"
                  size={14}
                  color={paymentMethod === "qr" ? "#fff" : "#8d6e63"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.tabText,
                    paymentMethod === "qr" && styles.activeTabText,
                  ]}
                >
                  Quét mã QR
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: paymentMethod === "qr" ? 380 : 300, marginVertical: 10 }}>
              {paymentMethod === "tienmat" ? (
                <View>
                  <Text style={styles.inputLabel}>Số tiền khách đưa (đ):</Text>
                  <TextInput
                    style={styles.moneyInput}
                    placeholder="Ví dụ: 100.000"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    value={customerCash}
                    onChangeText={(text) =>
                      handleCashChange(
                        text,
                        selectedPaymentInvoice?.tongtien || 0,
                      )
                    }
                  />

                  {/* Quick cash select options */}
                  <View style={styles.quickCashContainer}>
                    <TouchableOpacity
                      style={styles.quickCashBtn}
                      onPress={() =>
                        selectQuickAmount(
                          selectedPaymentInvoice?.tongtien || 0,
                          selectedPaymentInvoice?.tongtien || 0,
                        )
                      }
                    >
                      <Text style={styles.quickCashText}>Đủ</Text>
                    </TouchableOpacity>
                    {[20000, 50000, 100000, 200000, 500000].map((amount) => {
                      return (
                        <TouchableOpacity
                          key={amount}
                          style={styles.quickCashBtn}
                          onPress={() =>
                            selectQuickAmount(
                              amount,
                              selectedPaymentInvoice?.tongtien || 0,
                            )
                          }
                        >
                          <Text style={styles.quickCashText}>
                            {amount / 1000}k
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.changeDueBox}>
                    <Text style={styles.changeDueLabel}>
                      Tiền thừa trả khách:
                    </Text>
                    <Text style={styles.changeDueValue}>
                      {changeDue.toLocaleString("vi-VN")}đ
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.qrGuideContainer}>
                  <Text style={styles.qrGuideTitle}>
                    <FontAwesome5 name="qrcode" size={14} color="#8d6e63" />{" "}
                    Thanh toán payOS
                  </Text>

                  <Text style={styles.qrGuideText}>
                    Khách hàng quét mã QR này để mở trang thanh toán payOS.
                  </Text>

                  {hasPayosQr ? (
                    <View style={{ alignItems: "center", marginTop: 16 }}>
                      {Platform.OS === "web" ? (
                        <Image
                          source={{ uri: payosQrImage }}
                          style={{ width: 210, height: 210 }}
                        />
                      ) : (
                        <QRCodeSvg value={payosQrValue} size={210} />
                      )}

                      <Text
                        style={{
                          marginTop: 10,
                          textAlign: "center",
                          color: "#666",
                        }}
                      >
                        Dùng điện thoại khác quét mã này để thanh toán.
                      </Text>

                      <TouchableOpacity
                        style={[styles.optionsConfirmBtn, { marginTop: 12 }]}
                        onPress={() => {
                          if (Platform.OS === "web") {
                            window.open(payosCheckoutUrl, "_blank");
                          } else {
                            Linking.openURL(payosCheckoutUrl);
                          }
                        }}
                      >
                        <Text style={styles.optionsConfirmText}>
                          Mở trang payOS
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.qrStep}>
                      Bấm nút bên dưới để tạo mã QR thanh toán cho hóa đơn này.
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>

            <View style={styles.optionsActionRow}>
              <TouchableOpacity
                style={styles.optionsCancelBtn}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={styles.optionsCancelText}>Đóng</Text>
              </TouchableOpacity>

              {paymentMethod === "tienmat" && (
                <TouchableOpacity
                  style={[
                    styles.optionsConfirmBtn,
                    (parseFloat(customerCash.replace(/[^0-9]/g, "")) || 0) <
                      (selectedPaymentInvoice?.tongtien || 0) && {
                      backgroundColor: "#aaa",
                    },
                  ]}
                  disabled={
                    (parseFloat(customerCash.replace(/[^0-9]/g, "")) || 0) <
                    (selectedPaymentInvoice?.tongtien || 0)
                  }
                  onPress={executePayment}
                >
                  <Text style={styles.optionsConfirmText}>
                    Thanh toán & In bill
                  </Text>
                </TouchableOpacity>
              )}
              {paymentMethod === "qr" && !hasPayosQr && (
                <TouchableOpacity
                  style={[
                    styles.optionsConfirmBtn,
                    isCreatingPayos && { backgroundColor: "#aaa" },
                  ]}
                  disabled={isCreatingPayos}
                  onPress={handleCreatePayosQr}
                >
                  <Text style={styles.optionsConfirmText}>
                    {isCreatingPayos ? "Đang tạo mã QR..." : "Tạo mã QR payOS"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={detailModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.optionsModalOverlay}>
          <View style={[styles.optionsModalContainer, { maxWidth: 500, width: "90%", maxHeight: "80%", flexDirection: "column" }]}>
            <View style={[styles.modalHeader, { justifyContent: "flex-start", marginBottom: 12 }]}>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={{ marginRight: 12, padding: 4 }}>
                <FontAwesome5 name="arrow-left" size={18} color="#4b3621" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                Chi tiết hóa đơn #{selectedDetailInvoice?.maHoaDon}
              </Text>
            </View>

            {isDetailLoading ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#4b3621" />
                <Text style={{ marginTop: 10, color: "#8d6e63" }}>Đang tải chi tiết...</Text>
              </View>
            ) : (
              <ScrollView style={{ flexShrink: 1, width: "100%" }} showsVerticalScrollIndicator={true}>
                <View style={styles.invoiceInfoBox}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Ngày lập:</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(selectedDetailInvoice?.createdAt || selectedDetailInvoice?.ngaylap)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nhân viên lập:</Text>
                    <Text style={styles.infoValue}>
                      {selectedDetailInvoice?.HoTen || "Không rõ"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Trạng thái:</Text>
                    <Text style={styles.infoValue}>
                      {selectedDetailInvoice?.trangthaithanhtoan}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phương thức:</Text>
                    <Text style={styles.infoValue}>
                      {selectedDetailInvoice?.phuongThuc === "TienMat" ? "Tiền mặt" : selectedDetailInvoice?.phuongThuc || "Chưa rõ"}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.sectionTitle, { fontSize: 15, marginVertical: 10, paddingHorizontal: 0 }]}>Món đã đặt</Text>
                
                {detailItems.map((item, index) => {
                  const imageUrl = item.hinhAnh ? `${BASE_URL}/img/${item.hinhAnh}` : null;
                  return (
                    <View key={index} style={styles.detailRow}>
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.detailDrinkImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.detailDrinkPlaceholder}>
                          <FontAwesome5 name="coffee" size={18} color="#8d6e63" />
                        </View>
                      )}
                      
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailDrinkName}>{item.tenDoUong}</Text>
                        <Text style={styles.detailDrinkOptions}>
                          Tùy chọn: {item.duong} đường, {item.da} đá{item.ghiChu ? ` | Ghi chú: ${item.ghiChu}` : ""}{getToppingsDisplayName(item.toppings)}
                        </Text>
                        <Text style={styles.detailDrinkPrice}>
                          {item.soluong} x {Number(item.dongia).toLocaleString("vi-VN")}đ
                        </Text>
                      </View>
                      <Text style={styles.detailRowTotal}>
                        {Number(item.thanhtien).toLocaleString("vi-VN")}đ
                      </Text>
                    </View>
                  );
                })}

                <View style={[styles.totalBox, { marginTop: 15, borderTopWidth: 1, borderColor: "#eadfd3", paddingTop: 12 }]}>
                  <Text style={styles.totalLabel}>Tổng cộng</Text>
                  <Text style={[styles.totalValue, { color: "#2e7d32", fontSize: 20 }]}>
                    {Number(selectedDetailInvoice?.tongtien || 0).toLocaleString("vi-VN")}đ
                  </Text>
                </View>
              </ScrollView>
            )}

            <View style={[styles.optionsActionRow, { marginTop: 12 }]}>
              <TouchableOpacity
                style={[styles.optionsCancelBtn, { backgroundColor: "#4b3621" }]}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={[styles.optionsCancelText, { color: "#fff" }]}>Đóng</Text>
              </TouchableOpacity>
            </View>
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
  container: {
    flex: 1,
    backgroundColor: "#f8f1e9",
    padding: 16,
    height: Platform.OS === "web" ? "100vh" : "100%",
    maxHeight: Platform.OS === "web" ? "100vh" : "100%",
    overflow: "hidden",
  },
  list: {
    flex: 1,
  },

  headerBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  titleWrapper: {
    flexDirection: "row",
    alignItems: "center",
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

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4b3621",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },

  addText: {
    color: "#fff",
    fontWeight: "bold",
  },

  listContent: {
    paddingBottom: 80,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eadfd3",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  invoiceTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#4b3621",
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  paid: {
    backgroundColor: "#2e7d32",
  },

  unpaid: {
    backgroundColor: "#f57c00",
  },

  cancelled: {
    backgroundColor: "#9e9e9e",
  },

  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },

  text: {
    color: "#6d4c41",
    marginBottom: 4,
  },

  total: {
    color: "#4b3621",
    fontWeight: "bold",
    marginTop: 6,
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },

  payBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#2e7d32",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  payText: {
    color: "#fff",
    fontWeight: "bold",
  },

  editBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#1976d2",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  editText: {
    color: "#fff",
    fontWeight: "bold",
  },

  cancelBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#d32f2f",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  cancelText: {
    color: "#fff",
    fontWeight: "bold",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f1e9",
    padding: 16,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4b3621",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#4b3621",
    marginTop: 16,
    marginBottom: 10,
  },

  drinkRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eadfd3",
  },

  drinkName: {
    fontWeight: "bold",
    color: "#4b3621",
  },

  drinkPrice: {
    color: "#8d6e63",
    marginTop: 4,
  },

  smallAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#4b3621",
    justifyContent: "center",
    alignItems: "center",
  },

  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eadfd3",
  },

  quantityBox: {
    flexDirection: "row",
    alignItems: "center",
  },

  quantityBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#4b3621",
    alignItems: "center",
    justifyContent: "center",
  },

  quantityText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  quantityNumber: {
    marginHorizontal: 12,
    fontWeight: "bold",
    color: "#4b3621",
  },

  totalBox: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  totalLabel: {
    fontWeight: "bold",
    color: "#4b3621",
  },

  totalValue: {
    fontWeight: "bold",
    color: "#2e7d32",
    fontSize: 18,
  },

  submitBtn: {
    backgroundColor: "#4b3621",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 30,
  },

  submitText: {
    color: "#fff",
    fontWeight: "bold",
  },

  emptyText: {
    textAlign: "center",
    color: "#8d6e63",
    marginTop: 20,
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
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    marginTop: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#4b3621",
    fontSize: 14,
    paddingVertical: 10,
  },
  clearSearchBtn: {
    padding: 4,
  },
  optionsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  optionsModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 360,
    padding: 20,
    borderWidth: 1,
    borderColor: "#eadfd3",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  optionsModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4b3621",
    marginBottom: 16,
    textAlign: "center",
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8d6e63",
    marginTop: 12,
    marginBottom: 8,
  },
  optionsInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 10,
    padding: 10,
    color: "#4b3621",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 6,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eadfd3",
    backgroundColor: "#f8f1e9",
    alignItems: "center",
  },
  optionBtnActive: {
    backgroundColor: "#4b3621",
    borderColor: "#4b3621",
  },
  optionText: {
    fontSize: 12,
    color: "#8d6e63",
    fontWeight: "bold",
  },
  optionTextActive: {
    color: "#fff",
  },
  optionsActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  optionsCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d32f2f",
    alignItems: "center",
  },
  optionsCancelText: {
    color: "#d32f2f",
    fontWeight: "bold",
  },
  optionsConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2e7d32",
    alignItems: "center",
  },
  optionsConfirmText: {
    color: "#fff",
    fontWeight: "bold",
  },
  invoiceInfoBox: {
    backgroundColor: "#fcfbf9",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  infoLabel: {
    color: "#8d6e63",
    fontSize: 13,
  },
  infoValue: {
    color: "#4b3621",
    fontWeight: "bold",
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eadfd3",
    backgroundColor: "#f8f1e9",
  },
  activeTab: {
    backgroundColor: "#4b3621",
    borderColor: "#4b3621",
  },
  tabText: {
    color: "#8d6e63",
    fontWeight: "bold",
    fontSize: 13,
  },
  activeTabText: {
    color: "#fff",
  },
  inputLabel: {
    color: "#4b3621",
    fontWeight: "bold",
    fontSize: 13,
    marginBottom: 6,
  },
  moneyInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#4b3621",
    marginBottom: 10,
  },
  quickCashContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  quickCashBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f5ece3",
    borderWidth: 1,
    borderColor: "#eadfd3",
  },
  quickCashText: {
    color: "#4b3621",
    fontSize: 12,
    fontWeight: "bold",
  },
  changeDueBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    borderWidth: 1,
    borderColor: "#c8e6c9",
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },
  changeDueLabel: {
    color: "#2e7d32",
    fontWeight: "bold",
    fontSize: 13,
  },
  changeDueValue: {
    color: "#1b5e20",
    fontWeight: "bold",
    fontSize: 16,
  },
  qrGuideContainer: {
    backgroundColor: "#efebe9",
    borderWidth: 1,
    borderColor: "#d7ccc8",
    borderRadius: 12,
    padding: 12,
  },
  qrGuideTitle: {
    color: "#4b3621",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 8,
  },
  qrGuideText: {
    color: "#5d4037",
    fontSize: 12,
    lineHeight: 1.4,
    marginBottom: 8,
  },
  qrStep: {
    color: "#6d4c41",
    fontSize: 12,
    lineHeight: 1.4,
    marginBottom: 6,
  },
  codeBlock: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eadfd3",
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  codeText: {
    fontFamily: Platform.OS === "web" ? "monospace" : "Courier New",
    fontSize: 10,
    color: "#d32f2f",
  },
  categoryTabBar: {
    flexDirection: "row",
    paddingVertical: 8,
    marginBottom: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#eadfd3",
  },
  categoryTabActive: {
    backgroundColor: "#4b3621",
    borderColor: "#4b3621",
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#8d6e63",
  },
  categoryTabTextActive: {
    color: "#fff",
  },
  categorySection: {
    marginBottom: 20,
  },
  categorySectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  categoryHeaderTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#8d6e63",
    letterSpacing: 1,
  },
  categoryHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#eadfd3",
    marginLeft: 10,
  },
  categoryHeader: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#8d6e63",
    marginBottom: 10,
    marginTop: 6,
    letterSpacing: 1,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 12,
    paddingVertical: 8,
  },
  drinkGridCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    width: Platform.OS === "web" ? "23.5%" : "30%",
    minWidth: 100,
    maxWidth: 160,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eadfd3",
    position: "relative",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    padding: 8,
    alignItems: "center",
  },
  drinkGridImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    backgroundColor: "#f5ece3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  drinkGridImage: {
    width: "100%",
    height: "100%",
  },
  drinkGridNoImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f5ece3",
    justifyContent: "center",
    alignItems: "center",
  },
  priceBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2e7d32",
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  priceBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  drinkGridInfo: {
    width: "100%",
    alignItems: "center",
  },
  drinkGridName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4b3621",
    textAlign: "center",
    lineHeight: 16,
    height: 32,
  },
  drinkGridAddIcon: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#4b3621",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
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
  toppingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  toppingBtn: {
    width: "48%",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eadfd3",
    backgroundColor: "#f8f1e9",
    alignItems: "center",
    justifyContent: "center",
  },
  toppingBtnActive: {
    backgroundColor: "#4b3621",
    borderColor: "#4b3621",
  },
  toppingText: {
    fontSize: 11,
    color: "#8d6e63",
    fontWeight: "bold",
    textAlign: "center",
  },
  toppingTextActive: {
    color: "#fff",
  },
  detailRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1e6da",
    alignItems: "center",
  },
  detailDrinkImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  detailDrinkPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#f8f1e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#eadfd3",
  },
  detailDrinkName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4b3621",
  },
  detailDrinkOptions: {
    fontSize: 11,
    color: "#8d6e63",
    marginTop: 2,
  },
  detailDrinkPrice: {
    fontSize: 12,
    color: "#795548",
    marginTop: 4,
  },
  detailRowTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4b3621",
    marginLeft: 8,
  },
  modalTabRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f5ece3",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  modalTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    flexDirection: "row",
  },
  modalTabBtnActive: {
    backgroundColor: "#4b3621",
  },
  modalTabText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#8d6e63",
  },
  modalTabTextActive: {
    color: "#fff",
  },
  bestsellerDrinkBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 13,
    zIndex: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  badgeTop1: {
    backgroundColor: "#d32f2f",
  },
  badgeTop23: {
    backgroundColor: "#e65100", // Darker orange for better contrast
  },
  bestsellerDrinkBadgeText: {
    color: "#fff",
    fontSize: 10.5,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
});
