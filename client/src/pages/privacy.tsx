import { useLocation } from "wouter";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

const sections = [
  ["المعلومات التي نجمعها", "نجمع المعلومات التي تقدمها عند إنشاء الحساب مثل الاسم ورقم الهاتف أو البريد الإلكتروني والمدينة. وقد نحتفظ بمعلومات الخدمة والتقييمات والرسائل اللازمة لتشغيل المنصة."],
  ["كيف نستخدم المعلومات", "نستخدم بياناتك لتسجيل الدخول، مطابقة العملاء مع مقدمي الخدمة، إدارة الطلبات والرسائل، تحسين الأمان، وإرسال التنبيهات المتعلقة بالخدمات التي طلبتها."],
  ["مشاركة البيانات", "لا نبيع بياناتك الشخصية. قد تظهر بعض معلومات الملف المهني للعملاء عند تصفح الخدمات، ولا تتم مشاركة بيانات الاتصال الخاصة إلا عندما يكون ذلك ضرورياً لتنفيذ الطلب."],
  ["حماية الحساب", "حافظ على سرية رمز التحقق وكلمة المرور، وأبلغنا فوراً إذا لاحظت استخداماً غير معتاد لحسابك. نستخدم وسائل حماية مناسبة للمعلومات المخزنة لدينا."],
  ["حقوقك", "يمكنك طلب تصحيح معلوماتك أو الاستفسار عن طريقة استخدامها أو طلب حذف الحساب وفق المتطلبات القانونية والتشغيلية. تواصل مع فريق الدعم من داخل التطبيق."],
];

export default function Privacy() {
  const [, navigate] = useLocation();
  return (
    <main className="min-h-[100dvh] bg-background pb-10" dir="rtl">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button type="button" onClick={() => navigate('/settings')} className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"><ArrowRight className="h-4 w-4" /></button>
          <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /><h1 className="text-lg font-black">سياسة الخصوصية</h1></div>
        </div>
      </header>
      <article className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <div className="rounded-[26px] bg-primary p-5 text-white"><p className="text-xs font-bold text-accent">فزعة FAZAAH</p><h2 className="mt-2 text-2xl font-black">خصوصيتك أولوية</h2><p className="mt-2 text-sm leading-6 text-white/70">نوضح هنا ما نحتاجه لتقديم تجربة آمنة وواضحة.</p></div>
        {sections.map(([title, text]) => <section key={title} className="rounded-[22px] border border-border bg-card p-5"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><h3 className="font-extrabold">{title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{text}</p></div></div></section>)}
        <p className="text-center text-xs text-muted-foreground">آخر تحديث: 6 سبتمبر 2026</p>
      </article>
    </main>
  );
}