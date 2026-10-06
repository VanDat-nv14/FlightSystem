    using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FlightBooking.Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace FlightBooking.Infrastructure.Services
{
    public class CacheService : ICacheService
    {
        private readonly IDistributedCache _cache;
        private readonly ILogger<CacheService> _logger;

        private static readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public CacheService(IDistributedCache cache, ILogger<CacheService> logger)
        {
            _cache = cache;
            _logger = logger;
        }

        public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
        {
            try
            {
                var data = await _cache.GetStringAsync(key, cancellationToken);
                if (string.IsNullOrEmpty(data))
                    return default;

                return JsonSerializer.Deserialize<T>(data, _jsonOptions);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Lỗi khi lấy cache với key: {Key}", key);
                return default;
            }
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan? expirationTime = null, CancellationToken cancellationToken = default)
        {
            try
            {
                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = expirationTime ?? TimeSpan.FromMinutes(30)
                };

                var serialized = JsonSerializer.Serialize(value, _jsonOptions);
                await _cache.SetStringAsync(key, serialized, options, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Lỗi khi lưu cache với key: {Key}", key);
            }
        }

        public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
        {
            try
            {
                await _cache.RemoveAsync(key, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Lỗi khi xóa cache với key: {Key}", key);
            }
        }

        public async Task RemoveByPrefixAsync(string prefixKey, CancellationToken cancellationToken = default)
        {
            try
            {
                await _cache.RemoveAsync(prefixKey, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Lỗi khi xóa cache theo prefix: {Prefix}", prefixKey);
            }
        }

        public async Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default)
        {
            try
            {
                var data = await _cache.GetStringAsync(key, cancellationToken);
                return !string.IsNullOrEmpty(data);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Lỗi khi kiểm tra tồn tại cache với key: {Key}", key);
                return false;
            }
        }

        public async Task<T?> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expirationTime = null, CancellationToken cancellationToken = default)
        {
            var cached = await GetAsync<T>(key, cancellationToken);
            if (cached != null)
                return cached;

            var result = await factory();
            if (result != null)
            {
                await SetAsync(key, result, expirationTime, cancellationToken);
            }
            return result;
        }
    }
}

