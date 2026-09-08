import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Eye,
  Megaphone,
  Phone,
  Receipt,
  Send,
  Smartphone,
  Sparkles,
  WalletCards,
} from "lucide-react";
import {
  type AdvertisementInput,
  type SubscriptionPaymentInput,
  useCreateAdvertisement,
  useCreateSubscriptionPayment,
  useGetProviderBusiness,
  useListMyAdvertisements,
  useListProviderPayments,
  useListSubscriptionPlans,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const wallets: Array<{ value: SubscriptionPaymentInput["wallet"]; label: string }> = [
  { value: "jeeb", label: "جيب" },
  { value: "floosk", label: "فلوسك" },
  { value: "jawali", label: "جوالي" },
  { value: "cash", label: "كاش" },
  { value: "one_cash", label: "ون كاش" },
  { value: "hasib", label: "حاسب" },
  { value: "easy", label: "إيزي" },
];

const paymentStatus: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
  expired: "منتهي",
  refunded: "مسترد",
};

const adStatus: Record<string, string> = {
  pending: "بانتظار اعتماد الإدارة",
  active: "نشط",
  rejected: "مرفوض",
  expired: "منتهي",
};

export default function ProviderBusiness() {
  const { toast } = useToast();
  const { data: business, isLoading: businessLoading } = useGetProviderBusiness();
  const { data: plans = [] } = useListSubscriptionPlans();
  const { data: payments = [], refetch: refetchPayments } = useListProviderPayments();
  const { data: ads = [], refetch: refetchAds } = useListMyAdvertisements();
  const createPayment = useCreateSubscriptionPayment();
  const createAd = useCreateAdvertisement();

  const [paymentPlan, setPaymentPlan] = useState<"monthly" | "yearly">("monthly");
  const [wallet, setWallet] = useState<SubscriptionPaymentInput["wallet"]>("jeeb");
  const [transactionReference, setTransactionReference] = useState("");
  const [adForm, setAdForm] = useState({
    title: "",
    description: "",
    city: "",
    district: "",
    plan: "standard" as AdvertisementInput["plan"],
    durationDays: 7 as AdvertisementInput["durationDays"],
    budget: "",
  });

  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === paymentPlan), [plans, paymentPlan]);

  const submitPayment = (event: React.FormEvent) => {
    event.preventDefault();
    if (!transactionReference.trim()) {
      toast({ title: "أدخل رقم العملية", description: "نحتاج رقم التحويل حتى تراجع الإدارة طلبك.", variant: "destructive" });
      return;
    }
    createPayment.mutate(
      { data: { plan: paymentPlan, wallet, transactionReference: transactionReference.trim(), receiptUrl: null } },
      {
        onSuccess: () => {
          setTransactionReference("");
          refetchPayments();
          toast({ title: "تم إرسال طلب الاشتراك", description: "سيتم تفعيله بعد مراجعة التحويل من الإدارة." });
        },
        onError: (error) => toast({ title: "تعذر إرسال الطلب", description: error.message, variant: "destructive" }),
      },
    );
  };

  const submitAd = (event: React.FormEvent) => {
    event.preventDefault();
    const budget = Number(adForm.budget);
    if (!adForm.title.trim() || !adForm.city.trim() || !Number.isFinite(budget) || budget <= 0) {
      toast({ title: "أكمل بيانات الإعلان", description: "العنوان والمدينة والميزانية مطلوبة.", variant: "destructive" });
      return;
    }
    createAd.mutate(
      {
        data: {
          title: adForm.title.trim(),
          description: adForm.description.trim(),
          city: adForm.city.trim(),
          district: adForm.district.trim(),
          targetAudience: null,
          categoryId: null,
          plan: adForm.plan,
          durationDays: adForm.durationDays,
          budget,
          imageUrl: null,
        },
      },
      {
        onSuccess: () => {
          setAdForm({ title: "", description: "", city: "", district: "", plan: "standard", durationDays: 7, budget: "" });
          refetchAds();
          toast({ title: "تم إرسال الإعلان", description: "سيظهر بعد اعتماد الإدارة واستلام الدفع." });
        },
        onError: (error) => toast({ title: "تعذر إنشاء الإعلان", description: error.message, variant: "destructive" }),
      },
    );
  };

  if (businessLoading || !business) {
    return <div className="flex min-h-[100dvh] items-center justify-center text-sm text-muted-foreground">جاري تحميل لوحة الأعمال...</div>;
  }

  const subscription = business.subscription;
  const isFree = subscription.plan === "free" && subscription.status === "active";

  return (
    <main className="min-h-[100dvh] bg-background pb-24" dir="rtl">
      <header className="border-b border-border bg-background/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link href="/provider-dashboard" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground">لوحة المهني</p>
            <h1 className="text-xl font-black">الاشتراك والإعلانات</h1>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-2xl space-y-5 px-4 pt-5">
        <div className="rounded-[28px] bg-primary p-5 text-primary-foreground shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-white/65">اشتراكك الحالي</p>
              <h2 className="mt-2 text-2xl font-black">{isFree ? "مجاني لأول 300 مهني" : subscription.status === "active" ? `اشتراك ${subscription.plan === "yearly" ? "سنوي" : "شهري"}` : "لا يوجد اشتراك فعال"}</h2>
              <p className="mt-2 text-xs leading-5 text-white/70">
                {isFree ? `مقعدك المجاني رقم ${subscription.freeSlotNumber ?? "—"} · لا ينتهي` : subscription.endsAt ? `ينتهي في ${subscription.endsAt}` : "أرسل طلب اشتراك ليتم تفعيله بعد المراجعة"}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3"><Sparkles className="h-6 w-6 text-accent" /></div>
          </div>
          <p className="mt-5 border-t border-white/10 pt-3 text-xs text-white/70">
            المتبقي من المقاعد المجانية: <span className="font-black text-accent">{business.freeSlotsRemaining}</span>
          </p>
        </div>

        <section className="grid grid-cols-2 gap-3">
          {[
            { label: "مشاهدات الملف", value: business.metrics.profileViews, icon: Eye },
            { label: "ضغطات اتصال", value: business.metrics.callClicks, icon: Phone },
            { label: "ضغطات واتساب", value: business.metrics.whatsappClicks, icon: Smartphone },
            { label: "طلبات الخدمة", value: business.metrics.serviceRequests, icon: BarChart3 },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-card p-4">
              <item.icon className="h-4 w-4 text-primary" />
              <p className="mt-3 text-2xl font-black">{item.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </section>

        {!isFree && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <WalletCards className="h-5 w-5 text-primary" />
              <div><h2 className="font-black">تجديد أو تفعيل الاشتراك</h2><p className="mt-1 text-xs text-muted-foreground">حوّل للمحفظة ثم أرسل رقم العملية للمراجعة.</p></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {plans.filter((plan) => plan.id !== "free").map((plan) => (
                <button key={plan.id} type="button" onClick={() => setPaymentPlan(plan.id as "monthly" | "yearly")} className={`rounded-xl border p-3 text-right ${paymentPlan === plan.id ? "border-primary bg-primary/5" : "border-border"}`}>
                  <p className="text-sm font-black">{plan.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{plan.id === "monthly" ? `${plan.monthlyPrice} ريال شهرياً` : `${plan.yearlyPrice} ريال سنوياً`}</p>
                </button>
              ))}
            </div>
            <p className="mt-3 rounded-xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
              {selectedPlan?.description ?? "بعد التحويل أرسل رقم العملية."} أرقام التجار تحددها الإدارة لكل محفظة.
            </p>
            <form onSubmit={submitPayment} className="mt-4 space-y-3">
              <select value={wallet} onChange={(event) => setWallet(event.target.value as SubscriptionPaymentInput["wallet"])} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">
                {wallets.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <Input value={transactionReference} onChange={(event) => setTransactionReference(event.target.value)} placeholder="رقم عملية التحويل" className="h-11 rounded-xl" />
              <Button type="submit" className="h-11 w-full rounded-xl" disabled={createPayment.isPending}><Send className="ml-2 h-4 w-4" />{createPayment.isPending ? "جاري الإرسال..." : "إرسال للمراجعة"}</Button>
            </form>
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3"><Receipt className="h-5 w-5 text-primary" /><div><h2 className="font-black">طلبات الدفع السابقة</h2><p className="mt-1 text-xs text-muted-foreground">لا يتم تفعيل أي اشتراك قبل الاعتماد.</p></div></div>
          {payments.length === 0 ? <p className="mt-5 text-center text-sm text-muted-foreground">لا توجد عمليات دفع حتى الآن.</p> : <div className="mt-4 space-y-2">{payments.slice(0, 5).map((payment) => <div key={payment.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-3 text-xs"><span>{payment.transactionReference} · {payment.plan === "yearly" ? "سنوي" : "شهري"}</span><span className="font-bold text-muted-foreground">{paymentStatus[payment.status] ?? payment.status}</span></div>)}</div>}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3"><Megaphone className="h-5 w-5 text-primary" /><div><h2 className="font-black">إنشاء إعلان مدفوع</h2><p className="mt-1 text-xs text-muted-foreground">يظهر بوضوح كإعلان بعد اعتماد الإدارة.</p></div></div>
          <form onSubmit={submitAd} className="mt-4 space-y-3">
            <Input value={adForm.title} onChange={(event) => setAdForm({ ...adForm, title: event.target.value })} placeholder="عنوان الإعلان" className="h-11 rounded-xl" />
            <Textarea value={adForm.description} onChange={(event) => setAdForm({ ...adForm, description: event.target.value })} placeholder="وصف مختصر للخدمة" className="rounded-xl" />
            <div className="grid grid-cols-2 gap-2"><Input value={adForm.city} onChange={(event) => setAdForm({ ...adForm, city: event.target.value })} placeholder="المدينة" className="h-11 rounded-xl" /><Input value={adForm.district} onChange={(event) => setAdForm({ ...adForm, district: event.target.value })} placeholder="المنطقة" className="h-11 rounded-xl" /></div>
            <div className="grid grid-cols-3 gap-2">
              <select value={adForm.plan} onChange={(event) => setAdForm({ ...adForm, plan: event.target.value as AdvertisementInput["plan"] })} className="h-11 rounded-xl border border-input bg-background px-2 text-xs"><option value="standard">عادي</option><option value="featured">مميز</option><option value="homepage">رئيسي</option></select>
              <select value={adForm.durationDays} onChange={(event) => setAdForm({ ...adForm, durationDays: Number(event.target.value) as AdvertisementInput["durationDays"] })} className="h-11 rounded-xl border border-input bg-background px-2 text-xs"><option value={7}>7 أيام</option><option value={14}>14 يوماً</option><option value={30}>30 يوماً</option></select>
              <Input type="number" min="1" value={adForm.budget} onChange={(event) => setAdForm({ ...adForm, budget: event.target.value })} placeholder="الميزانية" className="h-11 rounded-xl" />
            </div>
            <Button type="submit" variant="outline" className="h-11 w-full rounded-xl" disabled={createAd.isPending}><Megaphone className="ml-2 h-4 w-4" />إرسال الإعلان للمراجعة</Button>
          </form>
          <div className="mt-5 space-y-2">{ads.length === 0 ? <p className="text-center text-xs text-muted-foreground">ستظهر إعلاناتك هنا.</p> : ads.map((ad) => <div key={ad.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-3 text-xs"><span className="font-bold">{ad.title}</span><span className="text-muted-foreground">{adStatus[ad.status] ?? ad.status}</span></div>)}</div>
        </section>

        <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100">
          <Clock3 className="h-4 w-4 shrink-0" />
          الدفع والإعلانات يمران بمراجعة الإدارة، ولا يتم اعتبار رفع رقم العملية موافقة تلقائية.
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-emerald-600" />بيانات الأداء تجمع ضغطات الاتصال وواتساب ومشاهدات الملف.</div>
      </section>
    </main>
  );
}