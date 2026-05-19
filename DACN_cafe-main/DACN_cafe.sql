DROP DATABASE IF EXISTS DACN_cafe;
CREATE DATABASE DACN_cafe
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE DACN_cafe;

-- ==========================================
-- 1. BẢNG TÀI KHOẢN
-- ==========================================
CREATE TABLE TaiKhoan (
    MaTaiKhoan INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính tài khoản',
    tenDangNhap VARCHAR(100) NOT NULL UNIQUE COMMENT 'Tên đăng nhập hệ thống',
    MatKhau VARCHAR(255) NOT NULL COMMENT 'Mật khẩu đã mã hóa bcrypt hoặc mật khẩu thường khi test',
    vaiTro ENUM('Admin', 'NhanVien') NOT NULL DEFAULT 'NhanVien' COMMENT 'Vai trò tài khoản',
    trangThai ENUM('HoatDong', 'Khoa') NOT NULL DEFAULT 'HoatDong' COMMENT 'Trạng thái tài khoản',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT 'Bảng lưu thông tin đăng nhập và phân quyền';

-- ==========================================
-- 2. BẢNG NHÂN VIÊN
-- Quan hệ 1-1 với TaiKhoan
-- ==========================================
CREATE TABLE NhanVien (
    MaNhanVien INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính nhân viên',
    HoTen VARCHAR(100) NOT NULL COMMENT 'Họ tên nhân viên',
    Email VARCHAR(100) UNIQUE COMMENT 'Email nhân viên',
    SDT VARCHAR(11) COMMENT 'Số điện thoại nhân viên',
    DiaChi VARCHAR(255) NULL COMMENT 'Địa chỉ nhân viên',
    MaTaiKhoan INT NOT NULL UNIQUE COMMENT 'Khóa ngoại liên kết tài khoản',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_nhanvien_taikhoan
        FOREIGN KEY (MaTaiKhoan)
        REFERENCES TaiKhoan(MaTaiKhoan)
        ON DELETE CASCADE
) COMMENT 'Bảng lưu thông tin cá nhân của nhân viên';

-- ==========================================
-- 3. BẢNG CA LÀM VIỆC
-- Admin tạo ca, nhân viên đăng ký sau
-- ==========================================
CREATE TABLE CaLamViec (
    maCa INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính ca làm việc',

    tenCa VARCHAR(50) NOT NULL COMMENT 'Tên ca: Ca Sáng, Ca Chiều, Ca Tối',
    gioBatDau DATETIME NOT NULL COMMENT 'Thời gian bắt đầu ca',
    gioKetThuc DATETIME NOT NULL COMMENT 'Thời gian kết thúc ca',
    ngayLam DATE NOT NULL COMMENT 'Ngày làm việc',

    trangThai ENUM(
        'Chưa có nhân viên',
        'Đã đăng ký',
        'Đang làm',
        'Đã kết thúc',
        'Đã hủy'
    ) NOT NULL DEFAULT 'Chưa có nhân viên' COMMENT 'Trạng thái ca làm',

    ghiChu TEXT NULL COMMENT 'Thông tin chi tiết do admin nhập',

    MaNhanVien INT NULL COMMENT 'Nhân viên đăng ký ca, NULL nếu chưa ai đăng ký',

    createdBy INT NULL COMMENT 'Admin tạo ca',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_calamviec_nhanvien
        FOREIGN KEY (MaNhanVien)
        REFERENCES NhanVien(MaNhanVien)
        ON DELETE SET NULL,

    CONSTRAINT fk_calamviec_created_by
        FOREIGN KEY (createdBy)
        REFERENCES TaiKhoan(MaTaiKhoan)
        ON DELETE SET NULL,

    CONSTRAINT chk_gio_lam
        CHECK (gioKetThuc > gioBatDau)
) COMMENT 'Bảng ca làm việc do admin tạo và nhân viên đăng ký';

-- ==========================================
-- 4. BẢNG HÓA ĐƠN
-- ==========================================
CREATE TABLE HoaDon (
    maHoaDon INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính hóa đơn',
    ngaylap DATE NOT NULL COMMENT 'Ngày lập hóa đơn',
    tongtien DOUBLE DEFAULT 0 COMMENT 'Tổng tiền hóa đơn',
    trangthaithanhtoan ENUM('Chưa thanh toán', 'Đã thanh toán', 'Đã hủy') 
        NOT NULL DEFAULT 'Chưa thanh toán',
    MaNhanVien INT NOT NULL COMMENT 'Nhân viên lập hóa đơn',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_hoadon_nhanvien
        FOREIGN KEY (MaNhanVien)
        REFERENCES NhanVien(MaNhanVien)
) COMMENT 'Bảng lưu thông tin hóa đơn';

-- ==========================================
-- 5. BẢNG THANH TOÁN
-- Quan hệ 1-1 với HoaDon
-- ==========================================
CREATE TABLE ThanhToan (
    maThanhToan INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính thanh toán',
    thoigianthanhtoan DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian thanh toán',
    sotien DOUBLE NOT NULL COMMENT 'Số tiền thanh toán',
    phuongThuc ENUM('TienMat', 'ChuyenKhoan', 'The') DEFAULT 'TienMat',
    maHoaDon INT NOT NULL UNIQUE COMMENT 'Mỗi hóa đơn chỉ có một thanh toán',

    CONSTRAINT fk_thanhtoan_hoadon
        FOREIGN KEY (maHoaDon)
        REFERENCES HoaDon(maHoaDon)
        ON DELETE CASCADE
) COMMENT 'Bảng lưu thông tin thanh toán';

-- ==========================================
-- 6. BẢNG ĐỒ UỐNG
-- ==========================================
CREATE TABLE DoUong (
    maDoUong INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính đồ uống',
    tenDoUong VARCHAR(150) NOT NULL COMMENT 'Tên đồ uống',
    donGia DOUBLE NOT NULL COMMENT 'Giá bán',
    moTa TEXT NULL COMMENT 'Mô tả đồ uống',
    hinhAnh VARCHAR(255) DEFAULT NULL COMMENT 'Tên file hoặc đường dẫn hình ảnh',
    trangThai ENUM('DangBan', 'NgungBan') DEFAULT 'DangBan' COMMENT 'Trạng thái kinh doanh',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_dongia_duong
        CHECK (donGia >= 0)
) COMMENT 'Bảng danh mục đồ uống';

-- ==========================================
-- 7. BẢNG CHI TIẾT HÓA ĐƠN
-- Quan hệ nhiều-nhiều giữa HoaDon và DoUong
-- ==========================================
CREATE TABLE ChiTietHoaDon (
    maHoaDon INT NOT NULL COMMENT 'Khóa ngoại hóa đơn',
    maDoUong INT NOT NULL COMMENT 'Khóa ngoại đồ uống',
    soluong INT NOT NULL DEFAULT 1 COMMENT 'Số lượng',
    dongia DOUBLE NOT NULL COMMENT 'Đơn giá tại thời điểm bán',
    thanhtien DOUBLE GENERATED ALWAYS AS (soluong * dongia) STORED COMMENT 'Thành tiền',

    PRIMARY KEY (maHoaDon, maDoUong),

    CONSTRAINT fk_cthd_hoadon
        FOREIGN KEY (maHoaDon)
        REFERENCES HoaDon(maHoaDon)
        ON DELETE CASCADE,

    CONSTRAINT fk_cthd_douong
        FOREIGN KEY (maDoUong)
        REFERENCES DoUong(maDoUong),

    CONSTRAINT chk_soluong_duong
        CHECK (soluong > 0),

    CONSTRAINT chk_dongia_cthd_duong
        CHECK (dongia >= 0)
) COMMENT 'Bảng chi tiết hóa đơn';

-- ==========================================
-- 8. INDEX TỐI ƯU TRUY VẤN
-- ==========================================
CREATE INDEX idx_taikhoan_tendangnhap ON TaiKhoan(tenDangNhap);
CREATE INDEX idx_nhanvien_hoten ON NhanVien(HoTen);
CREATE INDEX idx_calamviec_ngaylam ON CaLamViec(ngayLam);
CREATE INDEX idx_calamviec_trangthai ON CaLamViec(trangThai);
CREATE INDEX idx_calamviec_manhanvien ON CaLamViec(MaNhanVien);
CREATE INDEX idx_hoadon_ngaylap ON HoaDon(ngaylap);
CREATE INDEX idx_hoadon_trangthai ON HoaDon(trangthaithanhtoan);
CREATE INDEX idx_douong_tendouong ON DoUong(tenDoUong);

-- ==========================================
-- 9. DỮ LIỆU MẪU TÀI KHOẢN
-- Lưu ý: hiện đang để 123456 cho dễ test.
-- Sau khi backend ổn thì nên đổi sang bcrypt.
-- ==========================================
INSERT INTO TaiKhoan (tenDangNhap, MatKhau, vaiTro) VALUES
('admin01', '123456', 'Admin'),
('quanly_lan', '123456', 'Admin'),
('nv_tuan', '123456', 'NhanVien'),
('nv_mai', '123456', 'NhanVien'),
('nv_hoang', '123456', 'NhanVien'),
('nv_linh', '123456', 'NhanVien'),
('nv_quang', '123456', 'NhanVien'),
('nv_trang', '123456', 'NhanVien'),
('nv_phuong', '123456', 'NhanVien'),
('nv_dat', '123456', 'NhanVien');

-- ==========================================
-- 10. DỮ LIỆU MẪU NHÂN VIÊN
-- ==========================================
INSERT INTO NhanVien (HoTen, Email, SDT, DiaChi, MaTaiKhoan) VALUES
('Nguyễn Văn Tuấn Cảnh', 'admin01@dacncafe.com', '0901234567', 'TP.HCM', 1),
('Trần Ngọc Lan', 'lan.tran@dacncafe.com', '0912345678', 'TP.HCM', 2),
('Lê Minh Tuấn', 'tuan.le@dacncafe.com', '0923456789', 'TP.HCM', 3),
('Phạm Hoàng Mai', 'mai.pham@dacncafe.com', '0934567890', 'TP.HCM', 4),
('Vũ Quốc Hoàng', 'hoang.vu@dacncafe.com', '0945678901', 'TP.HCM', 5),
('Đinh Mỹ Linh', 'linh.dinh@dacncafe.com', '0956789012', 'TP.HCM', 6),
('Bùi Văn Quang', 'quang.bui@dacncafe.com', '0967890123', 'TP.HCM', 7),
('Ngô Thùy Trang', 'trang.ngo@dacncafe.com', '0978901234', 'TP.HCM', 8),
('Lý Bích Phương', 'phuong.ly@dacncafe.com', '0989012345', 'TP.HCM', 9),
('Hồ Tấn Đạt', 'dat.ho@dacncafe.com', '0990123456', 'TP.HCM', 10);

-- ==========================================
-- 11. DỮ LIỆU MẪU ĐỒ UỐNG
-- ==========================================
INSERT INTO DoUong (tenDoUong, donGia, moTa, hinhAnh) VALUES
('Cà phê đen đá', 20000, 'Cà phê rang xay nguyên chất pha phin', 'cf_den.jpg'),
('Cà phê sữa đá', 25000, 'Cà phê phin kết hợp sữa đặc', 'cf_sua.jpg'),
('Bạc xỉu', 28000, 'Nhiều sữa ít cà phê', 'bac_xiu.jpg'),
('Cà phê muối', 30000, 'Cà phê kết hợp lớp kem muối', 'cf_muoi.jpg'),
('Espresso', 35000, 'Cà phê pha máy chuẩn Ý', 'espresso.jpg'),
('Americano', 35000, 'Espresso pha loãng với nước', 'americano.jpg'),
('Trà đào cam sả', 40000, 'Trà đào cam sả thanh mát', 'tra_dao.jpg'),
('Trà sen vàng', 45000, 'Trà oolong, hạt sen và kem macchiato', 'tra_sen_vang.jpg'),
('Trà vải nhiệt đới', 40000, 'Trà đen kết hợp trái vải', 'tra_vai_nhiet_doi.jpg'),
('Hồng trà chanh', 30000, 'Hồng trà pha chanh', 'hong_tra_chanh.jpg'),
('Trà sữa truyền thống', 35000, 'Trà sữa truyền thống với trân châu', 'ts_truyenthong.jpg'),
('Trà sữa Matcha', 40000, 'Matcha Nhật Bản và sữa tươi', 'ts_matcha.jpg'),
('Sinh tố bơ', 45000, 'Sinh tố bơ béo ngậy', 'st_bo.jpg'),
('Sinh tố dâu tây', 45000, 'Sinh tố dâu tây tươi mát', 'st_dau.jpg'),
('Nước ép dưa hấu', 35000, 'Nước ép dưa hấu nguyên chất', 'ep_duahau.jpg'),
('Nước ép cam cà rốt', 40000, 'Nước ép cam kết hợp cà rốt', 'ep_camcarot.jpg'),
('Sữa chua đá xay', 35000, 'Sữa chua đá xay mát lạnh', 'sc_da.jpg'),
('Cacao nóng', 35000, 'Cacao nguyên chất pha nóng', 'cacao.jpg'),
('Matcha đá xay', 50000, 'Matcha đá xay kèm whipping cream', 'matcha_blended.jpg'),
('Mocha đá xay', 50000, 'Cafe, socola và đá xay', 'mocha_blended.jpg');

-- ==========================================
-- 12. DỮ LIỆU MẪU CA LÀM
-- Admin tạo ca đầy đủ, nhân viên đăng ký sau
-- ==========================================

-- Ca đã có nhân viên đăng ký
INSERT INTO CaLamViec 
(tenCa, gioBatDau, gioKetThuc, ngayLam, trangThai, ghiChu, MaNhanVien, createdBy)
VALUES
('Ca Sáng', '2026-05-20 06:00:00', '2026-05-20 14:00:00', '2026-05-20', 'Đã đăng ký', 'Phụ trách quầy order và dọn bàn khu vực trong nhà', 3, 1),
('Ca Tối', '2026-05-20 14:00:00', '2026-05-20 22:00:00', '2026-05-20', 'Đã đăng ký', 'Phụ trách phục vụ khách và kiểm kê cuối ngày', 4, 1);

-- Ca còn trống cho nhân viên đăng ký
INSERT INTO CaLamViec 
(tenCa, gioBatDau, gioKetThuc, ngayLam, trangThai, ghiChu, MaNhanVien, createdBy)
VALUES
('Ca Sáng', '2026-05-25 06:00:00', '2026-05-25 14:00:00', '2026-05-25', 'Chưa có nhân viên', 'Ca sáng cần nhân viên phục vụ quầy và dọn khu vực bàn', NULL, 1),
('Ca Tối', '2026-05-25 14:00:00', '2026-05-25 22:00:00', '2026-05-25', 'Chưa có nhân viên', 'Ca tối cần nhân viên phục vụ và hỗ trợ đóng quán', NULL, 1),
('Ca Sáng', '2026-05-26 06:00:00', '2026-05-26 14:00:00', '2026-05-26', 'Chưa có nhân viên', 'Chuẩn bị nguyên liệu, mở quầy, phục vụ khách buổi sáng', NULL, 2),
('Ca Tối', '2026-05-26 14:00:00', '2026-05-26 22:00:00', '2026-05-26', 'Chưa có nhân viên', 'Phục vụ khách buổi tối, vệ sinh khu vực làm việc', NULL, 2);

-- ==========================================
-- 13. DỮ LIỆU MẪU HÓA ĐƠN
-- ==========================================
INSERT INTO HoaDon (ngaylap, tongtien, trangthaithanhtoan, MaNhanVien) VALUES
('2026-05-18', 65000, 'Đã thanh toán', 3),
('2026-05-18', 80000, 'Đã thanh toán', 3),
('2026-05-18', 135000, 'Đã thanh toán', 4),
('2026-05-19', 50000, 'Đã thanh toán', 5),
('2026-05-19', 120000, 'Chưa thanh toán', 6);

-- ==========================================
-- 14. DỮ LIỆU MẪU CHI TIẾT HÓA ĐƠN
-- ==========================================
INSERT INTO ChiTietHoaDon (maHoaDon, maDoUong, soluong, dongia) VALUES
(1, 1, 2, 20000),
(1, 2, 1, 25000),

(2, 7, 2, 40000),

(3, 8, 1, 45000),
(3, 13, 2, 45000),

(4, 2, 2, 25000),

(5, 11, 2, 35000),
(5, 19, 1, 50000);

-- ==========================================
-- 15. DỮ LIỆU MẪU THANH TOÁN
-- Chỉ insert cho hóa đơn đã thanh toán
-- ==========================================
INSERT INTO ThanhToan (thoigianthanhtoan, sotien, phuongThuc, maHoaDon) VALUES
('2026-05-18 07:30:15', 65000, 'TienMat', 1),
('2026-05-18 08:45:22', 80000, 'TienMat', 2),
('2026-05-18 10:15:00', 135000, 'ChuyenKhoan', 3),
('2026-05-19 15:20:45', 50000, 'TienMat', 4);