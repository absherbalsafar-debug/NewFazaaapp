import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import {
  LogOut, User as UserIcon, ShieldCheck, MapPin, Briefcase,
  ChevronLeft, Settings, Bell, Heart, ClipboardList,
  CheckCircle2, Phone, Mail, Award
} from "lucide-react";
import { useUpdateProvider, useGetProvider } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: providerDetails, refetch } = useGetProvider(user?.id || 0, {
    query: { enabled: user?.role === 'provider', queryKey: ['provider', user?.id] }
  });

  const updateProvider = useUpdateProvider();

  const handleAvailabilityToggle = (checked: boolean) => {
    if (!user) return;
    updateProvider.mutate(
      { id: user.id, data: { isAvailable: checked } },
      { onSuccess: () => { toast({ title: "تم تحديث حالة التوفر" }); refetch(); } }
    );
  };

  if (!user) return null;

  const menuItems = [
    { icon: ClipboardList, label: "طلباتي", href: "/my-requests" },
    { icon: Heart, label: "المفضلة", href: "/favorites" },
    { icon: Bell, label: "الإشعارات", href: "/notifications" },
    ...(user.role === 'provider' ? [{ icon: ShieldCheck, label: "توثيق الحساب", href: "/verify" }] : []),
    { icon: Settings, label: "الإعدادات", href: "/settings" },
  ];

  return (
    <div className="pb-28 bg-background min-h-[100dvh]" dir="rtl">
      {/* Header */}
      <div className="bg-primary pt-8 pb-20 px-4 relative overflow-hidden">
        <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-accent/10" />
        <h1 className="text-xl font-bold text-white relative">حسابي</h1>
      </div>

      <div className="max-w-md mx-auto px-4 mt-[-4.5rem] relative z-10 space-y-4">
        {/* Profile Card */}
        <Card className="border-border shadow-lg overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-background shadow-md">
                <AvatarImage src={user.avatarUrl || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {user.phoneVerified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-background">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-lg font-bold">{user.name}</h2>
                {user.phoneVerified && (
                  <span className="text-[10px] font-bold bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    موثق
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3 h-3" />
                  <span dir="ltr">{user.phone}</span>
                </p>
                {user.email && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{user.email}</span>
                  </p>
                )}
                {user.city && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    {user.city}
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-3 flex-wrap">
                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs font-normal">
                  {user.role === 'provider' ? 'مقدم خدمة' : user.role === 'admin' ? 'مدير' : 'عميل'}
                </Badge>
                {user.status === 'active' && (
                  <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-500/20 text-xs font-normal">
                    نشط
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Banner for providers */}
        {user.role === 'provider' && !user.phoneVerified && (
          <div
            className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/verify')}
          >
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-400">وثّق حسابك</p>
              <p className="text-xs text-amber-600 dark:text-amber-500">احصل على شارة التوثيق الخضراء</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-amber-500" />
          </div>
        )}

        {/* Provider Card */}
        {user.role === 'provider' && providerDetails && (
          <Card className="border-border shadow-sm">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">متاح للعمل</p>
                    <p className="text-xs text-muted-foreground">استقبال طلبات جديدة</p>
                  </div>
                </div>
                <Switch
                  checked={providerDetails.isAvailable}
                  onCheckedChange={handleAvailabilityToggle}
                />
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">التخصص</p>
                    <p className="font-bold text-sm">{providerDetails.categoryName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">التقييم</p>
                    <p className="font-bold text-sm">{providerDetails.rating?.toFixed(1) ?? '—'} ⭐</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Menu */}
        <Card className="border-border shadow-sm overflow-hidden">
          <CardContent className="p-0 divide-y divide-border">
            {menuItems.map(item => (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-right"
              >
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <item.icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                <ChevronLeft className="w-4 h-4 text-muted-foreground/50" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full h-12 rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive font-medium"
          onClick={() => { logout(); navigate('/welcome'); }}
        >
          <LogOut className="w-4 h-4 ml-2" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );
}
