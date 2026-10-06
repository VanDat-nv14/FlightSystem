using System;
using System.Threading;
using System.Threading.Tasks;

namespace FlightBooking.Application.Common.Interfaces
{
    public interface ICacheService
    {
        Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);

        Task SetAsync<T>(string key, T value, TimeSpan? expirationTime = null, CancellationToken cancellationToken = default);

        Task RemoveAsync(string key, CancellationToken cancellationToken = default);

        Task RemoveByPrefixAsync(string prefixKey, CancellationToken cancellationToken = default);

        Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default);

        Task<T?> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expirationTime = null, CancellationToken cancellationToken = default);
    }
}
