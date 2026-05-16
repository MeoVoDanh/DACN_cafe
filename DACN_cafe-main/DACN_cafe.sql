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

-- ==========================================
-- 1. THÊM DỮ LIỆU BẢNG TÀI KHOẢN
-- ==========================================
INSERT INTO TaiKhoan (tenDangNhap, MatKhau, vaiTro) VALUES
('admin01', '123456', 'Admin'),      -- Pass: 123456 (MD5 giả lập)
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
-- 2. THÊM DỮ LIỆU BẢNG NHÂN VIÊN
-- Lưu ý: MaTaiKhoan từ 1 đến 10 tương ứng với bảng trên
-- ==========================================
INSERT INTO NhanVien (HoTen, Email, SDT, MaTaiKhoan) VALUES
('Nguyễn Văn Tuấn Cảnh', 'admin01@dacncafe.com', '0901234567', 1),
('Trần Ngọc Lan', 'lan.tran@dacncafe.com', '0912345678', 2),
('Lê Minh Tuấn', 'tuan.le@dacncafe.com', '0923456789', 3),
('Phạm Hoàng Mai', 'mai.pham@dacncafe.com', '0934567890', 4),
('Vũ Quốc Hoàng', 'hoang.vu@dacncafe.com', '0945678901', 5),
('Đinh Mỹ Linh', 'linh.dinh@dacncafe.com', '0956789012', 6),
('Bùi Văn Quang', 'quang.bui@dacncafe.com', '0967890123', 7),
('Ngô Thùy Trang', 'trang.ngo@dacncafe.com', '0978901234', 8),
('Lý Bích Phương', 'phuong.ly@dacncafe.com', '0989012345', 9),
('Hồ Tấn Đạt', 'dat.ho@dacncafe.com', '0990123456', 10);

-- ==========================================
-- 3. THÊM DỮ LIỆU BẢNG ĐỒ UỐNG (20 Món phong phú)
-- ==========================================
INSERT INTO DoUong (tenDoUong, donGia, moTa, hinhAnh) VALUES
('Cà phê đen đá', 20000, 'Cà phê rang xay nguyên chất pha phin', 'cf_den.jpg'),
('Cà phê sữa đá', 25000, 'Cà phê phin kết hợp sữa đặc Ông Thọ', 'cf_sua.jpg'),
('Bạc xỉu', 28000, 'Nhiều sữa ít cà phê, phù hợp cho phái nữ', 'bac_xiu.jpg'),
('Cà phê muối', 30000, 'Cà phê đậm vị kết hợp lớp kem muối béo ngậy', 'cf_muoi.jpg'),
('Espresso', 35000, 'Cà phê pha máy chuẩn Ý', 'espresso.jpg'),
('Americano', 35000, 'Espresso pha loãng với nước tinh khiết', 'americano.jpg'),
('Trà đào cam sả', 40000, 'Thanh mát giải nhiệt mùa hè', 'tra_dao.jpg'),
('Trà sen vàng', 45000, 'Trà oolong, hạt sen, củ năng và kem macchiato', 'tra_sen_vang.jpg'),
('Trà vải nhiệt đới', 40000, 'Trà đen hảo hạng kết hợp trái vải tươi', 'tra_vai_nhiet_doi.jpg'),
('Hồng trà chanh', 30000, 'Hồng trà pha chanh chua ngọt', 'hong_tra_chanh.jpg'),
('Trà sữa truyền thống', 35000, 'Trà sữa đậm vị trà, topping trân châu đen', 'ts_truyenthong.jpg'),
('Trà sữa Matcha', 40000, 'Bột matcha Nhật Bản và sữa tươi', 'ts_matcha.jpg'),
('Sinh tố bơ', 45000, 'Bơ sáp Đắk Lắk béo ngậy', 'st_bo.jpg'),
('Sinh tố dâu tây', 45000, 'Dâu tây Đà Lạt tươi mát', 'st_dau.jpg'),
('Nước ép dưa hấu', 35000, 'Ép dưa hấu nguyên chất không đường', 'ep_duahau.jpg'),
('Nước ép cam, cà rốt', 40000, 'Tăng cường sức đề kháng', 'ep_camcarot.jpg'),
('Sữa chua đá xay', 35000, 'Sữa chua lên men tự nhiên đánh đá', 'sc_da.jpg'),
('Cacao nóng', 35000, 'Bột cacao nguyên chất pha nóng', 'cacao.jpg'),
('Matcha đá xay', 50000, 'Matcha đá xay kèm whipping cream', 'matcha_blended.jpg'),
('Mocha đá xay', 50000, 'Sự kết hợp giữa cafe, socola và đá xay', 'mocha_blended.jpg');

-- ==========================================
-- 4. THÊM DỮ LIỆU BẢNG CA LÀM VIỆC
-- ==========================================
INSERT INTO CaLamViec (tenCa, gioBatDau, gioKetThuc, ngayLam, trangThai, MaNhanVien) VALUES
('Ca Sáng', '2024-05-01 06:00:00', '2024-05-01 14:00:00', '2024-05-01', 'Đã kết thúc', 3),
('Ca Sáng', '2024-05-01 06:00:00', '2024-05-01 14:00:00', '2024-05-01', 'Đã kết thúc', 4),
('Ca Tối', '2024-05-01 14:00:00', '2024-05-01 22:00:00', '2024-05-01', 'Đã kết thúc', 5),
('Ca Sáng', '2024-05-02 06:00:00', '2024-05-02 14:00:00', '2024-05-02', 'Đã kết thúc', 6),
('Ca Tối', '2024-05-02 14:00:00', '2024-05-02 22:00:00', '2024-05-02', 'Đã kết thúc', 7),
('Ca Sáng', '2024-05-03 06:00:00', '2024-05-03 14:00:00', '2024-05-03', 'Đã kết thúc', 3),
('Ca Tối', '2024-05-03 14:00:00', '2024-05-03 22:00:00', '2024-05-03', 'Đã kết thúc', 8),
('Ca Sáng', '2024-05-04 06:00:00', '2024-05-04 14:00:00', '2024-05-04', 'Đang làm', 4),
('Ca Tối', '2024-05-04 14:00:00', '2024-05-04 22:00:00', '2024-05-04', 'Chưa bắt đầu', 9),
('Ca Sáng', '2024-05-05 06:00:00', '2024-05-05 14:00:00', '2024-05-05', 'Chưa bắt đầu', 10);

-- ==========================================
-- 5. THÊM DỮ LIỆU BẢNG HÓA ĐƠN
-- Logic Tổng tiền khớp với CTHD ở dưới
-- ==========================================
INSERT INTO HoaDon (ngaylap, tongtien, trangthaithanhtoan, MaNhanVien) VALUES
('2024-05-01', 65000, 'Đã thanh toán', 3),  -- HD 1
('2024-05-01', 80000, 'Đã thanh toán', 3),  -- HD 2
('2024-05-01', 135000, 'Đã thanh toán', 4), -- HD 3
('2024-05-01', 50000, 'Đã thanh toán', 5),  -- HD 4
('2024-05-02', 120000, 'Đã thanh toán', 6), -- HD 5
('2024-05-02', 45000, 'Đã thanh toán', 6),  -- HD 6
('2024-05-02', 150000, 'Đã thanh toán', 7), -- HD 7
('2024-05-03', 70000, 'Đã thanh toán', 3),  -- HD 8
('2024-05-03', 95000, 'Chưa thanh toán', 8),-- HD 9 (Chưa thanh toán)
('2024-05-04', 100000, 'Đã thanh toán', 4); -- HD 10

-- ==========================================
-- 6. THÊM DỮ LIỆU BẢNG CHI TIẾT HÓA ĐƠN
-- (Mã Hóa Đơn, Mã Đồ Uống, Số Lượng, Đơn Giá, Thành Tiền)
-- ==========================================
INSERT INTO ChiTietHoaDon (maHoaDon, maDoUong, soluong, dongia, thanhtien) VALUES
-- Hóa đơn 1 (Tổng 65k)
(1, 1, 2, 20000, 40000), -- 2 Cà phê đen đá
(1, 2, 1, 25000, 25000), -- 1 Cà phê sữa đá

-- Hóa đơn 2 (Tổng 80k)
(2, 7, 2, 40000, 80000), -- 2 Trà đào cam sả

-- Hóa đơn 3 (Tổng 135k)
(3, 8, 1, 45000, 45000), -- 1 Trà sen vàng
(3, 13, 2, 45000, 90000),-- 2 Sinh tố bơ

-- Hóa đơn 4 (Tổng 50k)
(4, 2, 2, 25000, 50000), -- 2 Cà phê sữa đá

-- Hóa đơn 5 (Tổng 120k)
(5, 11, 2, 35000, 70000),-- 2 Trà sữa truyền thống
(5, 19, 1, 50000, 50000),-- 1 Matcha đá xay

-- Hóa đơn 6 (Tổng 45k)
(6, 14, 1, 45000, 45000), -- 1 Sinh tố dâu tây

-- Hóa đơn 7 (Tổng 150k)
(7, 20, 3, 50000, 150000),-- 3 Mocha đá xay

-- Hóa đơn 8 (Tổng 70k)
(8, 10, 1, 30000, 30000), -- 1 Hồng trà chanh
(8, 9, 1, 40000, 40000),  -- 1 Trà vải nhiệt đới

-- Hóa đơn 9 (Tổng 95k - Chưa thanh toán)
(9, 4, 1, 30000, 30000),  -- 1 Cà phê muối
(9, 15, 1, 35000, 35000), -- 1 Nước ép dưa hấu
(9, 3, 1, 30000, 30000),  -- 1 Bạc xỉu (Giả sử giá lúc này là 30k thay vì 28k)

-- Hóa đơn 10 (Tổng 100k)
(10, 19, 2, 50000, 100000);-- 2 Matcha đá xay

-- ==========================================
-- 7. THÊM DỮ LIỆU BẢNG THANH TOÁN
-- Lưu ý: Chỉ các hóa đơn 'Đã thanh toán' mới có dữ liệu ở đây
-- ==========================================
INSERT INTO ThanhToan (thoigianthanhtoan, sotien, maHoaDon) VALUES
('2024-05-01 07:30:15', 65000, 1),
('2024-05-01 08:45:22', 80000, 2),
('2024-05-01 10:15:00', 135000, 3),
('2024-05-01 15:20:45', 50000, 4),
('2024-05-02 09:10:30', 120000, 5),
('2024-05-02 11:05:12', 45000, 6),
('2024-05-02 19:40:05', 150000, 7),
('2024-05-03 08:25:50', 70000, 8),
-- Bỏ qua hóa đơn 9 vì trạng thái là 'Chưa thanh toán'
('2024-05-04 07:15:20', 100000, 10);
