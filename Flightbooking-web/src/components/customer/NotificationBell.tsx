import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notificationService } from "../../services/notification.service";

function formatTime(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationBell() {
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useQuery({
    queryKey: ["customer-notifications"],
    queryFn: notificationService.getMyNotifications,
  });
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer-notifications"] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer-notifications"] }),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="font-bold text-slate-900">Thông báo</p>
            <p className="text-xs text-slate-500">{unreadCount} chưa đọc</p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead.mutate()}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Đọc tất cả
            </button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">Chưa có thông báo nào.</div>
          ) : (
            <div className="divide-y">
              {notifications.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => !item.isRead && markAsRead.mutate(item.id)}
                  className={`block w-full px-4 py-3 text-left transition hover:bg-slate-50 ${item.isRead ? "bg-white" : "bg-blue-50/70"}`}
                >
                  <div className="flex items-start gap-2">
                    {!item.isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-600" />}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-slate-900">{item.subject}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.content}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{formatTime(item.sentAt)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
