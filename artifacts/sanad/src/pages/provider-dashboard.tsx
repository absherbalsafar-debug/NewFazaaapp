import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowUpLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  Settings2,
  ShieldCheck,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useListRequests, useUpdateProvider } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth, apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface ProviderProfile {
  id: number;
  name: string;
  categoryName: string;
  city: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  yearsExperience: number;
  isVerified: boolean;
  isAvailable: boolean;
}

const statusLabel: Record<string, string> = {
  pending: "بانتظار ردك",
  accepted: "تم القبول",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  rejected: "مرفوض",
  cancelled: "ملغي",
};

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const { data: requests = [], isLoading: requestsLoading, refetch } = useListRequests(
    { role: "provider" },
    { query: { queryKey: ["provider-requests", user?.id], refetchOnMount: "always", staleTime: 15_000 } },
  );
  const updateProvider = useUpdateProvider();

  useEffect(() => {
    let active = true;
    apiRequest("/providers/me")
      .then((data) => {
        if (active) setProfile(data as ProviderProfile);
      })
      .catch((error: Error) => {
        if (active) toast({ title: "تعذر تحميل الملف المهني", description: error.message, variant: "destructive" });
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, [toast]);

  const stats = useMemo(() => {
    const pending = requests.filter((request) => request.status === "pending").length;
    const active = requests.filter((request) => ["accepted", "in_progress"].includes(request.status)).length;
    const completed = requests.filter((request) => request.status === "completed").length;
    return { pending, active, completed };
  }, [requests]);

  const toggleAvailability = (isAvailable: boolean) => {
    if (!profile) return;
    updateProvider.mutate(
      { id: profile.id, data: { isAvailable } },
      {
        onSuccess: (updated) => {
          setProfile((current) => current ? { ...current, isAvailable: updated.isAvailable } : current);
          toast({ title: isAvailable ? "أنت متاح لاستقبال الطلبات" : "تم إيقاف استقبال الطلبات" });
        },
        onError: (error) => toast({ title: "تعذر تحديث الحالة", description: error.message, variant: "destructive" }),
      },
    );
  };

  if (profileLoading || requestsLoading) {
    return <div className="min-h-[100dvh] flex items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6 text-center">
        <div>
          <BriefcaseBusiness className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="text-xl font-extrabold">أكمل ملفك المهني</h1>
          <p className="mt-2 text-sm text-muted-foreground">أنشئ ملفك حتى تبدأ باستقبال طلبات العملاء.</p>
          <Link href="/profile"><Button className="mt-5 rounded-xl">الانتقال إلى الملف</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-24" dir="rtl">
      <div className="gradient-primary overflow-hidden px-4 pb-20 pt-7 text-white">
        <div className="mx-auto max-w-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-white/65">لوحة المهني</p>
              <h1 className="mt-1 text-2xl font-extrabold">مرحباً، {profile.name}</h1>
              <p className="mt-2 text-xs text-white/70">{profile.categoryName} · {profile.city}</p>
            </div>
            <Link href="/settings"><button className="rounded-2xl bg-white/10 p-3"><Settings2 className="h-5 w-5" /></button></Link>
          </div>
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-3">
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${profile.isAvailable ? "bg-emerald-300 animate-pulse" : "bg-white/35"}`} />
              <div>
                <p className="text-sm font-bold">{profile.isAvailable ? "متاح الآن" : "غير متاح"}</p>
                <p className="text-[11px] text-white/65">استقبال طلبات جديدة</p>
              </div>
            </div>
            <Switch checked={profile.isAvailable} onCheckedChange={toggleAvailability} disabled={updateProvider.isPending} />
          </div>
        </div>
      </div>

      <main className="mx-auto -mt-10 max-w-lg space-y-4 px-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "طلبات جديدة", value: stats.pending, icon: Clock3, color: "text-amber-600 bg-amber-50" },
            { label: "أعمال نشطة", value: stats.active, icon: BriefcaseBusiness, color: "text-blue-600 bg-blue-50" },
            { label: "أعمال مكتملة", value: profile.completedJobs + stats.completed, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
            { label: "التقييم", value: profile.rating.toFixed(1), icon: Star, color: "text-yellow-600 bg-yellow-50" },
          ].map((item, index) => (
            <motion.div key={item.label} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.05 }} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${item.color}`}><item.icon className="h-4 w-4" /></div>
              <p className="text-2xl font-extrabold">{item.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground"><Wallet className="h-4 w-4" /><span className="text-xs">الأرباح</span></div>
            <p className="mt-3 text-lg font-extrabold">قيد التفعيل</p>
            <p className="mt-1 text-[11px] text-muted-foreground">ستظهر بعد اكتمال أول طلب</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4" /><span className="text-xs">الخبرة</span></div>
            <p className="mt-3 text-lg font-extrabold">{profile.yearsExperience} سنوات</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{profile.reviewCount} تقييم موثق</p>
          </div>
        </div>

        {!profile.isVerified && (
          <Link href="/verify" className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <ShieldCheck className="h-6 w-6 text-amber-600" />
            <div className="flex-1"><p className="text-sm font-bold">وثّق ملفك لزيادة الثقة</p><p className="mt-1 text-xs text-amber-700">ارفع الهوية والشهادات لإظهار شارة التوثيق.</p></div>
            <ArrowUpLeft className="h-4 w-4" />
          </Link>
        )}

        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div><h2 className="font-bold">آخر الطلبات</h2><p className="mt-1 text-xs text-muted-foreground">تابع أعمالك ورد على العملاء</p></div>
            <Link href="/my-requests" className="text-xs font-bold text-primary">عرض الكل</Link>
          </div>
          {requests.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">لا توجد طلبات حتى الآن</div>
          ) : (
            <div className="divide-y divide-border">
              {requests.slice(0, 4).map((request) => (
                <Link key={request.id} href={`/my-requests/${request.id}`} className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Eye className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{request.serviceType}</p><p className="mt-1 truncate text-xs text-muted-foreground">{request.clientName} · {request.city}</p></div>
                  <span className="text-[11px] font-bold text-muted-foreground">{statusLabel[request.status] ?? request.status}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
        <Button variant="outline" className="w-full rounded-xl" onClick={() => refetch()}>تحديث الطلبات</Button>
      </main>
    </div>
  );
}