import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRegister, useListCategories } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, FileCheck2, ImagePlus, Loader2, ShieldCheck, UserRound, Wrench } from "lucide-react";

const schema = z.object({
  name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  phone: z.string().min(9, "رقم الهاتف غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  role: z.enum(["client", "provider"]),
  categoryId: z.coerce.number().optional().nullable(),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  yearsExperience: z.coerce.number().optional().nullable(),
});
type FormValues = z.infer<typeof schema>;

const steps = [
  { title: "المعلومات الأساسية", icon: UserRound },
  { title: "البيانات المهنية", icon: BriefcaseBusiness },
  { title: "معرض الأعمال", icon: ImagePlus },
  { title: "التوثيق والتحقق", icon: FileCheck2 },
  { title: "الاشتراك", icon: ShieldCheck },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { login: setAuth } = useAuth();
  const { toast } = useToast();
  const { data: categories } = useListCategories();
  const registerMutation = useRegister();
  const [step, setStep] = useState(1);
  const [portfolioFiles, setPortfolioFiles] = useState<string[]>([]);
  const form = useForm<FormValues>({ defaultValues: { name: "", phone: "", password: "", role: "provider", categoryId: null, city: "", district: "", bio: "", yearsExperience: 1 } });
  const role = form.watch("role");

  const next = async () => {
    if (step === 1 && (!form.getValues("name") || !form.getValues("phone") || !form.getValues("password"))) {
      toast({ title: "أكمل المعلومات الأساسية", description: "الاسم والهاتف وكلمة المرور مطلوبة.", variant: "destructive" }); return;
    }
    if (step === 2 && (!form.getValues("categoryId") || !form.getValues("city"))) {
      toast({ title: "أكمل بياناتك المهنية", description: "اختر التخصص والمدينة على الأقل.", variant: "destructive" }); return;
    }
    if (step < 4) { setStep(step + 1); return; }
    const values = form.getValues();
    const parsed = schema.safeParse(values);
    if (!parsed.success) { toast({ title: "راجع البيانات", description: parsed.error.issues[0]?.message, variant: "destructive" }); return; }
    registerMutation.mutate({ data: { ...values, categoryId: values.categoryId || undefined, city: values.city || undefined, district: values.district || undefined, bio: values.bio || undefined, yearsExperience: values.yearsExperience || undefined } as any }, {
      onSuccess: (res) => { setAuth(res.token, res.user as any); setStep(5); toast({ title: "تم إنشاء ملفك", description: "حسابك الآن قيد مراجعة فريق فزعة ولن يظهر للعملاء قبل الاعتماد." }); },
      onError: (error) => toast({ title: "تعذر إنشاء الحساب", description: error.message, variant: "destructive" }),
    });
  };

  if (step === 5) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5" dir="rtl">
      <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-7 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-700"><Check className="h-8 w-8" /></div>
        <h1 className="mt-5 text-2xl font-black">تم حفظ طلبك بنجاح</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">ملفك غير ظاهر للعملاء حاليًا. أكمل التوثيق برفع الهوية والصورة الشخصية والأعمال، ثم ينتقل الطلب إلى فريق فزعة للمراجعة.</p>
        <div className="mt-5 space-y-3"><Button className="h-12 w-full rounded-xl" onClick={() => setLocation("/provider-verify")}>إكمال التوثيق الآن</Button><Button variant="outline" className="h-12 w-full rounded-xl" onClick={() => setLocation("/provider-business")}>اختيار الاشتراك لاحقًا</Button></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-10" dir="rtl">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Wrench className="h-7 w-7" /></div><h1 className="mt-4 text-2xl font-black">تسجيل مهني في فزعة</h1><p className="mt-2 text-sm text-muted-foreground">رحلة واضحة من 5 مراحل لحماية العملاء وبناء الثقة</p></div>
        <div className="space-y-2"><div className="flex items-center justify-between text-xs font-bold"><span>المرحلة {step} من 5</span><span>{step * 20}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${step * 20}%` }} /></div><div className="grid grid-cols-5 gap-1">{steps.map((item, index) => <div key={item.title} className={`text-center text-[10px] ${index + 1 <= step ? "font-bold text-primary" : "text-muted-foreground"}`}><item.icon className="mx-auto h-4 w-4" /><span className="mt-1 block truncate">{item.title}</span></div>)}</div></div>
        <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
          {step === 1 && <div className="space-y-4"><h2 className="text-lg font-black">المعلومات الأساسية</h2><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => form.setValue("role", "client")} className={`rounded-xl border p-3 text-sm font-bold ${role === "client" ? "border-primary bg-primary/5" : "border-border"}`}>عميل</button><button type="button" onClick={() => form.setValue("role", "provider")} className={`rounded-xl border p-3 text-sm font-bold ${role === "provider" ? "border-primary bg-primary/5" : "border-border"}`}>مهني</button></div><Input placeholder="الاسم الكامل" {...form.register("name")} /><Input placeholder="رقم الهاتف" dir="ltr" className="text-left" {...form.register("phone")} /><Input type="password" placeholder="كلمة المرور" dir="ltr" className="text-left" {...form.register("password")} /></div>}
          {step === 2 && <div className="space-y-4"><h2 className="text-lg font-black">البيانات المهنية</h2><Select value={String(form.watch("categoryId") ?? "")} onValueChange={(value) => form.setValue("categoryId", Number(value))}><SelectTrigger><SelectValue placeholder="اختر المهنة والتخصص" /></SelectTrigger><SelectContent>{categories?.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.icon} {category.name}</SelectItem>)}</SelectContent></Select><div className="grid grid-cols-2 gap-3"><Input placeholder="المحافظة / المدينة" {...form.register("city")} /><Input placeholder="المديرية" {...form.register("district")} /></div><Input type="number" placeholder="سنوات الخبرة" {...form.register("yearsExperience")} /><Textarea placeholder="نبذة مهنية مختصرة عن خبرتك وخدماتك" className="min-h-28" {...form.register("bio")} /></div>}
          {step === 3 && <div className="space-y-4"><h2 className="text-lg font-black">معرض الأعمال</h2><p className="text-sm leading-6 text-muted-foreground">أضف صورًا لأعمالك السابقة. يمكنك استكمال الرفع من لوحة التوثيق بعد إنشاء الحساب.</p><label className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5"><ImagePlus className="h-8 w-8 text-primary" /><span className="text-sm font-bold">إضافة صور الأعمال</span><input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => setPortfolioFiles(Array.from(event.target.files ?? []).map((file) => file.name))} /></label>{portfolioFiles.length > 0 && <div className="rounded-xl bg-muted p-3 text-xs">تم اختيار {portfolioFiles.length} صور: {portfolioFiles.join("، ")}</div>}<p className="text-xs text-muted-foreground">الصور لا تُعرض للعملاء قبل اعتماد ملفك.</p></div>}
          {step === 4 && <div className="space-y-4"><h2 className="text-lg font-black">التوثيق والتحقق</h2><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">بعد إنشاء الحساب يجب رفع الهوية من الأمام والخلف، صورة شخصية واضحة، وصور الأعمال أو الشهادات. سيظل حسابك قيد المراجعة ولن يظهر للعملاء قبل الموافقة.</div><div className="space-y-3 text-sm">{["هوية شخصية أمامية وخلفية", "صورة شخصية واضحة", "صور أعمال سابقة", "شهادات أو تراخيص إن وجدت"].map((label) => <div key={label} className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />{label}</div>)}</div></div>}
          <div className="mt-6 flex gap-3">{step > 1 && <Button type="button" variant="outline" className="h-12 flex-1 rounded-xl" onClick={() => setStep(step - 1)}><ArrowRight className="ml-2 h-4 w-4" />رجوع</Button>}<Button type="button" className="h-12 flex-1 rounded-xl font-bold" onClick={next} disabled={registerMutation.isPending}>{registerMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : step === 4 ? "إنشاء الحساب والمتابعة" : <>التالي<ArrowLeft className="mr-2 h-4 w-4" /></>}</Button></div>
        </div>
        <p className="text-center text-sm text-muted-foreground">لديك حساب بالفعل؟ <Link href="/login" className="font-bold text-primary">سجل دخول</Link></p>
      </div>
    </div>
  );
}
