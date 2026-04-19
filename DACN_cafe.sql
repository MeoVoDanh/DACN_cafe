CREATE DATABASE DACN_cafe;
USE DACN_cafe;

-- ==========================================
-- 1. BẢNG TÀI KHOẢN
-- ==========================================
CREATE TABLE TaiKhoan (
    MaTaiKhoan INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính (Tự động tăng)',
    tenDangNhap VARCHAR(100) NOT NULL UNIQUE COMMENT 'Tên đăng nhập hệ thống',
    MatKhau VARCHAR(255) NOT NULL COMMENT 'Mật khẩu đăng nhập (Nên được mã hóa MD5/Bcrypt)',
    vaiTro VARCHAR(50) NOT NULL COMMENT 'Vai trò người dùng (Ví dụ: Admin, NhanVien)'
) COMMENT 'Bảng lưu trữ thông tin xác thực đăng nhập của người dùng';

-- ==========================================
-- 3. BẢNG NHÂN VIÊN (Quan hệ 1-1 với Tài Khoản)
-- ==========================================
CREATE TABLE NhanVien (
    MaNhanVien INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính, mã định danh nhân viên (Tự động tăng)',
    HoTen VARCHAR(100) NOT NULL COMMENT 'Họ và tên đầy đủ của nhân viên',
    Email VARCHAR(100) COMMENT 'Địa chỉ email liên lạc',
    SDT VARCHAR(11) COMMENT 'Số điện thoại cá nhân',
    MaTaiKhoan INT NOT NULL UNIQUE COMMENT 'Khóa ngoại liên kết 1-1 với bảng TaiKhoan',
    FOREIGN KEY (MaTaiKhoan) REFERENCES TaiKhoan(MaTaiKhoan) ON DELETE CASCADE
) COMMENT 'Bảng lưu thông tin cá nhân của Nhân viên phục vụ/pha chế';

-- ==========================================
-- 4. BẢNG CA LÀM VIỆC (Quan hệ n-1 với Nhân Viên)
-- ==========================================
CREATE TABLE CaLamViec (
    maCa INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính, mã ca làm việc (Tự động tăng)',
    tenCa VARCHAR(50) NOT NULL COMMENT 'Tên ca (VD: Ca Sáng, Ca Tối)',
    gioBatDau DATETIME COMMENT 'Thời gian bắt đầu ca',
    gioKetThuc DATETIME COMMENT 'Thời gian kết thúc ca',
    ngayLam DATE COMMENT 'Ngày diễn ra ca làm việc',
    trangThai VARCHAR(50) COMMENT 'Trạng thái ca (VD: Đang làm, Đã kết thúc)',
    MaNhanVien INT NOT NULL COMMENT 'Khóa ngoại chỉ định nhân viên làm ca này',
    FOREIGN KEY (MaNhanVien) REFERENCES NhanVien(MaNhanVien) ON DELETE CASCADE
) COMMENT 'Bảng phân công và quản lý thời gian làm việc của nhân viên';

-- ==========================================
-- 5. BẢNG HÓA ĐƠN (Quan hệ n-1 với Nhân Viên)
-- ==========================================
CREATE TABLE HoaDon (
    maHoaDon INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính, mã hóa đơn (Tự động tăng)',
    ngaylap DATE NOT NULL COMMENT 'Ngày lập hóa đơn',
    tongtien DOUBLE COMMENT 'Tổng tiền phải thanh toán',
    trangthaithanhtoan VARCHAR(50) COMMENT 'Trạng thái (VD: Chưa thanh toán, Đã thanh toán)',
    MaNhanVien INT NOT NULL COMMENT 'Khóa ngoại: Nhân viên chịu trách nhiệm lập hóa đơn',
    FOREIGN KEY (MaNhanVien) REFERENCES NhanVien(MaNhanVien)
) COMMENT 'Bảng lưu thông tin tổng quát của một đơn hàng';

-- ==========================================
-- 6. BẢNG THANH TOÁN (Quan hệ 1-1 với Hóa Đơn)
-- ==========================================
CREATE TABLE ThanhToan (
    maThanhToan INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính, mã giao dịch (Tự động tăng)',
    thoigianthanhtoan DATETIME COMMENT 'Thời điểm khách hàng thanh toán thành công',
    sotien DOUBLE COMMENT 'Số tiền thực tế đã nhận',
    maHoaDon INT NOT NULL UNIQUE COMMENT 'Khóa ngoại liên kết 1-1 tới hóa đơn tương ứng',
    FOREIGN KEY (maHoaDon) REFERENCES HoaDon(maHoaDon) ON DELETE CASCADE
) COMMENT 'Bảng lưu chi tiết biên lai giao dịch thanh toán';

-- ==========================================
-- 7. BẢNG ĐỒ UỐNG
-- ==========================================
CREATE TABLE DoUong (
    maDoUong INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính, mã sản phẩm đồ uống (Tự động tăng)',
    tenDoUong VARCHAR(150) NOT NULL COMMENT 'Tên món đồ uống',
    donGia DOUBLE NOT NULL COMMENT 'Giá bán niêm yết',
    moTa TEXT COMMENT 'Mô tả nguyên liệu hoặc cách pha chế'
) COMMENT 'Bảng danh mục các loại đồ uống có trong menu';

-- ==========================================
-- 8. BẢNG CHI TIẾT HÓA ĐƠN (Quan hệ n-n giữa Hóa Đơn và Đồ Uống)
-- ==========================================
CREATE TABLE ChiTietHoaDon (
    maHoaDon INT NOT NULL COMMENT 'Khóa ngoại liên kết tới bảng Hóa Đơn',
    maDoUong INT NOT NULL COMMENT 'Khóa ngoại liên kết tới bảng Đồ Uống',
    soluong INT NOT NULL DEFAULT 1 COMMENT 'Số lượng ly/cốc được gọi',
    dongia FLOAT NOT NULL COMMENT 'Đơn giá lưu lại tại thời điểm gọi món (phòng khi giá menu thay đổi)',
    thanhtien FLOAT COMMENT 'Thành tiền = soluong * dongia',
    PRIMARY KEY (maHoaDon, maDoUong) COMMENT 'Khóa chính kép gồm 2 khóa ngoại gộp lại',
    FOREIGN KEY (maHoaDon) REFERENCES HoaDon(maHoaDon) ON DELETE CASCADE,
    FOREIGN KEY (maDoUong) REFERENCES DoUong(maDoUong)
) COMMENT 'Bảng yếu phân giải quan hệ nhiều-nhiều, lưu chi tiết các món trong đơn';