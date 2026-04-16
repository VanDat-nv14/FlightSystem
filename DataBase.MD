    # 📚 Flight Booking System - Database Documentation

    > **Dự án**: Hệ thống Đặt Vé Máy Bay Trực Tuyến
    > **Công nghệ**: ASP.NET Core 8.0, Entity Framework Core, SQL Server
    > **Phương pháp**: Code-First Approach
    > **Ngày cập nhật**: 31/01/2026

    ---

    ## 📋 Mục Lục

    1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
    2. [Kiến trúc cơ sở dữ liệu](#2-kiến-trúc-cơ-sở-dữ-liệu)
    3. [Chi tiết các bảng (Tables)](#3-chi-tiết-các-bảng-tables)
    4. [Mối quan hệ giữa các bảng](#4-mối-quan-hệ-giữa-các-bảng)
    5. [Enumerations (Enums)](#5-enumerations-enums)
    6. [Nghiệp vụ chính](#6-nghiệp-vụ-chính)
    7. [Luồng xử lý (Workflows)](#7-luồng-xử-lý-workflows)
    8. [Indexes và Performance](#8-indexes-và-performance)

    ---

    ## 1. Tổng quan hệ thống

    ### 🎯 Mục đích

    Hệ thống quản lý toàn bộ quy trình đặt vé máy bay trực tuyến, từ tìm kiếm chuyến bay, đặt chỗ, thanh toán, đến quản lý hành lý, chương trình khách hàng thân thiết và hoàn tiền.

    ### 👥 Vai trò người dùng

    - **Customer**: Khách hàng đặt vé
    - **Admin**: Quản trị viên hệ thống
    - **Employee**: Nhân viên hãng hàng không

    ### 📊 Thống kê Database

    - **Tổng số bảng**: 25+ entities
    - **ASP.NET Identity Tables**: 7 bảng (AspNetUsers, AspNetRoles, etc.)
    - **Custom Entities**: 19 bảng chính
    - **Enums**: 13 loại

    ---

    ## 2. Kiến trúc cơ sở dữ liệu

    ### 🏗️ Cấu trúc theo Phases

    Database được tổ chức thành 3 phases phát triển:

    #### **Phase 1: Core System** (Hệ thống cốt lõi)

    - ✈️ **Flight Management**: Airports, Airlines, Aircrafts, Routes, Flights
    - 🎫 **Booking System**: Bookings, Tickets, FlightSeats
    - 👤 **User Management**: Users (ASP.NET Identity)

    #### **Phase 2: Essential Features** (Tính năng thiết yếu)

    - 💳 **Payment System**: Payments, Refunds
    - 🧳 **Passenger Management**: Passengers
    - 📋 **Audit & Logging**: AuditLogs

    #### **Phase 3: Advanced Features** (Tính năng nâng cao)

    - 📅 **Flight Scheduling**: FlightSchedules
    - 💺 **Seat Management**: SeatConfigurations, BaggageAllowances
    - ❌ **Cancellation**: CancellationPolicies, BookingCancellations
    - 🔄 **Ticket Changes**: TicketChanges
    - ⭐ **Loyalty Program**: LoyaltyAccounts, MileageTransactions
    - 👥 **Group Booking**: GroupBookings
    - 🔔 **Notifications**: NotificationLogs

    ---

    ## 3. Chi tiết các bảng (Tables)

    ### 3.1. 👤 User Management

    #### **Users** (extends ASP.NET Identity)

    Quản lý thông tin người dùng trong hệ thống.

    | Column       | Type        | Description                       | Constraints        |
    | ------------ | ----------- | --------------------------------- | ------------------ |
    | Id           | int         | Primary Key                       | PK, Auto-increment |
    | Email        | string      | Email đăng nhập                   | Unique, Required   |
    | PasswordHash | string      | Mật khẩu đã mã hóa                | Identity managed   |
    | PhoneNumber  | string      | Số điện thoại                     |                    |
    | FullName     | string(100) | Họ tên đầy đủ                     | Required           |
    | Role         | UserRole    | Vai trò (Customer/Admin/Employee) | Default: Customer  |
    | CreatedAt    | DateTime    | Thời gian tạo                     | Default: UtcNow    |
    | UpdatedAt    | DateTime?   | Thời gian cập nhật                | Nullable           |

    **Indexes**:

    - Unique index trên `Email`

    **Relationships**:

    - 1 User → N Bookings
    - 1 User → N Passengers
    - 1 User → 1 LoyaltyAccount (optional)
    - 1 User → 1 UserProfile (optional)
    - 1 User → N UserAddresses
    - 1 User → 1 UserPreferences (optional)
    - 1 User → N UserSessions
    - 1 User → N UserLoginHistories
    - 1 User → N SavedPassengers
    - 1 User → N UserPaymentMethods

    ---

    #### **UserProfiles**

    Thông tin hồ sơ mở rộng của người dùng (tách khỏi Identity để dễ mở rộng).

    | Column      | Type        | Description                        | Constraints        |
    | ----------- | ----------- | ---------------------------------- | ------------------ |
    | Id          | int         | Primary Key                        | PK, Auto-increment |
    | UserId      | int         | Người dùng                         | FK → Users, Unique |
    | AvatarUrl   | string?     | Link ảnh đại diện                  | Nullable           |
    | DateOfBirth | DateTime?   | Ngày sinh                          | Nullable           |
    | Gender      | Gender?     | Giới tính (Male/Female/Other)      | Nullable           |
    | Nationality | string(100)?| Quốc tịch                          | Nullable           |
    | IdCardNumber| string(20)? | Số CCCD/CMND                       | Nullable, Indexed  |
    | PassportNumber | string(20)? | Số hộ chiếu                    | Nullable, Indexed  |
    | PassportExpiry | DateTime?  | Ngày hết hạn hộ chiếu           | Nullable           |
    | UpdatedAt   | DateTime?   | Thời gian cập nhật hồ sơ           | Nullable           |

    **Indexes**:

    - Unique index trên `UserId`
    - Index trên `IdCardNumber`
    - Index trên `PassportNumber`

    **Business Rules**:

    - Quan hệ 1:1 với Users, tự động tạo khi user đăng ký
    - PassportExpiry phải lớn hơn ngày hiện tại nếu được điền

    ---

    #### **UserAddresses**

    Địa chỉ của người dùng (có thể lưu nhiều địa chỉ).

    | Column      | Type        | Description                          | Constraints        |
    | ----------- | ----------- | ------------------------------------ | ------------------ |
    | Id          | int         | Primary Key                          | PK, Auto-increment |
    | UserId      | int         | Người dùng                           | FK → Users         |
    | AddressType | AddressType | Loại (Home/Work/Other)               | Required           |
    | Label       | string(50)? | Nhãn tùy chỉnh (VD: "Nhà mẹ")       | Nullable           |
    | FullAddress | string(255) | Địa chỉ đầy đủ                       | Required           |
    | Ward        | string(100)?| Phường/Xã                            | Nullable           |
    | District    | string(100)?| Quận/Huyện                           | Nullable           |
    | City        | string(100) | Thành phố/Tỉnh                       | Required           |
    | Country     | string(100) | Quốc gia                             | Required           |
    | PostalCode  | string(20)? | Mã bưu chính                         | Nullable           |
    | IsDefault   | bool        | Địa chỉ mặc định                     | Default: false     |
    | CreatedAt   | DateTime    | Thời gian tạo                        | Default: UtcNow    |

    **Business Rules**:

    - Mỗi User chỉ có 1 địa chỉ `IsDefault = true` tại một thời điểm
    - Khi đặt IsDefault = true cho một địa chỉ, tự động đặt false cho các địa chỉ khác cùng User

    ---

    #### **UserPreferences**

    Cài đặt và tùy chỉnh cá nhân của người dùng.

    | Column              | Type   | Description                            | Constraints        |
    | ------------------- | ------ | -------------------------------------- | ------------------ |
    | Id                  | int    | Primary Key                            | PK, Auto-increment |
    | UserId              | int    | Người dùng                             | FK → Users, Unique |
    | Language            | string | Ngôn ngữ ưa thích (vi/en)              | Default: "vi"      |
    | Currency            | Currency | Tiền tệ ưa thích (VND/USD/EUR)       | Default: VND       |
    | Timezone            | string | Múi giờ (VD: "Asia/Ho_Chi_Minh")      | Default: UTC+7     |
    | EmailNotification   | bool   | Nhận thông báo qua email               | Default: true      |
    | SmsNotification     | bool   | Nhận thông báo qua SMS                 | Default: true      |
    | PushNotification    | bool   | Nhận thông báo đẩy (mobile/web)        | Default: true      |
    | MarketingEmails     | bool   | Nhận email khuyến mãi                  | Default: false     |
    | UpdatedAt           | DateTime? | Thời gian cập nhật                  | Nullable           |

    **Indexes**:

    - Unique index trên `UserId`

    **Business Rules**:

    - Tự động tạo với giá trị mặc định khi user đăng ký
    - Language phải là mã ISO 639-1 hợp lệ

    ---

    #### **UserSessions**

    Quản lý phiên đăng nhập và Refresh Token (JWT).

    | Column       | Type      | Description                     | Constraints        |
    | ------------ | --------- | ------------------------------- | ------------------ |
    | Id           | int       | Primary Key                     | PK, Auto-increment |
    | UserId       | int       | Người dùng                      | FK → Users         |
    | RefreshToken | string    | Refresh token (hash)            | Unique, Required   |
    | DeviceInfo   | string?   | Thông tin thiết bị (User-Agent) | Nullable           |
    | DeviceType   | DeviceType? | Loại thiết bị (Web/iOS/Android)| Nullable           |
    | IpAddress    | string?   | Địa chỉ IP đăng nhập            | Nullable           |
    | CreatedAt    | DateTime  | Thời gian tạo phiên             | Default: UtcNow    |
    | ExpiresAt    | DateTime  | Thời gian hết hạn token         | Required           |
    | IsRevoked    | bool      | Đã thu hồi                      | Default: false     |
    | RevokedAt    | DateTime? | Thời gian thu hồi               | Nullable           |
    | RevokedReason| string?   | Lý do thu hồi                   | Nullable           |

    **Indexes**:

    - Unique index trên `RefreshToken`
    - Index trên `(UserId, IsRevoked)` để query session đang hoạt động

    **Business Rules**:

    - Mỗi lần đăng nhập tạo 1 session mới
    - Logout → IsRevoked = true
    - Cron job dọn dẹp các token hết hạn định kỳ
    - Refresh token phải được hash trước khi lưu (bảo mật)

    ---

    #### **UserLoginHistories**

    Lịch sử đăng nhập để theo dõi bảo mật.

    | Column      | Type        | Description                           | Constraints        |
    | ----------- | ----------- | ------------------------------------- | ------------------ |
    | Id          | int         | Primary Key                           | PK, Auto-increment |
    | UserId      | int?        | Người dùng (null nếu email không tồn tại) | FK → Users, Nullable |
    | Email       | string      | Email đăng nhập                       | Required           |
    | LoginAt     | DateTime    | Thời gian thử đăng nhập               | Default: UtcNow    |
    | IpAddress   | string?     | Địa chỉ IP                            | Nullable           |
    | DeviceInfo  | string?     | Thông tin thiết bị                    | Nullable           |
    | Status      | LoginStatus | Kết quả (Success/Failed/Locked)       | Required           |
    | FailReason  | string?     | Lý do thất bại                        | Nullable           |

    **Indexes**:

    - Index trên `(UserId, LoginAt)` để query lịch sử gần đây
    - Index trên `IpAddress` để phát hiện tấn công brute-force

    **Business Rules**:

    - Ghi log kể cả khi đăng nhập thất bại (UserId = null)
    - Sau 5 lần thất bại liên tiếp → Status = Locked, khóa tài khoản
    - Dữ liệu có thể xóa sau 90 ngày để tiết kiệm bộ nhớ

    ---

    #### **SavedPassengers**

    Hành khách thường dùng — cho phép điền nhanh thông tin khi đặt vé.

    | Column         | Type      | Description                      | Constraints        |
    | -------------- | --------- | -------------------------------- | ------------------ |
    | Id             | int       | Primary Key                      | PK, Auto-increment |
    | UserId         | int       | Người sở hữu                     | FK → Users         |
    | Nickname       | string(50)| Tên gợi nhớ (VD: "Vợ", "Con trai")| Required          |
    | FullName       | string(100)| Họ tên hành khách               | Required           |
    | DateOfBirth    | DateTime  | Ngày sinh                        | Required           |
    | Gender         | Gender    | Giới tính                        | Required           |
    | Nationality    | string(100)| Quốc tịch                       | Required           |
    | IdCardNumber   | string(20)?| Số CCCD/CMND                    | Nullable           |
    | PassportNumber | string(20)?| Số hộ chiếu                     | Nullable           |
    | PassportExpiry | DateTime? | Ngày hết hạn hộ chiếu            | Nullable           |
    | IsDefault      | bool      | Hành khách mặc định (là chính chủ)| Default: false    |
    | CreatedAt      | DateTime  | Thời gian tạo                    | Default: UtcNow    |

    **Business Rules**:

    - Khác với bảng `Passengers` (dữ liệu đặt vé thực tế): bảng này là "danh bạ" cá nhân
    - Khi đặt vé, user chọn từ SavedPassengers → tạo Passenger thực trong Booking
    - Mỗi User có tối đa 10 SavedPassengers
    - `IsDefault = true` thường là thông tin của chính user đó

    ---

    #### **UserPaymentMethods**

    Phương thức thanh toán đã lưu để thanh toán nhanh.

    | Column          | Type          | Description                           | Constraints        |
    | --------------- | ------------- | ------------------------------------- | ------------------ |
    | Id              | int           | Primary Key                           | PK, Auto-increment |
    | UserId          | int           | Người dùng                            | FK → Users         |
    | Method          | PaymentMethod | Loại (CreditCard/BankTransfer/Momo/ZaloPay) | Required     |
    | DisplayName     | string(100)   | Tên hiển thị (VD: "Vietcombank *1234")| Required           |
    | CardLastFour    | string(4)?    | 4 số cuối thẻ                         | Nullable           |
    | CardBrand       | string(50)?   | Thương hiệu thẻ (Visa/Mastercard/JCB) | Nullable           |
    | CardHolderName  | string(100)?  | Tên chủ thẻ                           | Nullable           |
    | CardExpiryMonth | int?          | Tháng hết hạn thẻ                     | 1-12, Nullable     |
    | CardExpiryYear  | int?          | Năm hết hạn thẻ                       | Nullable           |
    | BankName        | string(100)?  | Tên ngân hàng                         | Nullable           |
    | AccountNumber   | string(50)?   | Số tài khoản (masked)                 | Nullable           |
    | GatewayToken    | string?       | Token lưu từ payment gateway          | Nullable           |
    | IsDefault       | bool          | Phương thức mặc định                  | Default: false     |
    | CreatedAt       | DateTime      | Thời gian lưu                         | Default: UtcNow    |

    **Business Rules**:

    - **Không lưu số thẻ đầy đủ** — chỉ lưu 4 số cuối và GatewayToken (PCI-DSS compliance)
    - GatewayToken do cổng thanh toán cấp (VD: Stripe customer_id, VNPay token)
    - Mỗi User chỉ có 1 phương thức `IsDefault = true`
    - Xóa mềm (IsRevoked) thay vì xóa cứng để giữ lịch sử

    ---

    ### 🔐 Enums bổ sung cho User Management

    #### **AddressType**

    ```csharp
    Home = 0        // Nhà riêng
    Work = 1        // Nơi làm việc
    Other = 2       // Khác
    ```

    #### **DeviceType**

    ```csharp
    Web = 0         // Trình duyệt web
    iOS = 1         // Ứng dụng iOS
    Android = 2     // Ứng dụng Android
    ```

    #### **LoginStatus**

    ```csharp
    Success = 0     // Đăng nhập thành công
    Failed = 1      // Sai thông tin đăng nhập
    Locked = 2      // Tài khoản bị khóa
    ```

    ---

    ### 📊 ER Diagram bổ sung (User Management)

    ```
    Users (1) ─────── (1) UserProfiles
         │
         ├──────< (N) UserAddresses
         │
         ├──────── (1) UserPreferences
         │
         ├──────< (N) UserSessions
         │
         ├──────< (N) UserLoginHistories
         │
         ├──────< (N) SavedPassengers
         │
         └──────< (N) UserPaymentMethods
    ```

    ### 📋 Relationship Summary bổ sung

    | Parent | Child               | Type | Delete Behavior |
    | ------ | ------------------- | ---- | --------------- |
    | Users  | UserProfiles        | 1:1  | Cascade         |
    | Users  | UserAddresses       | 1:N  | Cascade         |
    | Users  | UserPreferences     | 1:1  | Cascade         |
    | Users  | UserSessions        | 1:N  | Cascade         |
    | Users  | UserLoginHistories  | 1:N  | Restrict        |
    | Users  | SavedPassengers     | 1:N  | Cascade         |
    | Users  | UserPaymentMethods  | 1:N  | Cascade         |

    ---

    ### 3.2. ✈️ Flight Management

    #### **Airports**

    Thông tin sân bay trên toàn thế giới.

    | Column  | Type      | Description            | Constraints        |
    | ------- | --------- | ---------------------- | ------------------ |
    | Id      | int       | Primary Key            | PK, Auto-increment |
    | Code    | string(3) | Mã IATA (VD: SGN, HAN) | Unique, Required   |
    | Name    | string    | Tên sân bay            | Required           |
    | City    | string    | Thành phố              | Required           |
    | Country | string    | Quốc gia               | Required           |

    **Business Rules**:

    - Mã IATA phải là 3 ký tự chuẩn quốc tế
    - Mỗi sân bay có mã duy nhất

    ---

    #### **Airlines**

    Thông tin hãng hàng không.

    | Column  | Type   | Description          | Constraints        |
    | ------- | ------ | -------------------- | ------------------ |
    | Id      | int    | Primary Key          | PK, Auto-increment |
    | Code    | string | Mã hãng (VD: VN, VJ) | Required           |
    | Name    | string | Tên hãng             | Required           |
    | LogoUrl | string | Link logo hãng       |                    |

    **Relationships**:

    - 1 Airline → N Aircrafts

    ---

    #### **Aircrafts**

    Thông tin máy bay thuộc các hãng.

    | Column     | Type   | Description                   | Constraints        |
    | ---------- | ------ | ----------------------------- | ------------------ |
    | Id         | int    | Primary Key                   | PK, Auto-increment |
    | Model      | string | Kiểu máy bay (VD: Boeing 787) | Required           |
    | TotalSeats | int    | Tổng số ghế                   | > 0                |
    | AirlineId  | int    | Foreign Key → Airlines        | Required           |

    **Relationships**:

    - N Aircrafts → 1 Airline
    - 1 Aircraft → N SeatConfigurations
    - 1 Aircraft → N Flights

    ---

    #### **Routes**

    Tuyến bay giữa 2 sân bay.

    | Column               | Type     | Description           | Constraints        |
    | -------------------- | -------- | --------------------- | ------------------ |
    | Id                   | int      | Primary Key           | PK, Auto-increment |
    | OriginAirportId      | int      | Sân bay đi            | FK → Airports      |
    | DestinationAirportId | int      | Sân bay đến           | FK → Airports      |
    | Duration             | TimeSpan | Thời gian bay dự kiến | Required           |

    **Business Rules**:

    - Origin ≠ Destination
    - DeleteBehavior.Restrict để tránh xóa nhầm sân bay đang có tuyến bay

    **Relationships**:

    - N Routes → 1 OriginAirport
    - N Routes → 1 DestinationAirport
    - 1 Route → N Flights

    ---

    #### **FlightSchedules**

    Lịch bay định kỳ (cho các chuyến bay thường xuyên).

    | Column       | Type      | Description               | Constraints        |
    | ------------ | --------- | ------------------------- | ------------------ |
    | Id           | int       | Primary Key               | PK, Auto-increment |
    | FlightNumber | string    | Mã chuyến bay (VD: VN123) | Indexed            |
    | DaysOfWeek   | string    | Ngày bay trong tuần       | JSON/String        |
    | StartDate    | DateTime  | Ngày bắt đầu              | Required           |
    | EndDate      | DateTime? | Ngày kết thúc             | Nullable           |

    **Relationships**:

    - 1 FlightSchedule → N Flights

    ---

    #### **Flights**

    Chuyến bay cụ thể.

    | Column        | Type         | Description                                        | Constraints          |
    | ------------- | ------------ | -------------------------------------------------- | -------------------- |
    | Id            | int          | Primary Key                                        | PK, Auto-increment   |
    | RouteId       | int          | Tuyến bay                                          | FK → Routes          |
    | AircraftId    | int          | Máy bay                                            | FK → Aircrafts       |
    | ScheduleId    | int?         | Lịch bay (nếu có)                                  | FK → FlightSchedules |
    | DepartureTime | DateTime     | Thời gian khởi hành                                | Required             |
    | ArrivalTime   | DateTime     | Thời gian đến                                      | Required             |
    | Status        | FlightStatus | Trạng thái (Scheduled/Delayed/Cancelled/Completed) | Required             |

    **Indexes**:

    - Composite index trên `(DepartureTime, RouteId)` để tối ưu tìm kiếm

    **Business Rules**:

    - ArrivalTime > DepartureTime
    - Không thể xóa Route hoặc Aircraft nếu đang có Flight sử dụng

    ---

    ### 3.3. 💺 Seat Management

    #### **SeatConfigurations**

    Cấu hình ghế cố định của máy bay.

    | Column     | Type          | Description                            | Constraints        |
    | ---------- | ------------- | -------------------------------------- | ------------------ |
    | Id         | int           | Primary Key                            | PK, Auto-increment |
    | AircraftId | int           | Máy bay                                | FK → Aircrafts     |
    | SeatNumber | string        | Số ghế (VD: 12A)                       | Required           |
    | ClassType  | SeatClassType | Hạng ghế (Economy/Business/FirstClass) | Required           |
    | Position   | SeatPosition  | Vị trí (Window/Middle/Aisle)           | Required           |

    **Indexes**:

    - Unique index trên `(AircraftId, SeatNumber)`

    **Business Rules**:

    - Mỗi máy bay có cấu hình ghế riêng
    - Số ghế không được trùng trong cùng một máy bay

    ---

    #### **FlightSeats**

    Ghế cụ thể cho mỗi chuyến bay (có giá và trạng thái).

    | Column     | Type          | Description                            | Constraints        |
    | ---------- | ------------- | -------------------------------------- | ------------------ |
    | Id         | int           | Primary Key                            | PK, Auto-increment |
    | FlightId   | int           | Chuyến bay                             | FK → Flights       |
    | SeatNumber | string        | Số ghế                                 | Required           |
    | ClassType  | SeatClassType | Hạng ghế                               | Required           |
    | Price      | decimal(18,2) | Giá vé                                 | > 0                |
    | Status     | SeatStatus    | Trạng thái (Available/Reserved/Booked) | Concurrency Token  |

    **Indexes**:

    - Unique index trên `(FlightId, SeatNumber)`

    **Business Rules**:

    - Optimistic Concurrency Control để tránh double booking
    - Status là ConcurrencyToken

    ---

    ### 3.4. 🎫 Booking System

    #### **Passengers**

    Thông tin hành khách.

    | Column         | Type     | Description                   | Constraints        |
    | -------------- | -------- | ----------------------------- | ------------------ |
    | Id             | int      | Primary Key                   | PK, Auto-increment |
    | UserId         | int      | Người đặt vé                  | FK → Users         |
    | FullName       | string   | Họ tên hành khách             | Required           |
    | PassportNumber | string   | Số hộ chiếu/CCCD              | Required, Indexed  |
    | Nationality    | string   | Quốc tịch                     | Required           |
    | DateOfBirth    | DateTime | Ngày sinh                     | Required           |
    | Gender         | Gender   | Giới tính (Male/Female/Other) | Required           |

    **Business Rules**:

    - Một User có thể tạo nhiều Passenger (đặt vé cho người khác)
    - PassportNumber được indexed để tra cứu nhanh

    ---

    #### **Bookings**

    Đơn đặt vé.

    | Column          | Type          | Description                                        | Constraints        |
    | --------------- | ------------- | -------------------------------------------------- | ------------------ |
    | Id              | int           | Primary Key                                        | PK, Auto-increment |
    | UserId          | int           | Người đặt                                          | FK → Users         |
    | BookingDate     | DateTime      | Thời gian đặt                                      | Default: UtcNow    |
    | TotalAmount     | decimal(18,2) | Tổng tiền                                          | > 0                |
    | Status          | BookingStatus | Trạng thái (Pending/Confirmed/Cancelled/Completed) | Required           |
    | BookingType     | BookingType   | Loại (OneWay/RoundTrip)                            | Default: OneWay    |
    | ReturnBookingId | int?          | ID booking về (nếu khứ hồi)                        | FK → Bookings      |
    | GroupBookingId  | int?          | ID đặt vé nhóm                                     | FK → GroupBookings |

    **Relationships**:

    - 1 Booking → N Tickets
    - 1 Booking → N Payments
    - 1 Booking → N BookingBaggages
    - 1 Booking → 1 ReturnBooking (self-reference cho khứ hồi)
    - N Bookings → 1 GroupBooking

    **Business Rules**:

    - Booking khứ hồi: OutboundBooking.ReturnBookingId → ReturnBooking.Id
    - DeleteBehavior.Restrict trên ReturnBooking để tránh xóa nhầm

    ---

    #### **Tickets**

    Vé cụ thể cho từng hành khách.

    | Column        | Type          | Description                   | Constraints           |
    | ------------- | ------------- | ----------------------------- | --------------------- |
    | Id            | int           | Primary Key                   | PK, Auto-increment    |
    | BookingId     | int           | Đơn đặt vé                    | FK → Bookings         |
    | FlightSeatId  | int           | Ghế đã đặt                    | FK → FlightSeats      |
    | PassengerId   | int           | Hành khách                    | FK → Passengers       |
    | CheckInStatus | CheckInStatus | Trạng thái check-in           | Default: NotCheckedIn |
    | CheckInTime   | DateTime?     | Thời gian check-in            | Nullable              |
    | BoardingPass  | string?       | Mã boarding pass (QR/Barcode) | Nullable              |

    **Deprecated Fields**:

    - `PassengerName`, `PassengerDoB`, `PassportNumber` (Sử dụng Passenger thay thế)

    **Business Rules**:

    - 1 Booking có thể có nhiều Ticket (nhiều hành khách)
    - DeleteBehavior.Restrict trên Passenger để tránh xóa thông tin hành khách đã bay

    ---

    ### 3.5. 💳 Payment System

    #### **Payments**

    Thanh toán cho đơn đặt vé.

    | Column        | Type          | Description                                        | Constraints        |
    | ------------- | ------------- | -------------------------------------------------- | ------------------ |
    | Id            | int           | Primary Key                                        | PK, Auto-increment |
    | BookingId     | int           | Đơn đặt vé                                         | FK → Bookings      |
    | Amount        | decimal(18,2) | Số tiền                                            | > 0                |
    | Currency      | Currency      | Loại tiền (VND/USD/EUR)                            | Default: VND       |
    | Method        | PaymentMethod | Phương thức (CreditCard/BankTransfer/Momo/ZaloPay) | Required           |
    | Status        | PaymentStatus | Trạng thái                                         | Default: Pending   |
    | TransactionId | string        | Mã giao dịch từ gateway                            | Unique, Nullable   |
    | PaidAt        | DateTime?     | Thời gian thanh toán                               | Nullable           |
    | FailureReason | string?       | Lý do thất bại                                     | Nullable           |

    **Indexes**:

    - Unique index trên `TransactionId`

    **Relationships**:

    - N Payments → 1 Booking
    - 1 Payment → N Refunds

    **Business Rules**:

    - Một Booking có thể có nhiều Payment (thanh toán từng phần)
    - TransactionId do payment gateway cung cấp

    ---

    #### **Refunds**

    Hoàn tiền.

    | Column      | Type          | Description                                     | Constraints        |
    | ----------- | ------------- | ----------------------------------------------- | ------------------ |
    | Id          | int           | Primary Key                                     | PK, Auto-increment |
    | PaymentId   | int           | Payment gốc                                     | FK → Payments      |
    | Amount      | decimal(18,2) | Số tiền hoàn                                    | > 0                |
    | Reason      | RefundReason  | Lý do (CancelledByCustomer/FlightCancelled/etc) | Required           |
    | Status      | RefundStatus  | Trạng thái                                      | Default: Pending   |
    | RequestedAt | DateTime      | Thời gian yêu cầu                               | Default: UtcNow    |
    | ProcessedAt | DateTime?     | Thời gian xử lý                                 | Nullable           |

    ---

    ### 3.6. 🧳 Baggage Management

    #### **BaggageAllowances**

    Quy định hành lý theo hạng vé.

    | Column        | Type          | Description             | Constraints        |
    | ------------- | ------------- | ----------------------- | ------------------ |
    | Id            | int           | Primary Key             | PK, Auto-increment |
    | ClassType     | SeatClassType | Hạng ghế                | Required           |
    | MaxWeight     | int           | Trọng lượng tối đa (kg) | > 0                |
    | MaxPieces     | int           | Số kiện tối đa          | > 0                |
    | AdditionalFee | decimal(18,2) | Phí thêm/kg             | >= 0               |

    **Business Rules**:

    - Economy: 23kg, 1 kiện
    - Business: 32kg, 2 kiện
    - FirstClass: 40kg, 3 kiện

    ---

    #### **BookingBaggages**

    Hành lý đã đăng ký cho từng hành khách.

    | Column      | Type          | Description      | Constraints        |
    | ----------- | ------------- | ---------------- | ------------------ |
    | Id          | int           | Primary Key      | PK, Auto-increment |
    | BookingId   | int           | Đơn đặt vé       | FK → Bookings      |
    | PassengerId | int           | Hành khách       | FK → Passengers    |
    | Weight      | decimal(5,2)  | Trọng lượng (kg) | > 0                |
    | ExtraFee    | decimal(18,2) | Phí vượt cân     | >= 0               |

    **Business Rules**:

    - DeleteBehavior.Restrict trên Passenger

    ---

    ### 3.7. ❌ Cancellation & Changes

    #### **CancellationPolicies**

    Chính sách hủy vé.

    | Column           | Type          | Description           | Constraints        |
    | ---------------- | ------------- | --------------------- | ------------------ |
    | Id               | int           | Primary Key           | PK, Auto-increment |
    | DaysBefore       | int           | Số ngày trước giờ bay | >= 0               |
    | RefundPercentage | decimal(5,2)  | % hoàn tiền           | 0-100              |
    | FeeAmount        | decimal(18,2) | Phí hủy cố định       | >= 0               |

    **Ví dụ**:

    - Hủy > 7 ngày: Hoàn 90%
    - Hủy 3-7 ngày: Hoàn 50%
    - Hủy < 3 ngày: Không hoàn

    ---

    #### **BookingCancellations**

    Lịch sử hủy đơn.

    | Column       | Type          | Description   | Constraints        |
    | ------------ | ------------- | ------------- | ------------------ |
    | Id           | int           | Primary Key   | PK, Auto-increment |
    | BookingId    | int           | Đơn bị hủy    | FK → Bookings      |
    | CancelledAt  | DateTime      | Thời gian hủy | Required           |
    | Reason       | string        | Lý do         | Required           |
    | RefundAmount | decimal(18,2) | Số tiền hoàn  | >= 0               |

    ---

    #### **TicketChanges**

    Lịch sử đổi vé.

    | Column           | Type          | Description    | Constraints        |
    | ---------------- | ------------- | -------------- | ------------------ |
    | Id               | int           | Primary Key    | PK, Auto-increment |
    | OriginalTicketId | int           | Vé gốc         | FK → Tickets       |
    | NewFlightSeatId  | int           | Ghế mới        | FK → FlightSeats   |
    | ChangedAt        | DateTime      | Thời gian đổi  | Required           |
    | ChangeFee        | decimal(18,2) | Phí đổi vé     | >= 0               |
    | PriceDifference  | decimal(18,2) | Chênh lệch giá | Có thể âm          |

    **Business Rules**:

    - DeleteBehavior.Restrict để giữ lịch sử

    ---

    ### 3.8. ⭐ Loyalty Program

    #### **LoyaltyAccounts**

    Tài khoản khách hàng thân thiết.

    | Column           | Type   | Description                 | Constraints        |
    | ---------------- | ------ | --------------------------- | ------------------ |
    | Id               | int    | Primary Key                 | PK, Auto-increment |
    | UserId           | int    | Người dùng                  | FK → Users         |
    | MembershipNumber | string | Mã thành viên               | Unique             |
    | TotalMiles       | int    | Tổng số dặm                 | >= 0               |
    | Tier             | string | Hạng (Silver/Gold/Platinum) | Default: Silver    |

    **Indexes**:

    - Unique index trên `MembershipNumber`

    ---

    #### **MileageTransactions**

    Giao dịch dặm bay.

    | Column           | Type     | Description                    | Constraints          |
    | ---------------- | -------- | ------------------------------ | -------------------- |
    | Id               | int      | Primary Key                    | PK, Auto-increment   |
    | LoyaltyAccountId | int      | Tài khoản                      | FK → LoyaltyAccounts |
    | BookingId        | int?     | Đơn liên quan                  | FK → Bookings        |
    | Miles            | int      | Số dặm (+/-)                   | Có thể âm            |
    | Type             | string   | Loại (Earned/Redeemed/Expired) | Required             |
    | TransactionDate  | DateTime | Thời gian                      | Default: UtcNow      |

    ---

    ### 3.9. 👥 Group Booking

    #### **GroupBookings**

    Đặt vé nhóm.

    | Column             | Type         | Description     | Constraints        |
    | ------------------ | ------------ | --------------- | ------------------ |
    | Id                 | int          | Primary Key     | PK, Auto-increment |
    | GroupName          | string       | Tên nhóm        | Required           |
    | ContactPerson      | string       | Người liên hệ   | Required           |
    | ContactEmail       | string       | Email liên hệ   | Required           |
    | TotalPassengers    | int          | Tổng số khách   | > 0                |
    | DiscountPercentage | decimal(5,2) | % giảm giá nhóm | 0-100              |

    **Business Rules**:

    - Áp dụng cho nhóm từ 10 người trở lên

    ---

    ### 3.10. 🔔 & 📋 Logging

    #### **NotificationLogs**

    Lịch sử gửi thông báo.

    | Column  | Type             | Description           | Constraints        |
    | ------- | ---------------- | --------------------- | ------------------ |
    | Id      | int              | Primary Key           | PK, Auto-increment |
    | UserId  | int              | Người nhận            | FK → Users         |
    | Type    | NotificationType | Loại (Email/SMS/Push) | Required           |
    | Subject | string           | Tiêu đề               | Required           |
    | Content | string           | Nội dung              | Required           |
    | SentAt  | DateTime         | Thời gian gửi         | Required           |
    | IsRead  | bool             | Đã đọc                | Default: false     |

    ---

    #### **AuditLogs**

    Nhật ký hệ thống.

    | Column     | Type     | Description        | Constraints        |
    | ---------- | -------- | ------------------ | ------------------ |
    | Id         | int      | Primary Key        | PK, Auto-increment |
    | UserId     | int?     | Người thực hiện    | FK → Users         |
    | Action     | string   | Hành động          | Required           |
    | EntityName | string   | Tên entity         | Required           |
    | EntityId   | int      | ID entity          | Required           |
    | OldValues  | string   | Giá trị cũ (JSON)  | Nullable           |
    | NewValues  | string   | Giá trị mới (JSON) | Nullable           |
    | Timestamp  | DateTime | Thời gian          | Default: UtcNow    |

    ---

    ## 4. Mối quan hệ giữa các bảng

    ### 📊 ER Diagram (Text Description)

    ```
    Users (1) ─────< (N) Bookings
    │                    │
    │                    ├─< (N) Tickets
    │                    ├─< (N) Payments ─────< (N) Refunds
    │                    └─< (N) BookingBaggages
    │
    ├─< (N) Passengers ──< (N) Tickets
    │
    └─< (1) LoyaltyAccount ─────< (N) MileageTransactions

    Airports (1) ─────< (N) Routes (Origin)
    Airports (1) ─────< (N) Routes (Destination)

    Routes (1) ─────< (N) Flights

    Airlines (1) ─────< (N) Aircrafts

    Aircrafts (1) ─────< (N) Flights
    Aircrafts (1) ─────< (N) SeatConfigurations

    FlightSchedules (1) ─────< (N) Flights

    Flights (1) ─────< (N) FlightSeats ─────< (N) Tickets

    Bookings (1) ─────< (N) BookingCancellations
    Tickets (1) ─────< (N) TicketChanges

    GroupBookings (1) ─────< (N) Bookings
    ```

    ### 🔗 Relationship Summary

    | Parent          | Child                | Type | Delete Behavior |
    | --------------- | -------------------- | ---- | --------------- |
    | Users           | Bookings             | 1:N  | Cascade         |
    | Users           | Passengers           | 1:N  | Cascade         |
    | Users           | LoyaltyAccount       | 1:1  | Cascade         |
    | Airports        | Routes (Origin)      | 1:N  | Restrict        |
    | Airports        | Routes (Destination) | 1:N  | Restrict        |
    | Routes          | Flights              | 1:N  | Restrict        |
    | Airlines        | Aircrafts            | 1:N  | Cascade         |
    | Aircrafts       | Flights              | 1:N  | Restrict        |
    | Aircrafts       | SeatConfigurations   | 1:N  | Cascade         |
    | FlightSchedules | Flights              | 1:N  | Restrict        |
    | Flights         | FlightSeats          | 1:N  | Cascade         |
    | Bookings        | Tickets              | 1:N  | Cascade         |
    | Bookings        | Payments             | 1:N  | Cascade         |
    | Bookings        | BookingBaggages      | 1:N  | Cascade         |
    | FlightSeats     | Tickets              | 1:N  | Restrict        |
    | Passengers      | Tickets              | 1:N  | Restrict        |
    | Payments        | Refunds              | 1:N  | Cascade         |
    | LoyaltyAccounts | MileageTransactions  | 1:N  | Cascade         |
    | GroupBookings   | Bookings             | 1:N  | Restrict        |
    | Bookings        | ReturnBooking        | 1:1  | Restrict        |

    **Delete Behavior Explained**:

    - **Cascade**: Xóa parent → tự động xóa children
    - **Restrict**: Không cho xóa parent nếu còn children (bảo vệ dữ liệu)

    ---

    ## 5. Enumerations (Enums)

    ### **UserRole**

    ```csharp
    Customer = 0    // Khách hàng
    Admin = 1       // Quản trị viên
    Employee = 2    // Nhân viên
    ```

    ### **BookingStatus**

    ```csharp
    Pending = 0     // Chờ thanh toán
    Confirmed = 1   // Đã xác nhận
    Cancelled = 2   // Đã hủy
    Completed = 3   // Hoàn thành (đã bay)
    ```

    ### **BookingType**

    ```csharp
    OneWay = 0      // Một chiều
    RoundTrip = 1   // Khứ hồi
    ```

    ### **FlightStatus**

    ```csharp
    Scheduled = 0   // Đã lên lịch
    Delayed = 1     // Trễ
    Cancelled = 2   // Hủy
    Completed = 3   // Hoàn thành
    Boarding = 4    // Đang lên máy bay
    ```

    ### **SeatClassType**

    ```csharp
    Economy = 0     // Phổ thông
    Business = 1    // Thương gia
    FirstClass = 2  // Hạng nhất
    ```

    ### **SeatStatus**

    ```csharp
    Available = 0   // Còn trống
    Reserved = 1    // Đang giữ chỗ (chưa thanh toán)
    Booked = 2      // Đã đặt (đã thanh toán)
    ```

    ### **SeatPosition**

    ```csharp
    Window = 0      // Cửa sổ
    Middle = 1      // Giữa
    Aisle = 2       // Lối đi
    ```

    ### **Gender**

    ```csharp
    Male = 0        // Nam
    Female = 1      // Nữ
    Other = 2       // Khác
    ```

    ### **CheckInStatus**

    ```csharp
    NotCheckedIn = 0    // Chưa check-in
    CheckedIn = 1       // Đã check-in
    Boarded = 2         // Đã lên máy bay
    ```

    ### **PaymentMethod**

    ```csharp
    CreditCard = 0      // Thẻ tín dụng
    DebitCard = 1       // Thẻ ghi nợ
    BankTransfer = 2    // Chuyển khoản
    Momo = 3            // Ví Momo
    ZaloPay = 4         // Ví ZaloPay
    Cash = 5            // Tiền mặt (tại quầy)
    ```

    ### **PaymentStatus**

    ```csharp
    Pending = 0     // Chờ thanh toán
    Processing = 1  // Đang xử lý
    Completed = 2   // Thành công
    Failed = 3      // Thất bại
    Refunded = 4    // Đã hoàn tiền
    ```

    ### **Currency**

    ```csharp
    VND = 0         // Việt Nam Đồng
    USD = 1         // US Dollar
    EUR = 2         // Euro
    ```

    ### **RefundStatus**

    ```csharp
    Pending = 0     // Chờ xử lý
    Approved = 1    // Đã duyệt
    Processing = 2  // Đang hoàn tiền
    Completed = 3   // Hoàn thành
    Rejected = 4    // Từ chối
    ```

    ### **RefundReason**

    ```csharp
    CancelledByCustomer = 0     // Khách hủy
    FlightCancelled = 1         // Hãng hủy chuyến
    FlightDelayed = 2           // Chuyến bay trễ quá lâu
    Duplicate = 3               // Đặt trùng
    Other = 4                   // Lý do khác
    ```

    ### **NotificationType**

    ```csharp
    Email = 0       // Email
    SMS = 1         // Tin nhắn
    Push = 2        // Push notification
    ```

    ---

    ## 6. Nghiệp vụ chính

    ### 6.1. 🔍 Tìm kiếm chuyến bay

    **Input**:

    - Sân bay đi (OriginAirportId)
    - Sân bay đến (DestinationAirportId)
    - Ngày khởi hành
    - Số hành khách
    - Hạng ghế (optional)

    **Process**:

    1. Tìm Route phù hợp `Routes.OriginAirportId = input.Origin AND DestinationAirportId = input.Destination`
    2. Tìm Flights theo RouteId và DepartureTime
    3. Join với FlightSeats để lấy giá và số ghế còn trống
    4. Filter theo SeatClassType nếu có
    5. Sắp xếp theo giá hoặc thời gian

    **Output**:

    - Danh sách chuyến bay với thông tin:
    - Hãng hàng không
    - Thời gian khởi hành/đến
    - Giá vé các hạng
    - Số ghế còn trống

    ---

    ### 6.2. 📝 Đặt vé

    **Input**:

    - UserId
    - FlightId
    - Danh sách SeatNumbers
    - Danh sách Passengers info

    **Process**:

    1. **Kiểm tra ghế còn trống**:

    ```sql
    WHERE FlightId = @FlightId
        AND SeatNumber IN (@SeatNumbers)
        AND Status = Available
    ```

    2. **Lock ghế (Optimistic Concurrency)**:
    - Update Status = Reserved
    - ConcurrencyToken sẽ đảm bảo không double booking

    3. **Tạo Passengers** (nếu chưa có):
    - Insert vào bảng Passengers

    4. **Tạo Booking**:

    ```csharp
    var booking = new Booking {
        UserId = userId,
        BookingDate = DateTime.UtcNow,
        TotalAmount = seats.Sum(s => s.Price),
        Status = BookingStatus.Pending
    };
    ```

    5. **Tạo Tickets**:
    - Cho mỗi ghế, tạo 1 Ticket với PassengerId tương ứng

    6. **Gửi thông báo**:
    - Insert vào NotificationLogs
    - Email xác nhận đặt vé

    **Output**:

    - BookingId
    - Tổng tiền phải thanh toán
    - Thời gian giữ chỗ (15 phút)

    ---

    ### 6.3. 💳 Thanh toán

    **Input**:

    - BookingId
    - PaymentMethod
    - Amount

    **Process**:

    1. **Kiểm tra Booking**:
    - Status = Pending
    - Chưa hết thời gian giữ chỗ

    2. **Gọi Payment Gateway** (tuỳ method):
    - CreditCard → Stripe/VNPay
    - Momo/ZaloPay → API tương ứng

    3. **Tạo Payment record**:

    ```csharp
    var payment = new Payment {
        BookingId = bookingId,
        Amount = amount,
        Method = method,
        Status = PaymentStatus.Processing,
        TransactionId = gatewayResponse.TransactionId
    };
    ```

    4. **Xử lý callback từ gateway**:
    - Thành công:
        - Update Payment.Status = Completed
        - Update Booking.Status = Confirmed
        - Update FlightSeats.Status = Booked
        - Tính MileageTransaction (nếu có LoyaltyAccount)
    - Thất bại:
        - Update Payment.Status = Failed, FailureReason
        - Giữ nguyên ghế Reserved (có thể retry)

    5. **Gửi vé điện tử**:
    - Generate Ticket QR codes
    - Email/SMS vé

    **Output**:

    - PaymentId
    - TransactionId
    - Vé điện tử (PDF/QR)

    ---

    ### 6.4. ✅ Check-in

    **Input**:

    - TicketId
    - PassportNumber (xác thực)

    **Process**:

    1. **Xác thực**:
    - Ticket.Passenger.PassportNumber = input
    - Booking.Status = Confirmed
    - Flight chưa departed

    2. **Kiểm tra thời gian**:
    - Chỉ cho check-in từ 24h - 1h trước giờ bay

    3. **Generate Boarding Pass**:
    - Tạo QR code với thông tin:
        - TicketId
        - Flight info
        - Seat number
        - Gate (nếu có)

    4. **Update Ticket**:
    ```csharp
    ticket.CheckInStatus = CheckInStatus.CheckedIn;
    ticket.CheckInTime = DateTime.UtcNow;
    ticket.BoardingPass = qrCodeBase64;
    ```

    **Output**:

    - Boarding Pass (PDF + QR)
    - Gate number, boarding time

    ---

    ### 6.5. ❌ Hủy vé

    **Input**:

    - BookingId
    - Reason

    **Process**:

    1. **Kiểm tra điều kiện**:
    - Booking.Status = Confirmed
    - Chưa check-in
    - Flight chưa departed

    2. **Tính phí hoàn**:

    ```csharp
    var daysBeforeFlight = (flight.DepartureTime - DateTime.UtcNow).Days;
    var policy = CancellationPolicies
        .OrderByDescending(p => p.DaysBefore)
        .FirstOrDefault(p => daysBeforeFlight >= p.DaysBefore);

    refundAmount = booking.TotalAmount * policy.RefundPercentage / 100
                    - policy.FeeAmount;
    ```

    3. **Tạo BookingCancellation**:

    ```csharp
    var cancellation = new BookingCancellation {
        BookingId = bookingId,
        CancelledAt = DateTime.UtcNow,
        Reason = reason,
        RefundAmount = refundAmount
    };
    ```

    4. **Update statuses**:
    - Booking.Status = Cancelled
    - FlightSeats.Status = Available
    - Payment.Status = Refunded (nếu hoàn 100%)

    5. **Tạo Refund**:
    - Link với Payment gốc
    - Status = Processing

    6. **Xử lý hoàn tiền**:
    - Gọi payment gateway
    - Update Refund.Status = Completed

    **Output**:

    - Số tiền được hoàn
    - Thời gian xử lý (3-7 ngày làm việc)

    ---

    ### 6.6. 🔄 Đổi vé

    **Input**:

    - TicketId
    - NewFlightSeatId

    **Process**:

    1. **Kiểm tra**:
    - Ticket.CheckInStatus = NotCheckedIn
    - NewFlightSeat.Status = Available
    - Cùng tuyến bay (hoặc theo policy)

    2. **Tính phí**:

    ```csharp
    var changeFee = 500000; // Fixed fee (VND)
    var priceDifference = newSeat.Price - oldSeat.Price;
    var totalCharge = changeFee + (priceDifference > 0 ? priceDifference : 0);
    ```

    3. **Thu phí**:
    - Tạo Payment mới cho khoản chênh lệch

    4. **Tạo TicketChange record**:

    ```csharp
    var change = new TicketChange {
        OriginalTicketId = ticketId,
        NewFlightSeatId = newFlightSeatId,
        ChangedAt = DateTime.UtcNow,
        ChangeFee = changeFee,
        PriceDifference = priceDifference
    };
    ```

    5. **Update**:
    - OldFlightSeat.Status = Available
    - NewFlightSeat.Status = Booked
    - Ticket.FlightSeatId = NewFlightSeatId

    **Output**:

    - Vé mới
    - Hóa đơn phí đổi

    ---

    ### 6.7. ⭐ Tích lũy dặm bay

    **Process** (Tự động sau khi thanh toán):

    1. **Kiểm tra LoyaltyAccount**:
    - Nếu chưa có → tạo mới

    2. **Tính số dặm**:

    ```csharp
    var distance = route.Duration.TotalHours * 800; // km (rough estimate)
    var baseMiles = (int)(distance * classMultiplier);

    // Multiplier by class
    // Economy: 1.0x
    // Business: 1.5x
    // FirstClass: 2.0x

    var bonusMiles = baseMiles * tierMultiplier;
    // Silver: 1.0x
    // Gold: 1.25x
    // Platinum: 1.5x
    ```

    3. **Tạo MileageTransaction**:

    ```csharp
    var transaction = new MileageTransaction {
        LoyaltyAccountId = loyaltyAccount.Id,
        BookingId = booking.Id,
        Miles = baseMiles + bonusMiles,
        Type = "Earned"
    };
    ```

    4. **Update LoyaltyAccount**:

    ```csharp
    loyaltyAccount.TotalMiles += transaction.Miles;

    // Auto-upgrade tier
    if (loyaltyAccount.TotalMiles >= 100000)
        loyaltyAccount.Tier = "Platinum";
    else if (loyaltyAccount.TotalMiles >= 50000)
        loyaltyAccount.Tier = "Gold";
    ```

    **Sử dụng dặm**:

    - 1000 miles = giảm 100,000 VND
    - Tạo MileageTransaction với Miles âm

    ---

    ## 7. Luồng xử lý (Workflows)

    ### 7.1. 🎯 Flow: Đặt vé một chiều (One-Way)

    ```
    [Customer] Tìm kiếm chuyến bay
        ↓
    [System] Truy vấn Flights + FlightSeats
        ↓
    [Customer] Chọn chuyến bay + ghế
        ↓
    [System] Check seat availability (Optimistic Lock)
        ↓
    [System] Reserve seats (Status = Reserved)
        ↓
    [Customer] Nhập thông tin hành khách
        ↓
    [System] Create Passengers + Booking + Tickets
        ↓
    [Customer] Chọn phương thức thanh toán
        ↓
    [System] Create Payment (Status = Processing)
        ↓
    [Payment Gateway] Xử lý thanh toán
        ↓
    [System] Receive callback
        ├─ Success:
        │   ├─ Update Payment.Status = Completed
        │   ├─ Update Booking.Status = Confirmed
        │   ├─ Update FlightSeats.Status = Booked
        │   ├─ Calculate + Add MileageTransaction
        │   └─ Send e-ticket via Email/SMS
        │
        └─ Failed:
            ├─ Update Payment.Status = Failed
            ├─ Log FailureReason
            └─ Notify customer to retry
    ```

    ---

    ### 7.2. 🔄 Flow: Đặt vé khứ hồi (Round-Trip)

    ```
    [Customer] Tìm kiếm chuyến bay khứ hồi
        ↓
    [System] Truy vấn 2 flights (outbound + return)
        ↓
    [Customer] Chọn cả 2 chuyến
        ↓
    [System] Reserve seats trên CẢ HAI chuyến
        ↓
    [System] Create OutboundBooking (BookingType = RoundTrip)
        ↓
    [System] Create ReturnBooking
        ↓
    [System] Link: OutboundBooking.ReturnBookingId = ReturnBooking.Id
        ↓
    [Customer] Thanh toán TỔNG tiền 2 chuyến
        ↓
    [System] Create 1 Payment cho OutboundBooking
        ↓
    [Payment Success]
        ├─ Update CẢ HAI Bookings.Status = Confirmed
        ├─ Update CẢ HAI FlightSeats sets = Booked
        └─ Send 2 e-tickets
    ```

    ---

    ### 7.3. 👥 Flow: Đặt vé nhóm (Group Booking)

    ```
    [Customer/Agent] Yêu cầu đặt vé nhóm (≥10 người)
        ↓
    [System] Create GroupBooking
        ↓
    [System] Apply DiscountPercentage
        ↓
    For each passenger:
        ├─ Create Passenger
        ├─ Create Booking (link GroupBookingId)
        └─ Create Ticket
        ↓
    [System] Calculate total with discount
        ↓
    [Customer] Thanh toán (có thể từng phần)
        ↓
    [System] Track payments cho tất cả bookings
        ↓
    All paid → Confirm all bookings
    ```

    ---

    ### 7.4. ❌ Flow: Hủy vé và hoàn tiền

    ```
    [Customer] Request cancellation
        ↓
    [System] Check conditions:
        ├─ Booking.Status = Confirmed?
        ├─ Not checked in?
        └─ Flight not departed?
        ↓
    [System] Calculate refund theo CancellationPolicy
        ↓
    [System] Create BookingCancellation record
        ↓
    [System] Update Booking.Status = Cancelled
        ↓
    [System] Release seats: FlightSeats.Status = Available
        ↓
    [System] Create Refund (Status = Processing)
        ↓
    [Payment Gateway] Process refund
        ↓
    [System] Update Refund.Status = Completed
        ↓
    [System] Notify customer
    ```

    ---

    ### 7.5. 🧳 Flow: Thêm hành lý

    ```
    [Customer] Request additional baggage (tại booking hoặc sau)
        ↓
    [System] Get BaggageAllowance theo ClassType
        ↓
    [Customer] Nhập trọng lượng mong muốn
        ↓
    [System] Calculate ExtraFee:
        extraWeight = input - allowance.MaxWeight
        fee = extraWeight * allowance.AdditionalFee
        ↓
    [System] Create BookingBaggage record
        ↓
    [System] Create Payment cho ExtraFee
        ↓
    [Payment Success]
        ├─ Link BookingBaggage to Booking
        └─ Update Booking.TotalAmount += ExtraFee
    ```

    ---

    ## 8. Indexes và Performance

    ### 📊 Danh sách Indexes

    | Table              | Index                    | Type      | Purpose                    |
    | ------------------ | ------------------------ | --------- | -------------------------- |
    | Users              | Email                    | Unique    | Login                      |
    | Airports           | Code                     | Unique    | Search by IATA code        |
    | Flights            | (DepartureTime, RouteId) | Composite | Search flights             |
    | FlightSeats        | (FlightId, SeatNumber)   | Unique    | Prevent duplicate seats    |
    | FlightSeats        | Status                   | -         | Concurrency control        |
    | Payments           | TransactionId            | Unique    | Track gateway transactions |
    | Passengers         | PassportNumber           | -         | Quick lookup               |
    | FlightSchedules    | FlightNumber             | -         | Recurring flights          |
    | SeatConfigurations | (AircraftId, SeatNumber) | Unique    | Aircraft seat map          |
    | LoyaltyAccounts    | MembershipNumber         | Unique    | Member lookup              |

    ### ⚡ Performance Tips

    1. **Concurrency Control**:
    - `FlightSeats.Status` là ConcurrencyToken
    - Sử dụng Optimistic Locking để tránh double booking

    2. **Cascading Deletes**:
    - Cẩn thận với Cascade để tránh xóa nhầm dữ liệu quan trọng
    - Sử dụng Restrict cho các FK quan trọng (Airports, Routes)

    3. **Query Optimization**:
    - Sử dụng composite index `(DepartureTime, RouteId)` cho tìm kiếm
    - Include navigations khi cần: `.Include(f => f.Route).ThenInclude(r => r.OriginAirport)`

    4. **Soft Delete**:
    - Cân nhắc thêm `IsDeleted` flag thay vì hard delete cho:
        - Bookings
        - Tickets
        - Payments

    ---

    ## 📝 Notes & Best Practices

    ### ✅ Do's

    - Luôn sử dụng transactions cho multi-step operations (booking + payment)
    - Log tất cả payment transactions vào AuditLogs
    - Validate business rules ở Application layer trước khi save
    - Sử dụng DTOs để tránh over-fetching data
    - Index các fields thường xuyên search/join

    ### ❌ Don'ts

    - Không hard-code prices/fees → lưu trong database hoặc config
    - Không expose internal IDs ra ngoài → dùng GUIDs cho public-facing IDs
    - Không cascade delete Airports, Routes nếu có Flights đang active
    - Không skip validation cho payment amounts

    ### 🔒 Security

    - Hash tất cả passwords (ASP.NET Identity lo)
    - Không log sensitive data (Credit card, Passport full numbers)
    - Implement row-level security: User chỉ xem được bookings của mình
    - Validate permissions trước mọi write operations

    ---

    ## 🎉 Kết luận

    Hệ thống database này được thiết kế để:

    - ✅ Hỗ trợ đầy đủ quy trình đặt vé máy bay từ A-Z
    - ✅ Scale được khi lượng người dùng tăng
    - ✅ Bảo vệ dữ liệu với proper constraints và delete behaviors
    - ✅ Dễ mở rộng thêm tính năng (modular design)
    - ✅ Audit trail đầy đủ cho compliance

    **Database Schema này phù hợp cho**:

    - 📱 Web App (ReactJS)
    - 📱 Mobile App (React Native/Flutter)
    - 🖥️ Admin Dashboard
    - 📊 Reporting & Analytics

    ---

    **Liên hệ**: Nếu cần thêm thông tin về bất kỳ entity hoặc workflow nào, hãy hỏi!
