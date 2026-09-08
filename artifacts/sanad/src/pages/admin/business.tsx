import { useState } from "react";
import {
  Check,
  Clock3,
  Megaphone,
  RefreshCw,
  WalletCards,
  X,
} from "lucide-react";
import {
  useListAdminSubscriptionPayments,
  useReviewAdvertisement,
  useReviewSubscriptionPayment,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const walletNames: Record<string, string> = {
  jeeb: "جيب",
  floosk: "فلوسك",
  jawali: "جوالي",
  cash: "كاش",
  one_cash: "ون كاش",
  hasib: "حاسب",
  easy: "إيزي",
};

export default function AdminBusiness() {
  const { toast } = useToast();
  const { data: payments = [], isLoading, refetch } = useListAdminSubscriptionPayments();
  const reviewPayment = useReviewSubscriptionPayment();
  const reviewAd = useReviewAdvertisement();
  const [note, setNote] = useState("");
  const [adId, setAdId] = useState("");

  const reviewPaymentRequest = (id: number, status: "approved" | "rejected") => {
    reviewPayment.mutate(
      { id, data: { status, adminNote: note.trim() || null } },
      {
        onSuccess: () => {
          setNote("");
          refetch();
          toast({ title: status === "approved" ? "تم اعتماد الاشتراك" : "تم رفض العملية" });
        },
        onError: (error) => toast({ title: "تعذر تحديث العملية", description: error.message, variant: "destructive" }),
      },
    );
  };

  const reviewAdvertisementRequest = (status: "active" | "rejected") => {
    const id = Number(adId);
    if (!Number.isInteger(id)) {
      toast({ title: "أدخل رقم الإعلان", variant: "destructive" });
      return;
    }
    reviewAd.mutate(
      { id, data: { status, reviewNote: note.trim() || null } },
      {
        onSuccess: () => {
          setAdId("");
          setNote("");
          toast({ title: status === "active" ? "تم تفعيل الإعلان" : "تم رفض الإعلان" });
        },
        onError: (error) => toast({ title: "تعذر تحديث الإعلان", description: error.message, variant: "destructive" }),
      },
    );
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div><h1 className="text-2xl font-black">الاشتراكات والإعلانات</h1><p className="mt-1 text-sm text-muted-foreground">راجع التحويلات قبل تفعيل الاشتراكات، واعتمد الإعلانات قبل نشرها.</p></div>
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="ml-2 h-4 w-4" />تحديث</Button>
      </div>

      <section className="mb-8 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3"><Megaphone className="h-5 w-5 text-primary" /><div><h2 className="font-black">اعتماد إعلان برقم</h2><p className="mt-1 text-xs text-muted-foreground">استخدم رقم الإعلان من طلب المهني، ثم اختر قرار المراجعة.</p></div></div>
        <div className="mt-4 grid gap-3 md:grid-cols-[160px_1fr_auto_auto]">
          <input value={adId} onChange={(event) => setAdId(event.target.value)} placeholder="رقم الإعلان" className="h-10 rounded-xl border border-input bg-background px-3 text-sm" />
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="ملاحظة الإدارة (اختيارية)" className="min-h-10 rounded-xl md:min-h-10" />
          <Button onClick={() => reviewAdvertisementRequest("active")} disabled={reviewAd.isPending}><Check className="ml-2 h-4 w-4" />تفعيل</Button>
          <Button variant="outline" onClick={() => reviewAdvertisementRequest("rejected")} disabled={reviewAd.isPending}><X className="ml-2 h-4 w-4" />رفض</Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border p-5"><WalletCards className="h-5 w-5 text-primary" /><div><h2 className="font-black">طلبات تحويل الاشتراك</h2><p className="mt-1 text-xs text-muted-foreground">التحويلات لا تفعّل الاشتراك آلياً.</p></div></div>
        {isLoading ? <div className="p-10 text-center text-sm text-muted-foreground">جاري التحميل...</div> : payments.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">لا توجد طلبات دفع.</div> : <div className="divide-y divide-border">{payments.map((payment) => <div key={payment.id} className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-center"><div><div className="flex items-center gap-2"><span className="font-black">#{payment.id}</span><Badge variant="outline">{payment.status === "pending" ? "قيد المراجعة" : payment.status}</Badge></div><p className="mt-2 text-sm">المهني #{payment.providerId} · {payment.plan === "yearly" ? "سنوي" : "شهري"}</p><p className="mt-1 text-xs text-muted-foreground">محفظة {walletNames[payment.wallet] ?? payment.wallet} · رقم العملية: <b dir="ltr">{payment.transactionReference}</b></p></div><div className="text-xs text-muted-foreground">{payment.adminNote || "لا توجد ملاحظة"}<p className="mt-1">{new Date(payment.createdAt).toLocaleString("ar-YE")}</p></div>{payment.status === "pending" ? <div className="flex gap-2"><Button size="sm" onClick={() => reviewPaymentRequest(payment.id, "approved")} disabled={reviewPayment.isPending}><Check className="ml-1 h-4 w-4" />اعتماد</Button><Button size="sm" variant="outline" onClick={() => reviewPaymentRequest(payment.id, "rejected")} disabled={reviewPayment.isPending}><X className="ml-1 h-4 w-4" />رفض</Button></div> : <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-4 w-4" />تمت المراجعة</div>}</div>)}</div>}
      </section>
    </div>
  );
}