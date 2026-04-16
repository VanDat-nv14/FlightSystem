namespace FlightBooking.Domain.Enums;

public enum PaymentMethod
{
    CreditCard = 0,     // Thẻ tín dụng
    DebitCard = 1,      // Thẻ ghi nợ
    BankTransfer = 2,   // Chuyển khoản
    Momo = 3,           // Ví Momo
    ZaloPay = 4,        // Ví ZaloPay
    Cash = 5            // Tiền mặt (tại quầy)
}
