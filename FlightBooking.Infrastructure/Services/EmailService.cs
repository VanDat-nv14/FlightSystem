using FlightBooking.Application.Features.Email.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace FlightBooking.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly string _host;
        private readonly int _port;
        private readonly string _username;
        private readonly string _password;
        private readonly string _fromName;
        private readonly string _fromAddress;

        public EmailService(IConfiguration config)
        {
            _config = config;
            var smtp = config.GetSection("SmtpSettings");
            _host        = smtp["Host"]        ?? "smtp.gmail.com";
            _port        = int.Parse(smtp["Port"] ?? "587");
            _username    = smtp["Username"]    ?? string.Empty;
            _password    = smtp["Password"]    ?? string.Empty;
            _fromName    = smtp["FromName"]    ?? "SkyBooking";
            _fromAddress = smtp["FromAddress"] ?? _username;
        }

        // ── Core Send ──────────────────────────────────────────────────────────
        private async Task SendAsync(MimeMessage message)
        {
            using var client = new SmtpClient();
            await client.ConnectAsync(_host, _port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(_username, _password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }

        private MimeMessage BuildMessage(string toEmail, string toName, string subject, string htmlBody)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_fromName, _fromAddress));
            message.To.Add(new MailboxAddress(toName, toEmail));
            message.Subject = subject;
            var builder = new BodyBuilder { HtmlBody = htmlBody };
            message.Body = builder.ToMessageBody();
            return message;
        }

        // ── Templates ──────────────────────────────────────────────────────────
        public async Task SendBookingConfirmAsync(string toEmail, string fullName, string bookingCode,
            decimal totalAmount, bool isDeposit, decimal? depositPaid, DateTime? depositDeadline)
        {
            var depositInfo = isDeposit && depositPaid.HasValue && depositDeadline.HasValue
                ? $@"<div style='background:#fff8e1;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:6px;margin:16px 0;'>
                        <p style='margin:0;font-weight:700;color:#92400e;'>⚠️ Đặt cọc 30% — Cần thanh toán phần còn lại</p>
                        <p style='margin:6px 0 0;color:#78350f;'>Đã thanh toán: <strong>{depositPaid.Value:N0} đ</strong></p>
                        <p style='margin:4px 0 0;color:#78350f;'>Còn lại: <strong>{(totalAmount - depositPaid.Value):N0} đ</strong></p>
                        <p style='margin:4px 0 0;color:#dc2626;font-weight:600;'>Hạn thanh toán: {depositDeadline.Value.AddHours(7):dd/MM/yyyy HH:mm} (GMT+7)</p>
                        <p style='margin:6px 0 0;font-size:12px;color:#92400e;'>Nếu không thanh toán đúng hạn, booking sẽ bị tự động hủy.</p>
                    </div>"
                : $@"<div style='background:#f0fdf4;border-left:4px solid #22c55e;padding:14px 18px;border-radius:6px;margin:16px 0;'>
                        <p style='margin:0;font-weight:700;color:#166534;'>✅ Đã thanh toán toàn bộ: <strong>{totalAmount:N0} đ</strong></p>
                    </div>";

            var html = HtmlWrap($"Xác Nhận Đặt Vé", $@"
                <p>Xin chào <strong>{fullName}</strong>,</p>
                <p>Đơn đặt vé của bạn đã được tạo thành công trên hệ thống <strong>SkyBooking</strong>.</p>
                <div style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;'>
                    <p style='margin:0 0 8px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;'>Mã đặt vé (PNR)</p>
                    <p style='margin:0;font-size:28px;font-weight:900;letter-spacing:4px;color:#1e293b;'>{bookingCode}</p>
                </div>
                <p>Tổng giá trị đơn hàng: <strong style='color:#0f172a;font-size:18px;'>{totalAmount:N0} đ</strong></p>
                {depositInfo}
                <p style='color:#64748b;font-size:13px;margin-top:24px;'>Vui lòng lưu mã PNR để kiểm tra trạng thái đặt vé và làm thủ tục check-in.</p>");

            var msg = BuildMessage(toEmail, fullName, $"[SkyBooking] Xác nhận đặt vé {bookingCode}", html);
            await SendAsync(msg);
        }

        public async Task SendDepositReminderAsync(string toEmail, string fullName, string bookingCode,
            decimal remainingAmount, DateTime deadline)
        {
            var deadlineVn = deadline.AddHours(7);
            var html = HtmlWrap("Nhắc Nhở Thanh Toán", $@"
                <p>Xin chào <strong>{fullName}</strong>,</p>
                <p>Đây là email nhắc nhở rằng booking <strong>{bookingCode}</strong> của bạn đang chờ thanh toán phần còn lại.</p>
                <div style='background:#fff8e1;border:1px solid #fcd34d;border-radius:8px;padding:20px;margin:16px 0;text-align:center;'>
                    <p style='margin:0 0 8px;color:#92400e;font-size:13px;font-weight:600;'>SỐ TIỀN CẦN THANH TOÁN</p>
                    <p style='margin:0;font-size:32px;font-weight:900;color:#dc2626;'>{remainingAmount:N0} đ</p>
                    <p style='margin:12px 0 0;color:#92400e;font-weight:600;'>⏰ Hạn cuối: {deadlineVn:dd/MM/yyyy HH:mm} (GMT+7)</p>
                </div>
                <p>Nếu không thanh toán trước hạn trên, hệ thống sẽ <strong style='color:#dc2626;'>tự động hủy booking</strong> và giải phóng chỗ ngồi.</p>
                <p style='color:#64748b;font-size:13px;'>Đăng nhập vào tài khoản để hoàn tất thanh toán.</p>");

            var msg = BuildMessage(toEmail, fullName, $"[SkyBooking] ⚠️ Nhắc thanh toán booking {bookingCode}", html);
            await SendAsync(msg);
        }

        public async Task SendCancellationConfirmAsync(string toEmail, string fullName, string bookingCode,
            decimal refundAmount, string reason, string policyDescription)
        {
            var refundSection = refundAmount > 0
                ? $@"<div style='background:#f0fdf4;border-left:4px solid #22c55e;padding:14px 18px;border-radius:6px;margin:16px 0;'>
                        <p style='margin:0;font-weight:700;color:#166534;'>💰 Hoàn tiền: <strong>{refundAmount:N0} đ</strong></p>
                        <p style='margin:6px 0 0;font-size:12px;color:#166534;'>{policyDescription}</p>
                        <p style='margin:6px 0 0;font-size:12px;color:#166534;'>Thời gian hoàn tiền dự kiến: 3-5 ngày làm việc.</p>
                    </div>"
                : $@"<div style='background:#fef2f2;border-left:4px solid #ef4444;padding:14px 18px;border-radius:6px;margin:16px 0;'>
                        <p style='margin:0;font-weight:700;color:#991b1b;'>Không có hoàn tiền</p>
                        <p style='margin:6px 0 0;font-size:12px;color:#991b1b;'>{policyDescription}</p>
                    </div>";

            var html = HtmlWrap("Xác Nhận Hủy Vé", $@"
                <p>Xin chào <strong>{fullName}</strong>,</p>
                <p>Booking <strong>{bookingCode}</strong> của bạn đã được hủy thành công.</p>
                <div style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;'>
                    <p style='margin:0 0 4px;font-size:12px;color:#64748b;'>Lý do hủy:</p>
                    <p style='margin:0;font-weight:600;color:#1e293b;'>{reason}</p>
                </div>
                {refundSection}
                <p style='color:#64748b;font-size:13px;margin-top:24px;'>Nếu bạn cần hỗ trợ, vui lòng liên hệ đội ngũ chăm sóc khách hàng của chúng tôi.</p>");

            var msg = BuildMessage(toEmail, fullName, $"[SkyBooking] Xác nhận hủy booking {bookingCode}", html);
            await SendAsync(msg);
        }

        public async Task SendDepositExpiredAsync(string toEmail, string fullName, string bookingCode)
        {
            var html = HtmlWrap("Booking Đã Bị Hủy Tự Động", $@"
                <p>Xin chào <strong>{fullName}</strong>,</p>
                <p>Chúng tôi xin thông báo booking <strong>{bookingCode}</strong> đã bị <strong style='color:#dc2626;'>hủy tự động</strong> do không thanh toán phần còn lại trong thời hạn 72 giờ.</p>
                <div style='background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;text-align:center;'>
                    <p style='margin:0;font-size:40px;'>❌</p>
                    <p style='margin:8px 0 0;font-weight:700;color:#991b1b;'>Booking đã bị hủy</p>
                    <p style='margin:4px 0 0;color:#b91c1c;font-size:13px;'>Tiền đặt cọc 30% không được hoàn lại theo chính sách đặt cọc.</p>
                </div>
                <p>Bạn có thể đặt vé mới trên hệ thống SkyBooking bất cứ lúc nào.</p>
                <p style='color:#64748b;font-size:13px;'>Nếu bạn cho rằng đây là nhầm lẫn, vui lòng liên hệ hỗ trợ khách hàng ngay.</p>");

            var msg = BuildMessage(toEmail, fullName, $"[SkyBooking] ❌ Booking {bookingCode} đã bị hủy do quá hạn", html);
            await SendAsync(msg);
        }

        // ── HTML Wrapper ───────────────────────────────────────────────────────
        private static string HtmlWrap(string title, string body) => $@"
<!DOCTYPE html>
<html lang='vi'>
<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>
<body style='margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,""Segoe UI"",Roboto,sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f1f5f9;padding:32px 16px;'>
    <tr><td align='center'>
      <table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.07);'>
        <!-- Header -->
        <tr>
          <td style='background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:28px 32px;text-align:center;'>
            <p style='margin:0;font-size:24px;font-weight:900;color:#ffffff;letter-spacing:1px;'>✈ SkyBooking</p>
            <p style='margin:6px 0 0;font-size:16px;color:rgba(255,255,255,.85);font-weight:600;'>{title}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style='padding:28px 32px;color:#334155;font-size:15px;line-height:1.7;'>
            {body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style='background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;'>
            <p style='margin:0;font-size:12px;color:#94a3b8;'>© 2025 SkyBooking. Email này được gửi tự động, vui lòng không trả lời.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";
    }
}
