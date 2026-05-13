# 📦 Seed Data — Flight Booking System

Tài liệu này tổng hợp toàn bộ dữ liệu mẫu được tự động thêm vào database khi ứng dụng khởi động lần đầu tiên.  
Seed data chỉ chạy khi bảng đang **trống** (`AnyAsync() == false`), do đó sẽ không bị trùng lặp.

---

## 1. 🛫 Sân bay (Airports) — 12 bản ghi

| Code | Tên sân bay | Thành phố | Quốc gia |
|------|-------------|-----------|----------|
| SGN | Sân bay Quốc tế Tân Sơn Nhất | TP. Hồ Chí Minh | Vietnam |
| HAN | Sân bay Quốc tế Nội Bài | Hà Nội | Vietnam |
| DAD | Sân bay Quốc tế Đà Nẵng | Đà Nẵng | Vietnam |
| CXR | Sân bay Quốc tế Cam Ranh | Nha Trang | Vietnam |
| VCA | Sân bay Quốc tế Cần Thơ | Cần Thơ | Vietnam |
| HPH | Sân bay Cát Bi | Hải Phòng | Vietnam |
| HUI | Sân bay Phú Bài | Huế | Vietnam |
| VDH | Sân bay Đồng Hới | Quảng Bình | Vietnam |
| UIH | Sân bay Phù Cát | Quy Nhơn | Vietnam |
| PQC | Sân bay Quốc tế Phú Quốc | Phú Quốc | Vietnam |
| DIN | Sân bay Điện Biên Phủ | Điện Biên | Vietnam |
| VCS | Sân bay Côn Đảo | Côn Đảo | Vietnam |

---

## 2. ✈️ Hãng bay (Airlines) — 4 bản ghi

| ID | Code | Tên hãng | Quốc gia | Trạng thái |
|----|------|----------|----------|------------|
| 1 | VN | Vietnam Airlines | Vietnam | Approved |
| 2 | VJ | VietJet Air | Vietnam | Approved |
| 3 | BL | Bamboo Airways | Vietnam | Approved |
| 4 | QH | Vietravel Airlines | Vietnam | Approved |
| 5 | BN | Pacific Airlines | Vietnam | Approved |
| 6 | 0V | VASCO | Vietnam | Approved |
| 7 | SQ | Singapore Airlines | Singapore | Approved |

---

## 3. 🛩️ Máy bay (Aircrafts) — 12 bản ghi

| ID | Số đăng ký | Model | Số ghế | Hãng bay |
|----|-----------|-------|--------|----------|
| 1 | VN-A321-01 | Airbus A321 | 180 | Vietnam Airlines |
| 2 | VN-A321-02 | Airbus A321 | 180 | Vietnam Airlines |
| 3 | VN-B789-01 | Boeing 787-9 | 294 | Vietnam Airlines |
| 4 | VN-B789-02 | Boeing 787-9 | 294 | Vietnam Airlines |
| 5 | VJ-A320-01 | Airbus A320 | 180 | VietJet Air |
| 6 | VJ-A320-02 | Airbus A320 | 180 | VietJet Air |
| 7 | VJ-A321-01 | Airbus A321 | 220 | VietJet Air |
| 8 | BL-E190-01 | Embraer E190 | 100 | Bamboo Airways |
| 9 | BL-A319-01 | Airbus A319 | 144 | Bamboo Airways |
| 10 | BL-B789-01 | Boeing 787-9 | 280 | Bamboo Airways |
| 11 | QH-A320-01 | Airbus A320 | 180 | Vietravel Airlines |
| 12 | QH-A321-01 | Airbus A321 | 220 | Vietravel Airlines |
| 13 | BN-A320-01 | Airbus A320 | 180 | Pacific Airlines |
| 14 | BN-A320-02 | Airbus A320 | 180 | Pacific Airlines |
| 15 | 0V-ATR-01 | ATR 72-500 | 68 | VASCO |
| 16 | 0V-ATR-02 | ATR 72-500 | 68 | VASCO |
| 17 | SQ-B773-01 | Boeing 777-300ER | 396 | Singapore Airlines |
| 18 | SQ-A388-01 | Airbus A380-800 | 471 | Singapore Airlines |

### Cấu hình ghế (SeatConfiguration) — tự sinh theo máy bay

| Hạng vé | Layout | Hệ số giá (PriceMultiplier) | Số hàng (ước tính) |
|---------|--------|-----------------------------|--------------------|
| Business | 2-2 (A, C, D, F) | 2.5x | 2 hàng (máy bay < 200 ghế) / 4 hàng (≥ 200 ghế) |
| Economy | 3-3 (A, B, C, D, E, F) | 1.0x | Hàng còn lại |

---

## 4. 🗺️ Tuyến bay (Routes) — 12 bản ghi

| # | Điểm đi | Điểm đến | Khoảng cách | Thời gian bay |
|---|---------|----------|-------------|--------------|
| 1 | SGN | HAN | 1137 km | 125 phút |
| 2 | HAN | SGN | 1137 km | 125 phút |
| 3 | SGN | DAD | 748 km | 80 phút |
| 4 | DAD | SGN | 748 km | 80 phút |
| 5 | HAN | DAD | 606 km | 70 phút |
| 6 | DAD | HAN | 606 km | 70 phút |
| 7 | SGN | CXR | 316 km | 55 phút |
| 8 | SGN | PQC | 286 km | 50 phút |
| 9 | SGN | VCA | 165 km | 40 phút |
| 10 | HAN | HPH | 105 km | 35 phút |
| 11 | HAN | HUI | 580 km | 65 phút |
| 12 | DAD | CXR | 440 km | 60 phút |

---

## 5. 🛫 Chuyến bay (Flights) — 15 bản ghi

> Tất cả chuyến bay được lên lịch từ **ngày mai** (UTC), trạng thái `Scheduled`.

| Số hiệu | Tuyến | Máy bay | Giờ khởi hành | Giá cơ bản |
|---------|-------|---------|--------------|------------|
| VN201 | SGN → HAN | VN-A321-01 | 06:00 | 1.800.000 ₫ |
| VN202 | HAN → SGN | VN-A321-02 | 08:00 | 1.800.000 ₫ |
| VJ301 | SGN → HAN | VJ-A320-01 | 07:00 | 1.200.000 ₫ |
| VJ302 | HAN → SGN | VJ-A320-02 | 09:00 | 1.200.000 ₫ |
| VN203 | SGN → DAD | VN-B789-01 | 10:00 | 1.500.000 ₫ |
| BL401 | SGN → DAD | BL-E190-01 | 13:00 | 1.100.000 ₫ |
| VN204 | DAD → SGN | VN-A321-01 | 14:00 | 1.500.000 ₫ |
| VJ303 | HAN → DAD | VJ-A321-01 | 06:00 | 1.300.000 ₫ |
| BL402 | DAD → HAN | BL-A319-01 | 16:00 | 1.100.000 ₫ |
| VN205 | SGN → CXR | VN-A321-02 | 08:00 | 900.000 ₫ |
| VJ304 | SGN → PQC | VJ-A320-01 | 09:00 | 850.000 ₫ |
| QH501 | SGN → VCA | QH-A320-01 | 11:00 | 750.000 ₫ |
| VN206 | HAN → HPH | VN-B789-01 | 07:00 | 700.000 ₫ |
| BL403 | HAN → HUI | BL-B789-01 | 15:00 | 1.200.000 ₫ |
| QH502 | DAD → CXR | QH-A321-01 | 12:00 | 950.000 ₫ |

> **FlightSeats** được tự sinh từ `SeatConfiguration` của máy bay tương ứng, tất cả có trạng thái `Available`.

---

## 6. 🎒 Hành lý & Dịch vụ bổ sung

### Hành lý (BaggageAllowances) — 4 gói

| Gói | Hạng vé | Trọng lượng | Số kiện | Phí thêm |
|-----|---------|-------------|---------|----------|
| 1 | Economy | 15 kg | 1 | 150.000 ₫ |
| 2 | Economy | 20 kg | 1 | 200.000 ₫ |
| 3 | Economy | 25 kg | 2 | 300.000 ₫ |
| 4 | Economy | 30 kg | 2 | 450.000 ₫ |

### Dịch vụ bổ sung (AdditionalServices) — 3 dịch vụ

| ID | Loại | Tên dịch vụ | Giá |
|----|------|-------------|-----|
| 1 | meal | Suất ăn đặc biệt | 50.000 ₫ |
| 2 | insurance | Bảo hiểm du lịch | 120.000 ₫ |
| 3 | fasttrack | Dịch vụ Fast Track | 250.000 ₫ |

---

## 7. 👤 Tài khoản hệ thống

### Admin
| Email | Mật khẩu | Vai trò |
|-------|----------|---------|
| admin@skybooking.vn | *[Xem trong appsettings.Development.json]* | Admin |

### Airline Manager (1 tài khoản / hãng)

| Email | Mật khẩu | Hãng bay | Vai trò |
|-------|----------|----------|---------|
| manager.vn@skybooking.vn | *[Xem config]* | Vietnam Airlines | AirlineManager |
| manager.vj@skybooking.vn | *[Xem config]* | VietJet Air | AirlineManager |
| manager.bl@skybooking.vn | *[Xem config]* | Bamboo Airways | AirlineManager |
| manager.qh@skybooking.vn | *[Xem config]* | Vietravel Airlines | AirlineManager |
| manager.bn@skybooking.vn | *[Xem config]* | Pacific Airlines | AirlineManager |
| manager.0v@skybooking.vn | *[Xem config]* | VASCO | AirlineManager |
| manager.sq@skybooking.vn | *[Xem config]* | Singapore Airlines | AirlineManager |

> [!NOTE]
> Tất cả tài khoản Manager đã được liên kết với `AirlineId` tương ứng. Khi đăng nhập, hệ thống sẽ tự chuyển hướng đến `/partner` dashboard.

---

## 🔄 Cách seed data hoạt động

Seed data được khai báo trong `FlightBooking.API/Program.cs`, bên trong khối `if (app.Environment.IsDevelopment())`.  
Mỗi bảng được kiểm tra bằng `.AnyAsync()` trước khi thêm dữ liệu — **đảm bảo không bị duplicate** khi restart server.

**Thứ tự seed (quan trọng do ràng buộc khóa ngoại):**

```
Roles → Admin Account → BaggageAllowances → AdditionalServices
→ Airports → Airlines → Aircrafts + SeatConfigurations
→ Routes → Flights + FlightSeats → Manager Accounts
```
