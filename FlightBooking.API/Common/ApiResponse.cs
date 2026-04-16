namespace FlightBooking.API.Common
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T? Data { get; set; }

        public static ApiResponse<T> SuccessResponse(T data, string message = "Success")
        => new()         {
            Success = true,
            Message = message,
            Data = data
        };

        public static ApiResponse<T> FailureResponse(string message , List<T>? error = null)
            => new()         {
            Success = false,
            Message = message,
            Data = error != null && error.Count > 0 ? error[0] : default
        };
    }
}
