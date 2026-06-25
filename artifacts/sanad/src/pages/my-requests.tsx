import { useListRequests } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Calendar, CheckCircle2, XCircle, AlertCircle, PlayCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const statusConfig = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  accepted: { label: "تم القبول", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: CheckCircle2 },
  in_progress: { label: "جاري التنفيذ", color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: PlayCircle },
  completed: { label: "مكتمل", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle2 },
  rejected: { label: "مرفوض", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: XCircle },
  cancelled: { label: "ملغي", color: "bg-gray-500/10 text-gray-600 border-gray-500/20", icon: AlertCircle },
};

export default function MyRequests() {
  const { user } = useAuth();
  
  const { data: requests, isLoading } = useListRequests({
    role: user?.role === 'provider' ? 'provider' : 'client'
  }, { query: { queryKey: ['requests', user?.role] } });

  return (
    <div className="pb-24 bg-background min-h-screen">
      <div className="bg-primary pt-6 pb-8 px-4 rounded-b-[2rem] shadow-sm">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-primary-foreground">طلباتي</h1>
          <p className="text-primary-foreground/80 mt-1 text-sm">
            {user?.role === 'provider' ? 'الطلبات الواردة إليك' : 'متابعة طلبات الخدمة الخاصة بك'}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !requests || requests.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10 text-muted-foreground opacity-50" />
            </div>
            <h3 className="font-bold text-lg mb-2">لا يوجد طلبات</h3>
            <p className="text-muted-foreground text-sm">
              {user?.role === 'provider' ? 'لم تتلقى أي طلبات عمل بعد.' : 'لم تقم بطلب أي خدمة بعد.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const config = statusConfig[request.status as keyof typeof statusConfig] ?? statusConfig.pending;
              const StatusIcon = config.icon;
              const isProvider = user?.role === 'provider';
              
              // If user is provider, show client details. If client, show provider details.
              const otherName = isProvider ? request.clientName : request.providerName;
              const otherAvatar = isProvider ? request.clientAvatarUrl : request.providerAvatarUrl;
              
              return (
                <Link key={request.id} href={`/my-requests/${request.id}`}>
                  <Card className="hover-elevate cursor-pointer border-border shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4 border-b border-border/50 flex justify-between items-start bg-muted/10">
                        <div>
                          <Badge variant="outline" className={`${config.color} border px-2 py-0.5 text-xs font-medium flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </Badge>
                          <h3 className="font-bold text-base mt-2 line-clamp-1">{request.serviceType}</h3>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {request.createdAt ? format(new Date(request.createdAt), 'dd MMMM yyyy - hh:mm a', { locale: ar }) : ''}
                          </p>
                        </div>
                        {request.isImmediate && (
                          <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-[10px]">عاجل</Badge>
                        )}
                      </div>
                      
                      <div className="p-4 flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-border">
                          <AvatarImage src={otherAvatar || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {otherName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {isProvider ? 'طالب الخدمة' : 'المهني'}
                          </p>
                          <p className="font-bold text-sm truncate">{otherName}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
