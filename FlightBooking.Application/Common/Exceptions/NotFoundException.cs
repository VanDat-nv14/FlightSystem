namespace FlightBooking.Application.Common.Exceptions
{
    public class NotFoundException : Exception
    {
        public NotFoundException(string message) : base(message) { }
        public NotFoundException(string name, object key)
            : base($"'{name}' với id '{key}' không tìm thấy.") { }
    }
}
