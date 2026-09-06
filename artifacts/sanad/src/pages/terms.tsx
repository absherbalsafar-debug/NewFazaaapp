import { useLocation } from "wouter";
import { ArrowRight, CheckCircle2, ScrollText } from "lucide-react";

const sections = [
  ["قبول الشروط", "باستخدام فزعة، تقر بأنك قرأت هذه الشروط وتوافق على الالتزام بها. إذا لم توافق عليها، يرجى عدم استخدام الخدمات."],
  ["الحسابات", "يجب تقديم معلومات صحيحة والمحافظة على سرية بيانات الدخول. الحساب شخصي، وأنت مسؤول عن النشاط الذي يتم من خلاله."],
  ["مقدمو الخدمة", "يلتزم مقدم الخدمة بوصف خدماته بدقة، احترام العملاء، الالتزام بالمواعيد المتفق عليها، وعدم تقديم أعمال مخالفة للأنظمة أو السلامة."],
  ["العملاء والطلبات", "على العميل وصف احتياجه بوضوح واحترام مقدم الخدمة. تفاصيل السعر والموعد ونطاق العمل يجب أن تُتفق عليها داخل الطلب قبل التنفيذ."],
  ["المحتوى والسلوك", "يُمنع استخدام فزعة للإساءة أو الاحتيال أو نشر محتوى مخالف أو جمع بيانات الآخرين دون إذن. قد نوقف الحساب عند وجود مخالفة واضحة."],
  ["الدفع والتحديثات", "قد نضيف خدمات دفع أو ميزات جديدة لاحقاً. سنوضح أي رسوم أو شروط مرتبطة بها قبل استخدامها، وقد نحدّث هذه الشروط عند الحاجة."],
];

export default function Terms() {
  const [, navigate] = useLocation();
  return (
    <main className="min-h-[100dvh] bg-background pb-10" dir="rtl">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button type="button" onClick={() => navigate('/settings')} className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"><ArrowRight className="h-4 w-4" /></button>
          <div className="flex items-center gap-2"><ScrollText className="h-5 w-5 text-primary" /><h1 className="text-lg font-black">شروط الاستخدام</h1></div>
        </div>
      </header>
      <article className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <div className="rounded-[26px] border border-accent/30 bg-accent/10 p-5"><p className="text-xs font-bold text-[#a17b29]">استخدام مسؤول</p><h2 className="mt-2 text-2xl font-black text-primary">شروط واضحة للجميع</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">تهدف هذه الشروط إلى تنظيم العلاقة بين العملاء ومقدمي الخدمات.</p></div>
        {sections.map(([title, text]) => <section key={title} className="rounded-[22px] border border-border bg-card p-5"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><h3 className="font-extrabold">{title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{text}</p></div></div></section>)}
        <p className="text-center text-xs text-muted-foreground">آخر تحديث: 6 سبتمبر 2026</p>
      </article>
    </main>
  );
}