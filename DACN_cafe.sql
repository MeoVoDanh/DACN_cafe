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
    vaiTro VARCHAR(50) NOT NULL DEFAULT 'NhanVien' COMMENT 'Vai trò tài khoản: Admin, NhanVien, QuanLy, PhaChe, PhucVu',
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
    SoCCCD VARCHAR(12) UNIQUE NULL COMMENT 'Số căn cước công dân',
    DiaChi VARCHAR(255) NULL COMMENT 'Địa chỉ nhân viên',
    MaTaiKhoan INT NOT NULL UNIQUE COMMENT 'Khóa ngoại liên kết tài khoản',
    TrangThai ENUM('Đang làm việc', 'Đã nghỉ việc') NOT NULL DEFAULT 'Đang làm việc' COMMENT 'Trạng thái nhân viên',
    HinhAnh VARCHAR(255) DEFAULT NULL COMMENT 'Ảnh đại diện của nhân viên',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_nhanvien_taikhoan
        FOREIGN KEY (MaTaiKhoan)
        REFERENCES TaiKhoan(MaTaiKhoan)
        ON DELETE RESTRICT
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
        'Chờ duyệt',
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
-- 4. BẢNG THÔNG BÁO
-- ==========================================
CREATE TABLE ThongBao (
    maThongBao INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính thông báo',
    noiDung VARCHAR(255) NOT NULL COMMENT 'Nội dung thông báo',
    trangThai ENUM('Chưa đọc', 'Đã đọc') NOT NULL DEFAULT 'Chưa đọc' COMMENT 'Trạng thái đọc',
    MaNhanVien INT NOT NULL COMMENT 'Nhân viên nhận thông báo',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_thongbao_nhanvien
        FOREIGN KEY (MaNhanVien)
        REFERENCES NhanVien(MaNhanVien)
        ON DELETE CASCADE
) COMMENT 'Bảng lưu thông báo cho nhân viên';

-- ==========================================
-- 5. BẢNG HÓA ĐƠN
-- Đã tích hợp PayOS
-- ==========================================
CREATE TABLE HoaDon (
    maHoaDon INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính hóa đơn',
    ngaylap DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày giờ lập hóa đơn',
    tongtien DOUBLE DEFAULT 0 COMMENT 'Tổng tiền hóa đơn',
	
    trangthaithanhtoan ENUM(
        'Chưa thanh toán',
        'Đã thanh toán',
        'Đã hủy'
    ) NOT NULL DEFAULT 'Chưa thanh toán' COMMENT 'Trạng thái thanh toán',

    MaNhanVien INT NOT NULL COMMENT 'Nhân viên lập hóa đơn',
	ghiChu VARCHAR(255) NULL COMMENT 'Ghi chú riêng cho từng món trong hóa đơn',
    -- Thông tin PayOS
    payosOrderCode BIGINT NULL UNIQUE COMMENT 'Mã đơn hàng liên kết hệ thống PayOS',
    payosPaymentLinkId VARCHAR(255) NULL COMMENT 'ID link thanh toán được PayOS tạo',
    payosCheckoutUrl VARCHAR(500) NULL COMMENT 'Link thanh toán PayOS',
    payosQrCode TEXT NULL COMMENT 'Mã QR thanh toán PayOS',
    payosStatus VARCHAR(50) NULL COMMENT 'Trạng thái giao dịch PayOS',

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_hoadon_nhanvien
        FOREIGN KEY (MaNhanVien)
        REFERENCES NhanVien(MaNhanVien)
) COMMENT 'Bảng lưu thông tin hóa đơn';

-- ==========================================
-- 6. BẢNG THANH TOÁN
-- Quan hệ 1-1 với HoaDon
-- ==========================================
CREATE TABLE ThanhToan (
    maThanhToan INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính thanh toán',
    thoigianthanhtoan DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian thanh toán',
    sotien DOUBLE NOT NULL COMMENT 'Số tiền thanh toán',

    phuongThuc ENUM(
        'TienMat',
        'ChuyenKhoan',
        'The',
        'VNPAY',
        'PAYOS'
    ) DEFAULT 'PAYOS' COMMENT 'Phương thức giao dịch',

    trangThai ENUM(
        'DangCho',
        'ThanhCong',
        'ThatBai',
        'DaHuy'
    ) NOT NULL DEFAULT 'ThanhCong' COMMENT 'Trạng thái giao dịch thanh toán',

    maGiaoDich VARCHAR(255) NULL COMMENT 'Mã giao dịch từ cổng thanh toán nếu có',
    maHoaDon INT NOT NULL COMMENT 'Mỗi hóa đơn chỉ có một giao dịch thanh toán thành công',
    ghiChu VARCHAR(255) NULL,

    CONSTRAINT uq_thanhtoan_mahoadon 
        UNIQUE KEY (maHoaDon),

    CONSTRAINT fk_thanhtoan_hoadon
        FOREIGN KEY (maHoaDon)
        REFERENCES HoaDon(maHoaDon)
        ON DELETE CASCADE,

    CONSTRAINT chk_thanhtoan_sotien
        CHECK (sotien >= 0)
) COMMENT 'Bảng lưu thông tin thanh toán';

-- ==========================================
-- 7a. BẢNG DANH MỤC ĐỒ UỐNG
-- ==========================================
CREATE TABLE DanhMucDoUong (
    maDanhMuc INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính danh mục',
    tenDanhMuc VARCHAR(100) NOT NULL UNIQUE COMMENT 'Tên danh mục đồ uống',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT 'Bảng danh mục phân loại đồ uống';

-- ==========================================
-- 7b. BẢNG ĐỒ UỐNG
-- ==========================================
CREATE TABLE DoUong (
    maDoUong INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính đồ uống',
    tenDoUong VARCHAR(150) NOT NULL COMMENT 'Tên đồ uống',
    donGia DOUBLE NOT NULL COMMENT 'Giá bán mặc định',
    moTa TEXT NULL COMMENT 'Mô tả đồ uống',
    hinhAnh VARCHAR(255) DEFAULT NULL COMMENT 'Tên file hoặc đường dẫn hình ảnh',
    trangThai VARCHAR(50) DEFAULT 'Đang bán' COMMENT 'Trạng thái kinh doanh',
    danhMuc INT NULL DEFAULT 5 COMMENT 'FK danh mục đồ uống',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_dongia_duong
        CHECK (donGia >= 0),

    CONSTRAINT fk_douong_danhmuc
        FOREIGN KEY (danhMuc)
        REFERENCES DanhMucDoUong(maDanhMuc)
        ON DELETE SET NULL
) COMMENT 'Bảng lưu thông tin đồ uống';

-- ==========================================
-- 8. BẢNG TOPPING
-- ==========================================
CREATE TABLE Topping (
    maTopping INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính topping',
    tenTopping VARCHAR(100) NOT NULL COMMENT 'Tên topping',
    donGia DOUBLE NOT NULL DEFAULT 0 COMMENT 'Giá topping',
    moTa TEXT NULL COMMENT 'Mô tả topping',
    trangThai ENUM('Đang bán', 'Ngừng bán') NOT NULL DEFAULT 'Đang bán',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_topping_dongia
        CHECK (donGia >= 0)
) COMMENT 'Bảng lưu danh sách topping';

-- ==========================================
-- 9. BẢNG ĐỒ UỐNG - TOPPING
-- Quy định đồ uống nào được chọn topping nào
-- ==========================================
CREATE TABLE DoUongTopping (
    maDoUong INT NOT NULL COMMENT 'Khóa ngoại đồ uống',
    maTopping INT NOT NULL COMMENT 'Khóa ngoại topping',

    PRIMARY KEY (maDoUong, maTopping),

    CONSTRAINT fk_douongtopping_douong
        FOREIGN KEY (maDoUong)
        REFERENCES DoUong(maDoUong)
        ON DELETE CASCADE,

    CONSTRAINT fk_douongtopping_topping
        FOREIGN KEY (maTopping)
        REFERENCES Topping(maTopping)
        ON DELETE CASCADE
) COMMENT 'Bảng quy định topping nào được áp dụng cho đồ uống nào';

-- ==========================================
-- 10. BẢNG CHI TIẾT HÓA ĐƠN
-- Mỗi dòng là một món được order
-- Có thể gắn nhiều topping qua bảng ChiTietTopping
-- ==========================================
CREATE TABLE ChiTietHoaDon (
    maChiTietHoaDon INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính chi tiết hóa đơn',

    maHoaDon INT NOT NULL COMMENT 'Khóa ngoại hóa đơn',
    maDoUong INT NOT NULL COMMENT 'Khóa ngoại đồ uống',

    soluong INT NOT NULL DEFAULT 1 COMMENT 'Số lượng ly',
    dongia DOUBLE NOT NULL COMMENT 'Đơn giá đồ uống tại thời điểm bán',

    tongTienTopping DOUBLE NOT NULL DEFAULT 0 COMMENT 'Tổng tiền topping cho 1 ly',

    thanhtien DOUBLE
        GENERATED ALWAYS AS ((dongia + tongTienTopping) * soluong) STORED
        COMMENT 'Thành tiền = số lượng * (giá đồ uống + topping)',

    duong VARCHAR(10) NOT NULL DEFAULT '100%' COMMENT 'Phần trăm đường',
    da VARCHAR(10) NOT NULL DEFAULT '100%' COMMENT 'Phần trăm đá',
    size ENUM('S', 'M', 'L') NOT NULL DEFAULT 'M' COMMENT 'Size đồ uống',
    ghiChu VARCHAR(255) NULL COMMENT 'Ghi chú riêng cho món',

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_cthd_hoadon
        FOREIGN KEY (maHoaDon)
        REFERENCES HoaDon(maHoaDon)
        ON DELETE CASCADE,

    CONSTRAINT fk_cthd_douong
        FOREIGN KEY (maDoUong)
        REFERENCES DoUong(maDoUong),

    CONSTRAINT chk_cthd_soluong
        CHECK (soluong > 0),

    CONSTRAINT chk_cthd_dongia
        CHECK (dongia >= 0),

    CONSTRAINT chk_cthd_topping
        CHECK (tongTienTopping >= 0)
) COMMENT 'Bảng chi tiết hóa đơn, mỗi dòng là một món được order';

-- ==========================================
-- 11. BẢNG CHI TIẾT TOPPING
-- Một món trong hóa đơn có thể có nhiều topping
-- ==========================================
CREATE TABLE ChiTietTopping (
    maChiTietTopping INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính chi tiết topping',

    maChiTietHoaDon INT NOT NULL COMMENT 'Khóa ngoại chi tiết hóa đơn',
    maTopping INT NOT NULL COMMENT 'Khóa ngoại topping',

    soLuong INT NOT NULL DEFAULT 1 COMMENT 'Số lượng topping trên 1 ly',
    donGia DOUBLE NOT NULL COMMENT 'Giá topping tại thời điểm bán',

    thanhtien DOUBLE
        GENERATED ALWAYS AS (soLuong * donGia) STORED
        COMMENT 'Thành tiền topping',

    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_ctt_chitiethoadon
        FOREIGN KEY (maChiTietHoaDon)
        REFERENCES ChiTietHoaDon(maChiTietHoaDon)
        ON DELETE CASCADE,

    CONSTRAINT fk_ctt_topping
        FOREIGN KEY (maTopping)
        REFERENCES Topping(maTopping),

    CONSTRAINT uq_ctt_unique_topping
        UNIQUE KEY (maChiTietHoaDon, maTopping),

    CONSTRAINT chk_ctt_soluong
        CHECK (soLuong > 0),

    CONSTRAINT chk_ctt_dongia
        CHECK (donGia >= 0)
) COMMENT 'Bảng lưu topping được chọn cho từng món trong hóa đơn';

-- ==========================================
-- 12. INDEX TỐI ƯU TRUY VẤN
-- ==========================================
CREATE INDEX idx_taikhoan_tendangnhap ON TaiKhoan(tenDangNhap);
CREATE INDEX idx_nhanvien_hoten ON NhanVien(HoTen);

CREATE INDEX idx_calamviec_ngaylam ON CaLamViec(ngayLam);
CREATE INDEX idx_calamviec_trangthai ON CaLamViec(trangThai);
CREATE INDEX idx_calamviec_manhanvien ON CaLamViec(MaNhanVien);

CREATE INDEX idx_hoadon_ngaylap ON HoaDon(ngaylap);
CREATE INDEX idx_hoadon_trangthai ON HoaDon(trangthaithanhtoan);
CREATE INDEX idx_hoadon_manhanvien ON HoaDon(MaNhanVien);
CREATE INDEX idx_hoadon_payos_order ON HoaDon(payosOrderCode);

CREATE INDEX idx_thanhtoan_mahoadon ON ThanhToan(maHoaDon);
CREATE INDEX idx_thanhtoan_phuongthuc ON ThanhToan(phuongThuc);

CREATE INDEX idx_douong_tendouong ON DoUong(tenDoUong);
CREATE INDEX idx_douong_danhmuc ON DoUong(danhMuc);
CREATE INDEX idx_douong_trangthai ON DoUong(trangThai);

CREATE INDEX idx_topping_tentopping ON Topping(tenTopping);
CREATE INDEX idx_topping_trangthai ON Topping(trangThai);

CREATE INDEX idx_cthd_mahoadon ON ChiTietHoaDon(maHoaDon);
CREATE INDEX idx_cthd_madouong ON ChiTietHoaDon(maDoUong);

CREATE INDEX idx_ctt_machitiet ON ChiTietTopping(maChiTietHoaDon);
CREATE INDEX idx_ctt_matopping ON ChiTietTopping(maTopping);

-- ==========================================
-- 13. TRIGGER CẬP NHẬT TỔNG TIỀN TOPPING CHO MỖI MÓN
-- ==========================================
DELIMITER $$

CREATE TRIGGER trg_AfterInsert_ChiTietTopping
AFTER INSERT ON ChiTietTopping
FOR EACH ROW
BEGIN
    UPDATE ChiTietHoaDon
    SET tongTienTopping = (
        SELECT COALESCE(SUM(thanhtien), 0)
        FROM ChiTietTopping
        WHERE maChiTietHoaDon = NEW.maChiTietHoaDon
    )
    WHERE maChiTietHoaDon = NEW.maChiTietHoaDon;
END$$

CREATE TRIGGER trg_AfterUpdate_ChiTietTopping
AFTER UPDATE ON ChiTietTopping
FOR EACH ROW
BEGIN
    UPDATE ChiTietHoaDon
    SET tongTienTopping = (
        SELECT COALESCE(SUM(thanhtien), 0)
        FROM ChiTietTopping
        WHERE maChiTietHoaDon = NEW.maChiTietHoaDon
    )
    WHERE maChiTietHoaDon = NEW.maChiTietHoaDon;
END$$

CREATE TRIGGER trg_AfterDelete_ChiTietTopping
AFTER DELETE ON ChiTietTopping
FOR EACH ROW
BEGIN
    UPDATE ChiTietHoaDon
    SET tongTienTopping = (
        SELECT COALESCE(SUM(thanhtien), 0)
        FROM ChiTietTopping
        WHERE maChiTietHoaDon = OLD.maChiTietHoaDon
    )
    WHERE maChiTietHoaDon = OLD.maChiTietHoaDon;
END$$

DELIMITER ;

-- ==========================================
-- 14. TRIGGER CẬP NHẬT TỔNG TIỀN HÓA ĐƠN
-- Database cũ của bạn cũng đã có trigger tính tổng tiền,
-- bản này giữ lại ý tưởng đó nhưng dùng ChiTietHoaDon mới.
-- ==========================================
DELIMITER $$

CREATE TRIGGER trg_AfterInsert_ChiTietHoaDon
AFTER INSERT ON ChiTietHoaDon
FOR EACH ROW
BEGIN
    UPDATE HoaDon
    SET tongtien = (
        SELECT COALESCE(SUM(thanhtien), 0)
        FROM ChiTietHoaDon
        WHERE maHoaDon = NEW.maHoaDon
    )
    WHERE maHoaDon = NEW.maHoaDon;
END$$

CREATE TRIGGER trg_AfterUpdate_ChiTietHoaDon
AFTER UPDATE ON ChiTietHoaDon
FOR EACH ROW
BEGIN
    UPDATE HoaDon
    SET tongtien = (
        SELECT COALESCE(SUM(thanhtien), 0)
        FROM ChiTietHoaDon
        WHERE maHoaDon = NEW.maHoaDon
    )
    WHERE maHoaDon = NEW.maHoaDon;
END$$

CREATE TRIGGER trg_AfterDelete_ChiTietHoaDon
AFTER DELETE ON ChiTietHoaDon
FOR EACH ROW
BEGIN
    UPDATE HoaDon
    SET tongtien = (
        SELECT COALESCE(SUM(thanhtien), 0)
        FROM ChiTietHoaDon
        WHERE maHoaDon = OLD.maHoaDon
    )
    WHERE maHoaDon = OLD.maHoaDon;
END$$

DELIMITER ;

-- ==========================================
-- 15. DỮ LIỆU MẪU TÀI KHOẢN
-- ==========================================
INSERT INTO TaiKhoan (MaTaiKhoan, tenDangNhap, MatKhau, vaiTro) VALUES
(1, 'admin01', '123456', 'Admin'),
(2, 'quanly_lan', '123456', 'Admin'),
(3, 'nv_tuan', '123456', 'NhanVien'),
(4, 'nv_mai', '123456', 'NhanVien'),
(5, 'nv_hoang', '123456', 'NhanVien'),
(6, 'nv_linh', '123456', 'NhanVien'),
(7, 'nv_quang', '123456', 'NhanVien'),
(8, 'nv_trang', '123456', 'NhanVien'),
(9, 'nv_phuong', '123456', 'NhanVien'),
(10, 'nv_dat', '123456', 'NhanVien');

-- ==========================================
-- 16. DỮ LIỆU MẪU NHÂN VIÊN
-- ==========================================
INSERT INTO NhanVien (MaNhanVien, HoTen, Email, SDT, DiaChi, MaTaiKhoan) VALUES
(1, 'Nguyễn Văn Tuấn Cảnh', 'admin01@dacncafe.com', '0901234567', 'TP.HCM', 1),
(2, 'Trần Ngọc Lan', 'lan.tran@dacncafe.com', '0912345678', 'TP.HCM', 2),
(3, 'Lê Minh Tuấn', 'tuan.le@dacncafe.com', '0923456789', 'TP.HCM', 3),
(4, 'Phạm Hoàng Mai', 'mai.pham@dacncafe.com', '0934567890', 'TP.HCM', 4),
(5, 'Vũ Quốc Hoàng', 'hoang.vu@dacncafe.com', '0945678901', 'TP.HCM', 5),
(6, 'Đinh Mỹ Linh', 'linh.dinh@dacncafe.com', '0956789012', 'TP.HCM', 6),
(7, 'Bùi Văn Quang', 'quang.bui@dacncafe.com', '0967890123', 'TP.HCM', 7),
(8, 'Ngô Thùy Trang', 'trang.ngo@dacncafe.com', '0978901234', 'TP.HCM', 8),
(9, 'Lý Bích Phương', 'phuong.ly@dacncafe.com', '0989012345', 'TP.HCM', 9),
(10, 'Hồ Tấn Đạt', 'dat.ho@dacncafe.com', '0990123456', 'TP.HCM', 10);

-- ==========================================
-- 17a. DỮ LIỆU MẪU DANH MỤC ĐỒ UỐNG
-- ==========================================
INSERT INTO DanhMucDoUong (maDanhMuc, tenDanhMuc) VALUES
(1, 'Cà phê'),
(2, 'Trà'),
(3, 'Trà sữa'),
(4, 'Sinh tố & Nước ép'),
(5, 'Khác'),
(6, 'Matcha');

-- ==========================================
-- 17b. DỮ LIỆU MẪU ĐỒ UỐNG
-- ==========================================
INSERT INTO DoUong (maDoUong, tenDoUong, donGia, moTa, hinhAnh, danhMuc) VALUES
(1, 'Cà phê đen đá', 20000, 'Cà phê rang xay nguyên chất pha phin', 'cf_den.jpg', 1),
(2, 'Cà phê sữa đá', 25000, 'Cà phê phin kết hợp sữa đặc', 'cf_sua.jpg', 1),
(3, 'Bạc xỉu', 28000, 'Nhiều sữa ít cà phê', 'bac_xiu.jpg', 1),
(4, 'Cà phê muối', 30000, 'Cà phê kết hợp lớp kem muối', 'cf_muoi.jpg', 1),
(5, 'Espresso', 35000, 'Cà phê pha máy chuẩn Ý', 'espresso.jpg', 1),
(6, 'Americano', 35000, 'Espresso pha loãng với nước', 'americano.jpg', 1),
(7, 'Trà đào cam sả', 40000, 'Trà đào cam sả thanh mát', 'tra_dao.jpg', 2),
(8, 'Trà sen vàng', 45000, 'Trà oolong, hạt sen và kem macchiato', 'tra_sen_vang.jpg', 2),
(9, 'Trà vải nhiệt đới', 40000, 'Trà đen kết hợp trái vải', 'tra_vai_nhiet_doi.jpg', 2),
(10, 'Hồng trà chanh', 30000, 'Hồng trà pha chanh', 'hong_tra_chanh.jpg', 2),
(11, 'Trà sữa truyền thống', 35000, 'Trà sữa truyền thống với trân châu', 'ts_truyenthong.jpg', 3),
(12, 'Trà sữa Matcha', 40000, 'Matcha Nhật Bản và sữa tươi', 'ts_matcha.jpg', 3),
(13, 'Sinh tố bơ', 45000, 'Sinh tố bơ béo ngậy', 'st_bo.jpg', 4),
(14, 'Sinh tố dâu tây', 45000, 'Sinh tố dâu tây tươi mát', 'st_dau.jpg', 4),
(15, 'Nước ép dưa hấu', 35000, 'Nước ép dưa hấu nguyên chất', 'ep_duahau.jpg', 4),
(16, 'Nước ép cam cà rốt', 40000, 'Nước ép cam kết hợp cà rốt', 'ep_camcarot.jpg', 4),
(17, 'Sữa chua đá xay', 35000, 'Sữa chua đá xay mát lạnh', 'sc_da.jpg', 5),
(18, 'Cacao nóng', 35000, 'Cacao nguyên chất pha nóng', 'cacao.jpg', 5),
(19, 'Matcha đá xay', 50000, 'Matcha đá xay kèm whipping cream', 'matcha_blended.jpg', 6),
(20, 'Mocha đá xay', 50000, 'Cafe, socola và đá xay', 'mocha_blended.jpg', 1);

-- ==========================================
-- 18. DỮ LIỆU MẪU TOPPING
-- ==========================================
INSERT INTO Topping (maTopping, tenTopping, donGia, moTa) VALUES
(1, 'Trân châu đen', 5000, 'Topping trân châu truyền thống'),
(2, 'Trân châu trắng', 7000, 'Topping giòn dai'),
(3, 'Pudding trứng', 8000, 'Pudding mềm béo'),
(4, 'Thạch cà phê', 6000, 'Thạch vị cà phê'),
(5, 'Kem cheese', 10000, 'Lớp kem cheese béo mặn'),
(6, 'Nha đam', 7000, 'Nha đam thanh mát'),
(7, 'Thạch trái cây', 6000, 'Topping thạch trái cây'),
(8, 'Whipping cream', 10000, 'Kem béo dùng cho đồ uống đá xay');

-- ==========================================
-- 19. GÁN TOPPING CHO ĐỒ UỐNG
-- ==========================================

-- Trà đào cam sả
INSERT INTO DoUongTopping (maDoUong, maTopping) VALUES
(7, 2),
(7, 6),
(7, 7);

-- Trà sen vàng
INSERT INTO DoUongTopping (maDoUong, maTopping) VALUES
(8, 1),
(8, 2),
(8, 3),
(8, 5),
(8, 6);

-- Trà vải nhiệt đới
INSERT INTO DoUongTopping (maDoUong, maTopping) VALUES
(9, 2),
(9, 6),
(9, 7);

-- Hồng trà chanh
INSERT INTO DoUongTopping (maDoUong, maTopping) VALUES
(10, 2),
(10, 6),
(10, 7);

-- Trà sữa truyền thống
INSERT INTO DoUongTopping (maDoUong, maTopping) VALUES
(11, 1),
(11, 2),
(11, 3),
(11, 4),
(11, 5),
(11, 6);

-- Trà sữa Matcha
INSERT INTO DoUongTopping (maDoUong, maTopping) VALUES
(12, 1),
(12, 2),
(12, 3),
(12, 5);

-- Matcha đá xay
INSERT INTO DoUongTopping (maDoUong, maTopping) VALUES
(19, 3),
(19, 5),
(19, 8);

-- Mocha đá xay
INSERT INTO DoUongTopping (maDoUong, maTopping) VALUES
(20, 5),
(20, 8);

-- ==========================================
-- 20. DỮ LIỆU MẪU CA LÀM
-- ==========================================
INSERT INTO CaLamViec 
(tenCa, gioBatDau, gioKetThuc, ngayLam, trangThai, ghiChu, MaNhanVien, createdBy)
VALUES
('Ca Sáng', '2026-05-20 06:00:00', '2026-05-20 14:00:00', '2026-05-20', 'Đã đăng ký', 'Phụ trách quầy order và chuẩn bị nguyên liệu', 3, 1),
('Ca Tối', '2026-05-20 14:00:00', '2026-05-20 22:00:00', '2026-05-20', 'Đã đăng ký', 'Phụ trách phục vụ khách và kiểm kê cuối ngày', 4, 1),
('Ca Sáng', '2026-05-25 06:00:00', '2026-05-25 14:00:00', '2026-05-25', 'Chưa có nhân viên', 'Ca sáng cần nhân viên phục vụ quầy', NULL, 1),
('Ca Tối', '2026-05-25 14:00:00', '2026-05-25 22:00:00', '2026-05-25', 'Chưa có nhân viên', 'Ca tối cần nhân viên hỗ trợ đóng quán', NULL, 1),
('Ca Sáng', '2026-05-26 06:00:00', '2026-05-26 14:00:00', '2026-05-26', 'Chưa có nhân viên', 'Chuẩn bị nguyên liệu, mở quầy', NULL, 2),
('Ca Tối', '2026-05-26 14:00:00', '2026-05-26 22:00:00', '2026-05-26', 'Chưa có nhân viên', 'Phục vụ khách buổi tối', NULL, 2);

-- ==========================================
-- 21. DỮ LIỆU MẪU HÓA ĐƠN
-- ==========================================
INSERT INTO HoaDon (maHoaDon, ngaylap, trangthaithanhtoan, MaNhanVien) VALUES
(1, '2026-05-18 07:25:00', 'Đã thanh toán', 3),
(2, '2026-05-18 08:40:00', 'Đã thanh toán', 3),
(3, '2026-05-18 10:10:00', 'Đã thanh toán', 4),
(4, '2026-05-19 15:15:00', 'Đã thanh toán', 5),
(5, '2026-05-19 16:00:00', 'Chưa thanh toán', 6);

-- ==========================================
-- 22. DỮ LIỆU MẪU CHI TIẾT HÓA ĐƠN
-- Có maChiTietHoaDon riêng để gắn topping
-- ==========================================

-- Hóa đơn 1: 65.000
INSERT INTO ChiTietHoaDon 
(maChiTietHoaDon, maHoaDon, maDoUong, soluong, dongia, duong, da, size)
VALUES
(1, 1, 1, 2, 20000, '100%', '100%', 'M'),
(2, 1, 2, 1, 25000, '100%', '100%', 'M');

-- Hóa đơn 2: 80.000
INSERT INTO ChiTietHoaDon 
(maChiTietHoaDon, maHoaDon, maDoUong, soluong, dongia, duong, da, size)
VALUES
(3, 2, 7, 2, 40000, '70%', '50%', 'M');

-- Hóa đơn 3: 135.000
INSERT INTO ChiTietHoaDon 
(maChiTietHoaDon, maHoaDon, maDoUong, soluong, dongia, duong, da, size)
VALUES
(4, 3, 8, 1, 45000, '70%', '70%', 'M'),
(5, 3, 13, 2, 45000, '100%', '100%', 'M');

-- Hóa đơn 4: 50.000
INSERT INTO ChiTietHoaDon 
(maChiTietHoaDon, maHoaDon, maDoUong, soluong, dongia, duong, da, size)
VALUES
(6, 4, 2, 2, 25000, '100%', '100%', 'M');

-- Hóa đơn 5: có topping, chưa thanh toán
INSERT INTO ChiTietHoaDon 
(maChiTietHoaDon, maHoaDon, maDoUong, soluong, dongia, duong, da, size, ghiChu)
VALUES
(7, 5, 11, 2, 35000, '70%', '50%', 'M', 'Ít ngọt'),
(8, 5, 19, 1, 50000, '100%', '100%', 'M', 'Thêm kem');

-- ==========================================
-- 23. DỮ LIỆU MẪU TOPPING TRONG HÓA ĐƠN
-- ==========================================

-- Chi tiết hóa đơn 7:
-- Trà sữa truyền thống + trân châu đen + pudding
INSERT INTO ChiTietTopping 
(maChiTietHoaDon, maTopping, soLuong, donGia)
VALUES
(7, 1, 1, 5000),
(7, 3, 1, 8000);

-- Chi tiết hóa đơn 8:
-- Matcha đá xay + kem cheese
INSERT INTO ChiTietTopping 
(maChiTietHoaDon, maTopping, soLuong, donGia)
VALUES
(8, 5, 1, 10000);

-- ==========================================
-- 24. DỮ LIỆU MẪU THANH TOÁN
-- ==========================================
INSERT INTO ThanhToan 
(thoigianthanhtoan, sotien, phuongThuc, trangThai, maGiaoDich, maHoaDon)
VALUES
('2026-05-18 07:30:15', 65000, 'TienMat', 'ThanhCong', NULL, 1),
('2026-05-18 08:45:22', 80000, 'TienMat', 'ThanhCong', NULL, 2),
('2026-05-18 10:15:00', 135000, 'ChuyenKhoan', 'ThanhCong', 'CK_20260518_001', 3),
('2026-05-19 15:20:45', 50000, 'PAYOS', 'ThanhCong', 'PAYOS_20260519_001', 4);

-- ==========================================
-- 25. KIỂM TRA DỮ LIỆU SAU KHI TẠO
-- ==========================================

-- Xem hóa đơn và tổng tiền
SELECT 
    hd.maHoaDon,
    hd.ngaylap,
    nv.HoTen AS nhanVienLap,
    hd.tongtien,
    hd.trangthaithanhtoan
FROM HoaDon hd
JOIN NhanVien nv ON hd.MaNhanVien = nv.MaNhanVien
ORDER BY hd.maHoaDon;

-- Xem chi tiết hóa đơn kèm đồ uống
SELECT 
    cthd.maChiTietHoaDon,
    cthd.maHoaDon,
    du.tenDoUong,
    cthd.soluong,
    cthd.dongia,
    cthd.tongTienTopping,
    cthd.thanhtien,
    cthd.duong,
    cthd.da,
    cthd.size
FROM ChiTietHoaDon cthd
JOIN DoUong du ON cthd.maDoUong = du.maDoUong
ORDER BY cthd.maHoaDon, cthd.maChiTietHoaDon;

-- Xem topping theo từng món trong hóa đơn
SELECT 
    cthd.maHoaDon,
    cthd.maChiTietHoaDon,
    du.tenDoUong,
    tp.tenTopping,
    ctt.soLuong,
    ctt.donGia,
    ctt.thanhtien
FROM ChiTietTopping ctt
JOIN ChiTietHoaDon cthd ON ctt.maChiTietHoaDon = cthd.maChiTietHoaDon
JOIN DoUong du ON cthd.maDoUong = du.maDoUong
JOIN Topping tp ON ctt.maTopping = tp.maTopping
ORDER BY cthd.maHoaDon, cthd.maChiTietHoaDon;
