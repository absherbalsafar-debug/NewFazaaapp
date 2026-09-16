import { useListNotifications, useMarkAllNotificationsRead } from "@/lib/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Bell, Loader2, ArrowRight, Check } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Notifications() {
  const { data: notifications, isLoading, refetch } = useListNotifications({
    query: { queryKey: ['notifications'] }
  });

  const markAllRead = useMarkAllNotificationsRead();

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => refetch()
    });
  };

  return (
    <div className="pb-24 bg-background min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-bold flex-1">الإشعارات</h1>
        <Button variant="ghost" size="icon" className="rounded-full text-primary" onClick={handleMarkAllRead}>
          <Check className="w-5 h-5" />
        </Button>
      </div>

      <div className="max-w-md mx-auto px-4 mt-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-muted-foreground opacity-50" />
            </div>
            <h3 className="font-bold text-lg mb-2">لا يوجد إشعارات</h3>
            <p className="text-muted-foreground text-sm">
              أنت على اطلاع بكل شيء!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 rounded-2xl border ${
                  notification.isRead ? 'bg-background border-border/50 opacity-70' : 'bg-primary/5 border-primary/20'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-sm">{notification.title}</h4>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {format(new Date(notification.createdAt), 'hh:mm a', { locale: ar })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{notification.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
