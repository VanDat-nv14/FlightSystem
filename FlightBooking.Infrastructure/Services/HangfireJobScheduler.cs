using Hangfire;
using System;
using System.Linq.Expressions;
using FlightBooking.Application.Common.Interfaces;

namespace FlightBooking.Infrastructure.Services
{
    public class HangfireJobScheduler : IJobScheduler
    {
        public void Schedule<T>(Expression<Action<T>> methodCall, TimeSpan delay)
        {
            BackgroundJob.Schedule(methodCall, delay);
        }
    }
}
