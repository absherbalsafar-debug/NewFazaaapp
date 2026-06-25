import { useRoute, Link } from "wouter";
import { useGetRequest, useUpdateRequest } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, MapPin, AlignLeft, Calendar, Loader2, Check, X } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ServiceRequestUpdateStatus } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const statusConfig = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  accepted: { label: "تم القبول", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  in_progress: { label: "جاري التنفيذ", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  completed: { label: "مكتمل", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  rejected: { label: "مرفوض", color: "bg-red-500/10 text-red-600 border-red-500/20" },
  cancelled: { label: "ملغي", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
};

export default function RequestDetail() {
  const [, params] = useRoute("/my-requests/:id");
  const id = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: request, isLoading, refetch } = useGetRequest(id, {
    query: { enabled: !!id, queryKey: ['request', id] }
  });

  const updateMutation = useUpdateRequest();

  const handleUpdateStatus = (status: ServiceRequestUpdateStatus) => {
    updateMutation.mutate({
      id,
      data: { status }
    }, {
      onSuccess: () => {
        toast({ title: "تم تحديث حالة الطلب" });
        refetch();
      }
    });
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;
  if (!request) return <div className="p-8 text-center">لم يتم العثور على الطلب</div>;

  const isProvider = user?.role === 'provider';
  const otherName = isProvider ? request.clientName : request.providerName;
  const otherAvatar = isProvider ? request.clientAvatarUrl : request.providerAvatarUrl;
  const config = statusConfig[request.status as keyof typeof statusConfig] ?? statusConfig.pending;

  return (
    <div className="pb-24 bg-background min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center gap-4">
        <Link href="/my-requests">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-bold flex-1">تفاصيل الطلب</h1>
        <Badge variant="outline" className={`${config.color} border px-2 py-0.5 text-xs font-medium`}>
          {config.label}
        </Badge>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
        <div className="bg-muted/30 p-4 rounded-2xl flex items-center gap-4 border border-border/50">
          <Avatar className="w-16 h-16 border-2 border-background">
            <AvatarImage src={otherAvatar || ""} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
              {otherName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">
              {isProvider ? 'طالب الخدمة' : 'المهني'}
            </p>
            <p className="font-bold text-lg">{otherName}</p>
            {!isProvider && <p className="text-xs text-primary">{request.providerCategoryName}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold mb-1">{request.serviceType}</h3>
            {request.createdAt && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-4">
                <Clock className="w-3.5 h-3.5" />
                {format(new Date(request.createdAt), 'dd MMMM yyyy - hh:mm a', { locale: ar })}
              </p>
            )}

            <div className="space-y-4">
              <div className="flex gap-3">
                <AlignLeft className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-1">الوصف</p>
                  <p className="text-sm leading-relaxed">{request.description}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-1">الموقع</p>
                  <p className="text-sm leading-relaxed">{request.city}، {request.district}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-1">الموعد</p>
                  {request.isImmediate ? (
                    <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs mt-1">عاجل (الآن)</Badge>
                  ) : request.scheduledAt ? (
                    <p className="text-sm">{format(new Date(request.scheduledAt), 'dd MMMM yyyy - hh:mm a', { locale: ar })}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">غير محدد</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isProvider && request.status === 'pending' && (
          <div className="flex gap-3 pt-4">
            <Button 
              className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold"
              onClick={() => handleUpdateStatus('accepted')}
              disabled={updateMutation.isPending}
            >
              <Check className="w-5 h-5 mr-2" />
              قبول الطلب
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl border-destructive text-destructive hover:bg-destructive/10 font-bold"
              onClick={() => handleUpdateStatus('rejected')}
              disabled={updateMutation.isPending}
            >
              <X className="w-5 h-5 mr-2" />
              رفض
            </Button>
          </div>
        )}

        {isProvider && request.status === 'accepted' && (
          <div className="flex gap-3 pt-4">
            <Button 
              className="flex-1 h-12 rounded-xl font-bold"
              onClick={() => handleUpdateStatus('in_progress')}
              disabled={updateMutation.isPending}
            >
              بدء التنفيذ
            </Button>
          </div>
        )}

        {isProvider && request.status === 'in_progress' && (
          <div className="flex gap-3 pt-4">
            <Button 
              className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold"
              onClick={() => handleUpdateStatus('completed')}
              disabled={updateMutation.isPending}
            >
              إكمال الخدمة
            </Button>
          </div>
        )}
        
        {!isProvider && ['pending', 'accepted'].includes(request.status) && (
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl border-destructive text-destructive hover:bg-destructive/10 font-bold"
              onClick={() => handleUpdateStatus('cancelled')}
              disabled={updateMutation.isPending}
            >
              إلغاء الطلب
            </Button>
          </div>
        )}
        
        {/* Messages Shortcut if Accepted/InProgress */}
        {['accepted', 'in_progress'].includes(request.status) && (
           <div className="pt-2">
             <Link href="/messages" className="w-full block">
                <Button variant="secondary" className="w-full h-12 rounded-xl font-bold bg-primary/10 text-primary hover:bg-primary/20">
                  إرسال رسالة
                </Button>
             </Link>
           </div>
        )}
      </div>
    </div>
  );
}
