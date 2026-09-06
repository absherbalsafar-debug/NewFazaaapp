import { useLocation } from "wouter";
import { ArrowRight, CreditCard, Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Wallet() {
  const [, navigate] = useLocation();

  return (
    <main className="min-h-[100dvh] bg-background pb-24" dir="rtl">
      <header className="border-b border-border bg-background/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button onClick={() => navigate('/profile')} className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
            <ArrowRight className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-black">وسائل الدفع</h1>
            <p className="mt-0.5 text-[11px] text-muted-foreground">إدارة بطاقاتك وأرصدة حسابك</p>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-lg space-y-4 px-4 pt-6">
        <div className="rounded-[28px] border border-border bg-card p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CreditCard className="h-7 w-7" /></div>
          <h2 className="mt-4 text-lg font-extrabold">لا توجد وسائل دفع محفوظة</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">ستتمكن من إضافة وسيلة دفع آمنة عند تفعيل الدفع الإلكتروني.</p>
          <Button variant="outline" disabled className="mt-5 h-12 w-full rounded-2xl"><Plus className="ml-2 h-4 w-4" />إضافة وسيلة دفع</Button>
        </div>
        <div className="flex items-start gap-2 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs leading-5">بيانات الدفع لا تُطلب منك داخل التطبيق قبل تفعيل مزود الدفع الرسمي.</p>
        </div>
      </section>
    </main>
  );
}