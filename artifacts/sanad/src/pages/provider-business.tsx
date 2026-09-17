import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Eye,
  FileUp,
  Megaphone,
  Phone,
  Receipt,
  Send,
  Smartphone,
  Sparkles,
  Upload,
  WalletCards,
} from "lucide-react";
import {
  type AdvertisementInput,
  type SubscriptionPaymentInput,
  requestUploadUrl,
  useCreateAdvertisement,
  useCreateSubscriptionPayment,
  useGetProviderBusiness,
  useListMyAdvertisements,
  useListPaymentWallets,
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

const advertisementPackages: Array<{ id: string; title: string; days: number; placement: string; description: string }> = [
  { id: "standard", title: "إعلان عادي", days: 7, placement: "داخل نتائج الفئة", description: "حل مناسب للظهور الأساسي" },
  { id: "featured", title: "إعلان مميز", days: 14, placement: "ترتيب أعلى وشارة مميز", description: "ظهور أقوى لمدة أسبوعين" },
  { id: "homepage", title: "إعلان رئيسي", days: 30, placement: "الصفحة الرئيسية والفئة", description: "أوسع ظهور داخل فزعة" },
];

export default function ProviderBusiness() {
  const { toast } = useToast();
  const { data: business, isLoading: businessLoading } = useGetProviderBusiness();
  const { data: plans = [] } = useListSubscriptionPlans();
  const { data: paymentWallets = [] } = useListPaymentWallets();
  const { data: payments = [], refetch: refetchPayments } = useListProviderPayments();
  const { data: ads = [], refetch: refetchAds } = useListMyAdvertisements();
  const createPayment = useCreateSubscriptionPayment();
  const createAd = useCreateAdvertisement();

  const [paymentPlan, setPaymentPlan] = useState<"monthly" | "yearly">("monthly");
  const [paymentPurpose, setPaymentPurpose] = useState<"subscriptions" | "advertisements">("subscriptions");
  const [wallet, setWallet] = useState<SubscriptionPaymentInput["wallet"]>("jeeb");
  const [transactionReference, setTransactionReference] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [adForm, setAdForm] = useState({
    title: "",
    description: "",
    city: "",
    district: "",
    plan: "standard" as AdvertisementInput["plan"],
    durationDays: 7 as AdvertisementInput["durationDays"],
    budget: "",
  });
  const [adPackages, setAdPackages] = useState(advertisementPackages);
  useEffect(() => { const token = localStorage.getItem("fazaah_token"); fetch("/api/commercial-plans?kind=advertisement", { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then((response) => response.ok ? response.json() : []).then((rows: Array<{ code: string; name: string; description: string; durationDays: number }>) => { if (rows.length) setAdPackages(rows.map((row) => ({ id: row.code, title: row.name, days: row.durationDays, placement: row.description, description: row.description }))); }).catch(() => undefined); }, []);

  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === paymentPlan), [plans, paymentPlan]);
  const selectedWallet = useMemo(() => paymentWallets.find((item) => item.wallet === wallet), [paymentWallets, wallet]);
  const availableWallets = useMemo(() => paymentWallets.filter((item) => item.usage === "both" || item.usage === paymentPurpose), [paymentWallets, paymentPurpose]);
  const selectedAdPackage = adPackages.find((item) => item.id === adForm.plan) ?? adPackages[0];

  const submitPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!transactionReference.trim()) {
      toast({ title: "أدخل رقم العملية", description: "نحتاج رقم التحويل حتى تراجع الإدارة طلبك.", variant: "destructive" });
      return;
    }
    if (!receiptFile) {
      toast({ title: "أرفق إيصال التحويل", description: "يساعد الإيصال الإدارة على مطابقة العملية قبل اعتمادها.", variant: "destructive" });
      return;
    }
    setIsUploadingReceipt(true);
    try {
      const upload = await requestUploadUrl({
        name: receiptFile.name,
        size: receiptFile.size,
        contentType: receiptFile.type || "application/octet-stream",
      });
      const uploadResponse = await fetch(upload.uploadURL, {
        method: "PUT",
        headers: { "Content-Type": receiptFile.type || "application/octet-stream" },
        body: receiptFile,
      });
      if (!uploadResponse.ok) throw new Error("تعذر رفع الإيصال");
      createPayment.mutate(
        { data: { plan: paymentPlan, wallet, transactionReference: transactionReference.trim(), receiptUrl: upload.objectPath } },
        {
          onSuccess: () => {
            setTransactionReference("");
            setReceiptFile(null);
            refetchPayments();
            toast({ title: "تم إرسال طلب الاشتراك", description: "سيتم تفعيله بعد مراجعة التحويل والإيصال من الإدارة." });
          },
          onError: (error) => toast({ title: "تعذر إرسال الطلب", description: error.message, variant: "destructive" }),
        },
      );
    } catch (error) {
      toast({ title: "تعذر رفع الإيصال", description: error instanceof Error ? error.message : "حاول مرة أخرى.", variant: "destructive" });
    } finally {
      setIsUploadingReceipt(false);
    }
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
            <div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-primary" /><div><h2 className="font-black">خطط اشتراك المهني</h2><p className="mt-1 text-xs text-muted-foreground">اختر مدة الظهور والمزايا المناسبة لملفك المهني.</p></div></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {plans.filter((plan) => plan.id !== "free").map((plan) => <button key={plan.id} type="button" onClick={() => { setPaymentPlan(plan.id as "monthly" | "yearly"); setPaymentPurpose("subscriptions"); }} className={`rounded-2xl border p-4 text-right transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md ${paymentPurpose === "subscriptions" && paymentPlan === plan.id ? "border-primary bg-primary/5 shadow-sm" : "border-border"}`}><div className="flex items-start justify-between gap-3"><span className="font-black">{plan.name}</span><span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-black text-primary">{plan.id === "monthly" ? `${plan.monthlyPrice} ريال / شهر` : `${plan.yearlyPrice} ريال`}</span></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{plan.description}</p><ul className="mt-3 space-y-1 text-xs text-muted-foreground">{plan.benefits.map((benefit) => <li key={benefit}>✓ {benefit}</li>)}</ul></button>)}
            </div>
          </section>
        )}

        {!isFree && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <WalletCards className="h-5 w-5 text-primary" />
              <div><h2 className="font-black">اختر محفظة الدفع</h2><p className="mt-1 text-xs text-muted-foreground">لـ {paymentPurpose === "subscriptions" ? selectedPlan?.name ?? "الاشتراك المختار" : selectedAdPackage.title} — اختر المحفظة للانتقال إلى شاشة الدفع الخاصة بها.</p></div>
            </div>
            <div className="mt-4 grid gap-3">
              {availableWallets.length === 0 ? <div className="rounded-2xl bg-muted/50 p-5 text-center text-sm text-muted-foreground">لا توجد محافظ مفعلة لهذا الاستخدام حاليًا.</div> : availableWallets.map((item) => (
                <button key={item.wallet} type="button" onClick={() => setWallet(item.wallet)} className={`flex min-h-[84px] w-full items-center gap-4 rounded-2xl border p-4 text-right transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md ${wallet === item.wallet ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background"}`}>
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary">{item.logoUrl ? <img src={item.logoUrl} alt="" className="h-full w-full object-contain" /> : <WalletCards className="h-7 w-7" />}</span>
                  <span className="min-w-0 flex-1"><span className="block text-base font-black">{item.displayName}</span>{item.description && <span className="mt-1 block truncate text-xs text-muted-foreground">{item.description}</span>}<span className="mt-1 block text-[11px] text-primary">متابعة الدفع</span></span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
            {selectedWallet && <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6"><p className="font-black text-primary">تم اختيار {selectedWallet.displayName}</p><p className="mt-1 text-muted-foreground">شاشة الدفع الإلكتروني الخاصة بالمحفظة ستكون متاحة عند اكتمال الربط مع مزود الدفع. لا يُطلب منك حاليًا إدخال رقم عملية أو رفع إيصال.</p></div>}
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3"><Receipt className="h-5 w-5 text-primary" /><div><h2 className="font-black">طلبات الدفع السابقة</h2><p className="mt-1 text-xs text-muted-foreground">لا يتم تفعيل أي اشتراك قبل الاعتماد.</p></div></div>
          {payments.length === 0 ? <p className="mt-5 text-center text-sm text-muted-foreground">لا توجد عمليات دفع حتى الآن.</p> : <div className="mt-4 space-y-2">{payments.slice(0, 5).map((payment) => <div key={payment.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-3 text-xs"><span>{payment.transactionReference} · {payment.plan === "yearly" ? "سنوي" : "شهري"}{payment.receiptUrl && <a className="mr-2 font-bold text-primary underline" href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/storage${payment.receiptUrl}`} target="_blank" rel="noreferrer">الإيصال</a>}</span><span className="shrink-0 font-bold text-muted-foreground">{paymentStatus[payment.status] ?? payment.status}</span></div>)}</div>}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3"><Megaphone className="h-5 w-5 text-primary" /><div><h2 className="font-black">إنشاء إعلان مدفوع</h2><p className="mt-1 text-xs text-muted-foreground">يظهر بوضوح كإعلان بعد اعتماد الإدارة.</p></div></div>
          <form onSubmit={submitAd} className="mt-4 space-y-3">
            <Input value={adForm.title} onChange={(event) => setAdForm({ ...adForm, title: event.target.value })} placeholder="عنوان الإعلان" className="h-11 rounded-xl" />
            <Textarea value={adForm.description} onChange={(event) => setAdForm({ ...adForm, description: event.target.value })} placeholder="وصف مختصر للخدمة" className="rounded-xl" />
            <div className="grid grid-cols-2 gap-2"><Input value={adForm.city} onChange={(event) => setAdForm({ ...adForm, city: event.target.value })} placeholder="المدينة" className="h-11 rounded-xl" /><Input value={adForm.district} onChange={(event) => setAdForm({ ...adForm, district: event.target.value })} placeholder="المنطقة" className="h-11 rounded-xl" /></div>
            <div>
              <p className="mb-2 text-xs font-black text-foreground">اختر باقة الإعلان</p>
              <div className="grid gap-2">
                {adPackages.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setPaymentPurpose("advertisements"); setAdForm({ ...adForm, plan: item.id as AdvertisementInput["plan"], durationDays: item.days as AdvertisementInput["durationDays"] }); }}
                    className={`flex items-center justify-between rounded-xl border p-3 text-right transition-colors ${adForm.plan === item.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                  >
                    <span>
                      <span className="block text-sm font-black">{item.title}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">{item.description} · {item.placement}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-bold">{item.days} يوماً</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
              الباقة المختارة: <b className="text-foreground">{selectedAdPackage.title}</b> · مدة الظهور <b className="text-foreground">{selectedAdPackage.days} يوماً</b>
            </div>
            <Input type="number" min="1" step="1" value={adForm.budget} onChange={(event) => setAdForm({ ...adForm, budget: event.target.value })} placeholder="مبلغ الإعلان بالريال اليمني" className="h-11 rounded-xl" />
            <Button type="submit" variant="outline" className="h-11 w-full rounded-xl" disabled={createAd.isPending}><Megaphone className="ml-2 h-4 w-4" />إرسال الإعلان للمراجعة</Button>
          </form>
          <div className="mt-5 space-y-2">{ads.length === 0 ? <p className="text-center text-xs text-muted-foreground">ستظهر إعلاناتك هنا.</p> : ads.map((ad) => <div key={ad.id} className="rounded-xl border border-border px-3 py-3 text-xs"><div className="flex items-center justify-between gap-3"><span className="font-bold">{ad.title}</span><span className="text-muted-foreground">{adStatus[ad.status] ?? ad.status}</span></div><p className="mt-2 text-muted-foreground">#{ad.id} · {ad.plan === "standard" ? "عادي" : ad.plan === "featured" ? "مميز" : "رئيسي"} · {ad.durationDays} يوماً · <b className="text-foreground">{ad.budget.toLocaleString("ar-YE")} ريال</b></p></div>)}</div>
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
