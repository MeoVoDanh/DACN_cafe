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
CREATE TABLE nhanvien (
    MaNhanVien INT AUTO_INCREMENT PRIMARY KEY,
    HoTen VARCHAR(100) NOT NULL,
    SoCCCD VARCHAR(12) UNIQUE,
    SDT VARCHAR(11),
    Email VARCHAR(100),
    MaTaiKhoan INT,
    TrangThai ENUM('Đang làm việc', 'Đã nghỉ việc') NOT NULL DEFAULT 'Đang làm việc',
    CONSTRAINT fk_nhanvien_taikhoan 
        FOREIGN KEY (MaTaiKhoan) REFERENCES taikhoan(MaTaiKhoan)
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

-- ==========================================
-- 4. BẢNG CA LÀM VIỆC (Quan hệ n-1 với Nhân Viên)
-- ==========================================
CREATE TABLE CaLamViec (
    maCa INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mã phiên ca làm việc thực tế',
    tenCa ENUM('Ca Sáng', 'Ca Chiều', 'Ca Tối') NOT NULL COMMENT 'Tên ca cố định',
    ngayLam DATE NOT NULL COMMENT 'Ngày diễn ra ca làm việc',
    trangThai VARCHAR(50) DEFAULT 'Chưa bắt đầu' COMMENT 'Trạng thái ca (VD: Chưa bắt đầu, Đang làm, Đã kết thúc)',
    CONSTRAINT unique_ca_ngay UNIQUE (tenCa, ngayLam) COMMENT 'Đảm bảo mỗi ngày chỉ có duy nhất 1 ca Sáng, 1 ca Chiều, 1 ca Tối'
) COMMENT 'Bảng quản lý các phiên ca làm việc theo từng ngày';

-- ==========================================
-- 4b. BẢNG CHI TIẾT CA LÀM (Phân công nhân viên vào ca)
-- ==========================================
CREATE TABLE ChiTietCaLam (
    maCa INT NOT NULL COMMENT 'Mã ca làm việc',
    MaNhanVien INT NOT NULL COMMENT 'Mã nhân viên được phân công',
    PRIMARY KEY (maCa, MaNhanVien) COMMENT 'Khóa chính kép tránh việc 1 nhân viên bị thêm 2 lần vào 1 ca',
    FOREIGN KEY (maCa) REFERENCES CaLamViec(maCa) ON DELETE CASCADE,
    FOREIGN KEY (MaNhanVien) REFERENCES nhanvien(MaNhanVien) ON DELETE CASCADE
) COMMENT 'Bảng trung gian giải quyết 1 ca có nhiều nhân viên và 1 nhân viên làm nhiều ca';

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
    moTa TEXT COMMENT 'Mô tả nguyên liệu hoặc cách pha chế',
    hinhAnh VARCHAR(255) DEFAULT NULL COMMENT 'Đường dẫn hoặc tên file hình ảnh của đồ uống'
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
USE DACN_cafe;
