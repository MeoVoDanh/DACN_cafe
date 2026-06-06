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
    vaiTro VARCHAR(50) NOT NULL DEFAULT 'NhanVien' COMMENT 'Vai trò tài khoản',
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
        ON DELETE RESTRICT -- Đổi sang RESTRICT để tránh vô tình mất dữ liệu nhân sự và lịch sử hóa đơn liên quan
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
-- 3.5 BẢNG THÔNG BÁO
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
-- 4. BẢNG HÓA ĐƠN (Đã tích hợp PayOS)
-- ==========================================
CREATE TABLE HoaDon (
    maHoaDon INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính hóa đơn',
    ngaylap DATE NOT NULL COMMENT 'Ngày lập hóa đơn',
    tongtien DOUBLE DEFAULT 0 COMMENT 'Tổng tiền hóa đơn',
    trangthaithanhtoan ENUM('Chưa thanh toán', 'Đã thanh toán', 'Đã hủy') NOT NULL DEFAULT 'Chưa thanh toán',
    MaNhanVien INT NOT NULL COMMENT 'Nhân viên lập hóa đơn',
    payosOrderCode BIGINT NULL UNIQUE COMMENT 'Mã đơn hàng liên kết hệ thống PayOS',
    payosPaymentLinkId VARCHAR(255) NULL COMMENT 'Đường dẫn link thanh toán được PayOS tạo',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_hoadon_nhanvien
        FOREIGN KEY (MaNhanVien)
        REFERENCES NhanVien(MaNhanVien)
) COMMENT 'Bảng lưu thông tin hóa đơn';

-- ==========================================
-- 5. BẢNG THANH TOÁN (Đã cập nhật cổng VNPAY, PAYOS)
-- Quan hệ 1-1 với HoaDon
-- ==========================================
CREATE TABLE ThanhToan (
    maThanhToan INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính thanh toán',
thoigianthanhtoan DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian thanh toán',
    sotien DOUBLE NOT NULL COMMENT 'Số tiền thanh toán',
    phuongThuc ENUM('TienMat', 'ChuyenKhoan', 'The', 'VNPAY', 'PAYOS') DEFAULT 'PAYOS' COMMENT 'Phương thức giao dịch',
    maHoaDon INT NOT NULL COMMENT 'Mỗi hóa đơn chỉ có một giao dịch thanh toán thành công',

    CONSTRAINT uq_thanhtoan_mahoadon 
        UNIQUE KEY (maHoaDon),

    CONSTRAINT fk_thanhtoan_hoadon
        FOREIGN KEY (maHoaDon)
        REFERENCES HoaDon(maHoaDon)
        ON DELETE CASCADE
) COMMENT 'Bảng lưu thông tin thanh toán';

-- ==========================================
-- 5.5. BẢNG DANH MỤC ĐỒ UỐNG
-- ==========================================
CREATE TABLE DanhMucDoUong (
    maDanhMuc INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính danh mục',
    tenDanhMuc VARCHAR(100) NOT NULL UNIQUE COMMENT 'Tên danh mục đồ uống',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT 'Bảng lưu danh mục đồ uống';

-- ==========================================
-- 6. BẢNG ĐỒ UỐNG
-- ==========================================
CREATE TABLE DoUong (
    maDoUong INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Khóa chính đồ uống',
    tenDoUong VARCHAR(150) NOT NULL COMMENT 'Tên đồ uống',
    donGia DOUBLE NOT NULL COMMENT 'Giá bán',
    moTa TEXT NULL COMMENT 'Mô tả đồ uống',
    hinhAnh VARCHAR(255) DEFAULT NULL COMMENT 'Tên file hoặc đường dẫn hình ảnh',
    trangThai VARCHAR(50) DEFAULT 'Đang bán' COMMENT 'Trạng thái kinh doanh',
    danhMuc VARCHAR(100) DEFAULT 'Khác' COMMENT 'Danh mục đồ uống',
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
    thanhtien DOUBLE GENERATED ALWAYS AS (soluong * dongia) STORED COMMENT 'Thành tiền thực tế',
    duong VARCHAR(10) NOT NULL DEFAULT '100%' COMMENT 'Phần trăm đường',
    da VARCHAR(10) NOT NULL DEFAULT '100%' COMMENT 'Phần trăm đá',

    PRIMARY KEY (maHoaDon, maDoUong, duong, da),

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
-- 8. INDEX TỐI ƯU TRUY VẤN TỐC ĐỘ CAO
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
-- 8.5 TRIGGERS TỰ ĐỘNG CẬP NHẬT TỔNG TIỀN HÓA ĐƠN
-- ==========================================
DELIMITER $$

CREATE TRIGGER trg_AfterInsert_ChiTietHoaDon
AFTER INSERT ON ChiTietHoaDon
FOR EACH ROW
BEGIN
    UPDATE HoaDon 
    SET tongtien = (SELECT COALESCE(SUM(thanhtien), 0) FROM ChiTietHoaDon WHERE maHoaDon = NEW.maHoaDon)
    WHERE maHoaDon = NEW.maHoaDon;
END$$

CREATE TRIGGER trg_AfterUpdate_ChiTietHoaDon
AFTER UPDATE ON ChiTietHoaDon
FOR EACH ROW
BEGIN
    UPDATE HoaDon 
    SET tongtien = (SELECT COALESCE(SUM(thanhtien), 0) FROM ChiTietHoaDon WHERE maHoaDon = NEW.maHoaDon)
    WHERE maHoaDon = NEW.maHoaDon;
END$$

CREATE TRIGGER trg_AfterDelete_ChiTietHoaDon
AFTER DELETE ON ChiTietHoaDon
FOR EACH ROW
BEGIN
    UPDATE HoaDon 
    SET tongtien = (SELECT COALESCE(SUM(thanhtien), 0) FROM ChiTietHoaDon WHERE maHoaDon = OLD.maHoaDon)
    WHERE maHoaDon = OLD.maHoaDon;
END$$

DELIMITER ;


-- ==========================================
-- 9. DỮ LIỆU MẪU TÀI KHOẢN (Chỉ định rõ ID)
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
-- 10. DỮ LIỆU MẪU NHÂN VIÊN
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
-- 10.5. DỮ LIỆU MẪU DANH MỤC ĐỒ UỐNG
-- ==========================================
INSERT INTO DanhMucDoUong (maDanhMuc, tenDanhMuc) VALUES
(1, 'Cà phê'),
(2, 'Trà'),
(3, 'Trà sữa'),
(4, 'Sinh tố & Nước ép'),
(5, 'Matcha'),
(6, 'Khác');

-- ==========================================
-- 11. DỮ LIỆU MẪU ĐỒ UỐNG
-- ==========================================
INSERT INTO DoUong (maDoUong, tenDoUong, donGia, moTa, hinhAnh, danhMuc) VALUES
(1, 'Cà phê đen đá', 20000, 'Cà phê rang xay nguyên chất pha phin', 'cf_den.jpg', '1'),
(2, 'Cà phê sữa đá', 25000, 'Cà phê phin kết hợp sữa đặc', 'cf_sua.jpg', '1'),
(3, 'Bạc xỉu', 28000, 'Nhiều sữa ít cà phê', 'bac_xiu.jpg', '1'),
(4, 'Cà phê muối', 30000, 'Cà phê kết hợp lớp kem muối', 'cf_muoi.jpg', '1'),
(5, 'Espresso', 35000, 'Cà phê pha máy chuẩn Ý', 'espresso.jpg', '1'),
(6, 'Americano', 35000, 'Espresso pha loãng với nước', 'americano.jpg', '1'),
(7, 'Trà đào cam sả', 40000, 'Trà đào cam sả thanh mát', 'tra_dao.jpg', '2'),
(8, 'Trà sen vàng', 45000, 'Trà oolong, hạt sen và kem macchiato', 'tra_sen_vang.jpg', '2'),
(9, 'Trà vải nhiệt đới', 40000, 'Trà đen kết hợp trái vải', 'tra_vai_nhiet_doi.jpg', '2'),
(10, 'Hồng trà chanh', 30000, 'Hồng trà pha chanh', 'hong_tra_chanh.jpg', '2'),
(11, 'Trà sữa truyền thống', 35000, 'Trà sữa truyền thống với trân châu', 'ts_truyenthong.jpg', '3'),
(12, 'Trà sữa Matcha', 40000, 'Matcha Nhật Bản và sữa tươi', 'ts_matcha.jpg', '3'),
(13, 'Sinh tố bơ', 45000, 'Sinh tố bơ béo ngậy', 'st_bo.jpg', '4'),
(14, 'Sinh tố dâu tây', 45000, 'Sinh tố dâu tây tươi mát', 'st_dau.jpg', '4'),
(15, 'Nước ép dưa hấu', 35000, 'Nước ép dưa hấu nguyên chất', 'ep_duahau.jpg', '4'),
(16, 'Nước ép cam cà rốt', 40000, 'Nước ép cam kết hợp cà rốt', 'ep_camcarot.jpg', '4'),
(17, 'Sữa chua đá xay', 35000, 'Sữa chua đá xay mát lạnh', 'sc_da.jpg', '6'),
(18, 'Cacao nóng', 35000, 'Cacao nguyên chất pha nóng', 'cacao.jpg', '6'),
(19, 'Matcha đá xay', 50000, 'Matcha đá xay kèm whipping cream', 'matcha_blended.jpg', '5'),
(20, 'Mocha đá xay', 50000, 'Cafe, socola và đá xay', 'mocha_blended.jpg', '1');

-- ==========================================
-- 12. DỮ LIỆU MẪU CA LÀM
-- ==========================================
INSERT INTO CaLamViec 
(tenCa, gioBatDau, gioKetThuc, ngayLam, trangThai, ghiChu, MaNhanVien, createdBy)
VALUES
('Ca Sáng', '2026-05-20 06:00:00', '2026-05-20 14:00:00', '2026-05-20', 'Đã đăng ký', 'Phụ trách quầy order và dọn bàn khu vực trong nhà', 3, 1),
('Ca Tối', '2026-05-20 14:00:00', '2026-05-20 22:00:00', '2026-05-20', 'Đã đăng ký', 'Phụ trách phục vụ khách và kiểm kê cuối ngày', 4, 1),
('Ca Sáng', '2026-05-25 06:00:00', '2026-05-25 14:00:00', '2026-05-25', 'Chưa có nhân viên', 'Ca sáng cần nhân viên phục vụ quầy và dọn khu vực bàn', NULL, 1),
('Ca Tối', '2026-05-25 14:00:00', '2026-05-25 22:00:00', '2026-05-25', 'Chưa có nhân viên', 'Ca tối cần nhân viên phục vụ và hỗ trợ đóng quán', NULL, 1),
('Ca Sáng', '2026-05-26 06:00:00', '2026-05-26 14:00:00', '2026-05-26', 'Chưa có nhân viên', 'Chuẩn bị nguyên liệu, mở quầy, phục vụ khách buổi sáng', NULL, 2),
('Ca Tối', '2026-05-26 14:00:00', '2026-05-26 22:00:00', '2026-05-26', 'Chưa có nhân viên', 'Phục vụ khách buổi tối, vệ sinh khu vực làm việc', NULL, 2);

-- ==========================================
-- 13. DỮ LIỆU MẪU HÓA ĐƠN
-- ==========================================
INSERT INTO HoaDon (maHoaDon, ngaylap, trangthaithanhtoan, MaNhanVien) VALUES
(1, '2026-05-18', 'Đã thanh toán', 3),
(2, '2026-05-18', 'Đã thanh toán', 3),
(3, '2026-05-18', 'Đã thanh toán', 4),
(4, '2026-05-19', 'Đã thanh toán', 5),
(5, '2026-05-19', 'Chưa thanh toán', 6);

-- ==========================================
-- 14. DỮ LIỆU MẪU CHI TIẾT HÓA ĐƠN
-- Các triggers sẽ tự tính tổng tiền đổ vào bảng HoaDon
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
-- ==========================================
INSERT INTO ThanhToan (thoigianthanhtoan, sotien, phuongThuc, maHoaDon) VALUES
('2026-05-18 07:30:15', 65000, 'TienMat', 1),
('2026-05-18 08:45:22', 80000, 'TienMat', 2),
('2026-05-18 10:15:00', 135000, 'ChuyenKhoan', 3),
('2026-05-19 15:20:45', 50000, 'PAYOS', 4);