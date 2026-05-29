using System;
using System.Linq.Expressions;

namespace FlightBooking.Application.Common.Interfaces
{
    public interface IJobScheduler
    {
        void Schedule<T>(Expression<Action<T>> methodCall, TimeSpan delay);
    }
}
