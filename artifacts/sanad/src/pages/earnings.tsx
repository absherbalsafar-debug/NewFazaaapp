import { useLocation } from "wouter";
import { ArrowRight, Clock3, Info, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Earnings() {
  const [, navigate] = useLocation();

  return (
    <main className="min-h-[100dvh] bg-background pb-24" dir="rtl">
      <header className="border-b border-border bg-background/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button onClick={() => navigate('/profile')} className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
            <ArrowRight className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-black">أرباحي</h1>
            <p className="mt-0.5 text-[11px] text-muted-foreground">الرصيد وعمليات السحب</p>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-lg space-y-4 px-4 pt-6">
        <div className="rounded-[28px] bg-primary p-6 text-primary-foreground shadow-[0_18px_36px_rgba(14,47,98,0.18)]">
          <div className="flex items-center gap-2 text-white/70">
            <Wallet className="h-4 w-4" />
            <span className="text-sm">الرصيد المتاح</span>
          </div>
          <p className="mt-5 text-4xl font-black">٠ ر.ي</p>
          <p className="mt-2 text-xs text-white/60">ستظهر الأرباح بعد اكتمال أول طلب مدفوع.</p>
        </div>
        <div className="rounded-[24px] border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-[#a17b29]"><Clock3 className="h-5 w-5" /></div>
            <div>
              <h2 className="font-extrabold">الأرباح قيد التفعيل</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">سيتم تفعيل المحفظة والسحب الإلكتروني عند جاهزية نظام الدفع.</p>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs leading-5">لا توجد عمليات مالية حالياً، ولن يتم عرض أرقام تجريبية على حسابك.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/provider-dashboard')} className="h-12 w-full rounded-2xl">العودة إلى لوحتي</Button>
      </section>
    </main>
  );
}