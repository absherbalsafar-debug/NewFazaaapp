import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import {
  LogOut, ShieldCheck, MapPin, ChevronLeft, Settings, Bell,
  Heart, ClipboardList, CheckCircle2, Phone, Mail, Award,
  TrendingUp, Wallet, Star, Briefcase, Camera, Edit3
} from "lucide-react";
import { useUpdateProvider, useGetProvider } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: providerDetails, refetch } = useGetProvider(user?.id || 0, {
    query: { enabled: user?.role === 'provider', queryKey: ['provider-profile', user?.id] }
  });

  const updateProvider = useUpdateProvider();

  const handleAvailabilityToggle = (checked: boolean) => {
    if (!user) return;
    updateProvider.mutate(
      { id: user.id, data: { isAvailable: checked } },
      { onSuccess: () => { toast({ title: "✓ تم تحديث حالة التوفر" }); refetch(); } }
    );
  };

  if (!user) return null;

  const isProvider = user.role === 'provider';

  const clientMenu = [
    { icon: ClipboardList, label: "طلباتي", sub: "تتبع حالة طلباتك", href: "/my-requests", color: "bg-blue-50 text-blue-600" },
    { icon: Heart, label: "المفضلة", sub: "المهنيون المحفوظون", href: "/favorites", color: "bg-red-50 text-red-500" },
    { icon: Bell, label: "الإشعارات", sub: "إدارة التنبيهات", href: "/notifications", color: "bg-amber-50 text-amber-600" },
    { icon: Wallet, label: "وسائل الدفع", sub: "بطاقات وأرصدة", href: "/settings", color: "bg-green-50 text-green-600" },
    { icon: Settings, label: "الإعدادات", sub: "الحساب والأمان", href: "/settings", color: "bg-gray-50 text-gray-600" },
  ];

  const providerMenu = [
    { icon: TrendingUp, label: "إحصائياتي", sub: "الأداء والأرباح", href: "/my-requests", color: "bg-blue-50 text-blue-600" },
    { icon: ClipboardList, label: "الطلبات", sub: "طلبات العملاء", href: "/my-requests", color: "bg-purple-50 text-purple-600" },
    { icon: Wallet, label: "أرباحي", sub: "سحب الأرباح", href: "/settings", color: "bg-green-50 text-green-600" },
    { icon: ShieldCheck, label: "التوثيق", sub: "رفع المستندات", href: "/verify", color: "bg-amber-50 text-amber-600" },
    { icon: Bell, label: "الإشعارات", sub: "تنبيهات الطلبات", href: "/notifications", color: "bg-red-50 text-red-500" },
    { icon: Settings, label: "الإعدادات", sub: "الحساب والأمان", href: "/settings", color: "bg-gray-50 text-gray-600" },
  ];

  const menuItems = isProvider ? providerMenu : clientMenu;

  return (
    <div className="pb-28 bg-background min-h-[100dvh]" dir="rtl">
      {/* ── Hero Header ── */}
      <div className="gradient-primary pt-10 pb-24 px-4 relative overflow-hidden">
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -top-8 -right-4 w-36 h-36 rounded-full bg-white/5" />
        <div className="max-w-lg mx-auto relative">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white">حسابي</h1>
            <button
              onClick={() => navigate('/settings')}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <Settings className="w-4.5 h-4.5 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-[-5rem] relative z-10 space-y-4">
        {/* ── Profile Card ── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-3xl p-5 border border-border card-shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20 rounded-2xl border-4 border-white" style={{ boxShadow: '0 4px 16px rgba(15,32,66,0.15)' }}>
                <AvatarImage src={user.avatarUrl || ""} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold rounded-2xl">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <button className="absolute -bottom-2 -right-2 w-7 h-7 bg-primary rounded-xl flex items-center justify-center border-2 border-white">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              {user.phoneVerified && (
                <div className="absolute -top-1 -left-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center border-2 border-white">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-extrabold text-foreground truncate">{user.name}</h2>
                {user.phoneVerified && (
                  <span className="text-[10px] font-bold bg-accent/10 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    موثق
                  </span>
                )}
              </div>
              <span className="inline-block text-xs bg-primary/8 text-primary font-medium px-2 py-0.5 rounded-full mb-2">
                {isProvider ? 'مقدم خدمة' : user.role === 'admin' ? 'مدير' : 'عميل'}
              </span>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3 h-3 shrink-0" />
                  <span dir="ltr">{user.phone}</span>
                </p>
                {user.email && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </p>
                )}
                {user.city && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {user.city}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate('/settings')}
              className="shrink-0 w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </motion.div>

        {/* ── Provider Stats / Client Stats ── */}
        {isProvider && providerDetails ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-border card-shadow overflow-hidden"
          >
            {/* Availability toggle */}
            <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${providerDetails.isAvailable ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <div>
                  <p className="text-sm font-bold">{providerDetails.isAvailable ? 'متاح للعمل' : 'غير متاح'}</p>
                  <p className="text-xs text-muted-foreground">استقبال طلبات جديدة</p>
                </div>
              </div>
              <Switch
                checked={providerDetails.isAvailable}
                onCheckedChange={handleAvailabilityToggle}
              />
            </div>
            {/* Stats */}
            <div className="grid grid-cols-4 divide-x divide-border rtl:divide-x-reverse">
              {[
                { icon: Star, label: "التقييم", value: providerDetails.rating?.toFixed(1) ?? "—", sub: `من ٥` },
                { icon: Briefcase, label: "مشاريع", value: `${providerDetails.completedJobs}`, sub: "منجزة" },
                { icon: Award, label: "الخبرة", value: `${providerDetails.yearsExperience}`, sub: "سنوات" },
                { icon: TrendingUp, label: "المراجعات", value: `${providerDetails.reviewCount}`, sub: "تقييم" },
              ].map((s) => (
                <div key={s.label} className="p-3 text-center">
                  <p className="text-base font-extrabold text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Verification banner */}
            {!user.phoneVerified && (
              <button
                onClick={() => navigate('/verify')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 border-t border-amber-100 hover:bg-amber-100/70 transition-colors"
              >
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-sm font-bold text-amber-800">احصل على شارة التوثيق الذهبية</p>
                  <p className="text-xs text-amber-600">ارفع مستنداتك وزد من ثقة العملاء</p>
                </div>
                <ChevronLeft className="w-4 h-4 text-amber-500" />
              </button>
            )}
          </motion.div>
        ) : !isProvider ? (
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { icon: ClipboardList, label: "الطلبات", value: "—", href: "/my-requests", color: "bg-blue-50 text-blue-700" },
              { icon: Star, label: "التقييمات", value: "—", href: "/profile", color: "bg-amber-50 text-amber-700" },
              { icon: Heart, label: "المفضلة", value: "—", href: "/favorites", color: "bg-red-50 text-red-600" },
            ].map(s => (
              <button key={s.label} onClick={() => navigate(s.href)} className="bg-white rounded-2xl p-3 border border-border card-shadow text-center hover:border-primary/20 transition-colors">
                <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className="w-4.5 h-4.5" />
                </div>
                <p className="text-base font-extrabold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </button>
            ))}
          </div>
        ) : null}

        {/* ── Menu ── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-border card-shadow overflow-hidden"
        >
          {menuItems.map((item, idx) => (
            <button
              key={item.href + item.label}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/40 transition-colors text-right ${idx < menuItems.length - 1 ? 'border-b border-border/60' : ''}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                <item.icon className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{item.sub}</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            </button>
          ))}
        </motion.div>

        {/* ── Logout ── */}
        <button
          onClick={() => { logout(); navigate('/welcome'); }}
          className="w-full h-12 rounded-2xl border border-red-200 text-red-500 bg-white hover:bg-red-50 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          تسجيل الخروج
        </button>

        <p className="text-center text-[10px] text-muted-foreground/50 pb-2">سند © 2025 · الإصدار 1.0.0</p>
      </div>
    </div>
  );
}
