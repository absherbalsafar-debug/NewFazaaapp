import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, CheckCircle, FileCheck2, ImagePlus, Loader2, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/auth";

type DocumentType = "selfie" | "id_front" | "id_back" | "portfolio" | "certificate";
const docs: Array<{ type: DocumentType; title: string; description: string; accept: string; multiple?: boolean }> = [
  { type: "selfie", title: "الصورة الشخصية", description: "صورة واضحة لوجهك بإضاءة جيدة", accept: "image/*" },
  { type: "id_front", title: "الهوية من الأمام", description: "صورة كاملة وواضحة للوجه الأمامي", accept: "image/*,application/pdf" },
  { type: "id_back", title: "الهوية من الخلف", description: "صورة كاملة وواضحة للوجه الخلفي", accept: "image/*,application/pdf" },
  { type: "portfolio", title: "صور الأعمال السابقة", description: "صور حقيقية من أعمالك المنجزة", accept: "image/*", multiple: true },
  { type: "certificate", title: "الشهادات والتراخيص", description: "اختياري: أرفق ما يثبت خبرتك", accept: "image/*,application/pdf", multiple: true },
];

export default function ProviderVerify() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<Partial<Record<DocumentType, File[]>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const current = docs[step];
  const progress = Math.round(((step + 1) / docs.length) * 100);
  const requiredReady = useMemo(() => Boolean(files.selfie?.length && files.id_front?.length && files.id_back?.length), [files]);

  const selectFiles = (type: DocumentType, selected: FileList | null) => {
    const list = Array.from(selected ?? []);
    if (!list.length) return;
    const valid = list.filter((file) => file.size <= 10 * 1024 * 1024 && (file.type.startsWith("image/") || file.type === "application/pdf"));
    if (valid.length !== list.length) toast({ title: "ملف غير صالح", description: "يسمح بالصور أو PDF حتى 10 ميجابايت.", variant: "destructive" });
    setFiles((old) => ({ ...old, [type]: valid }));
  };

  const submit = async () => {
    if (!requiredReady) { toast({ title: "أكمل المستندات الأساسية", description: "الصورة الشخصية والهوية من الأمام والخلف مطلوبة.", variant: "destructive" }); return; }
    setSaving(true);
    try {
      for (const item of docs) {
        for (const file of files[item.type] ?? []) {
          const upload = await apiRequest("/storage/uploads/request-url", { method: "POST", body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }) });
          const response = await fetch(upload.uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
          if (!response.ok) throw new Error("تعذر رفع أحد الملفات");
          await apiRequest("/providers/me/verification-documents", { method: "POST", body: JSON.stringify({ type: item.type, objectPath: upload.objectPath, originalName: file.name }) });
        }
      }
      setSubmitted(true);
      toast({ title: "تم إرسال التوثيق", description: "سيبقى ملفك مخفيًا حتى اعتماد فريق فزعة." });
    } catch (error) {
      toast({ title: "تعذر إرسال التوثيق", description: error instanceof Error ? error.message : "حاول مرة أخرى.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (submitted) return <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6 text-center" dir="rtl"><div className="w-full max-w-md rounded-[28px] border border-border bg-card p-7 shadow-xl"><CheckCircle className="mx-auto h-16 w-16 text-green-600" /><h1 className="mt-5 text-2xl font-black">طلبك قيد المراجعة</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">راجع فريق فزعة مستنداتك. لن يظهر ملفك للعملاء قبل اعتماد الهوية والبيانات.</p><Button className="mt-6 h-12 w-full rounded-xl" onClick={() => navigate("/provider-dashboard")}>العودة إلى لوحة المهني</Button></div></div>;

  return <main className="min-h-[100dvh] bg-background pb-8" dir="rtl"><header className="border-b border-border px-4 py-4"><div className="mx-auto flex max-w-xl items-center gap-3"><button onClick={() => navigate("/profile")} className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"><ArrowRight className="h-5 w-5" /></button><div><p className="text-xs font-bold text-muted-foreground">حماية العملاء تبدأ من التوثيق</p><h1 className="text-xl font-black">توثيق الملف المهني</h1></div></div></header><section className="mx-auto max-w-xl space-y-5 px-4 pt-6"><div><div className="mb-2 flex justify-between text-xs font-bold"><span>المرحلة {step + 1} من {docs.length}</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800"><ShieldCheck className="mb-2 h-5 w-5" /><b>لن يظهر ملفك قبل الاعتماد.</b><br />نحتفظ بالمستندات للمراجعة الداخلية ولا نعرضها للعملاء.</div><div className="rounded-[26px] border border-border bg-card p-6 shadow-sm"><div className="flex items-center gap-3"><div className="rounded-2xl bg-primary/10 p-3 text-primary">{current.type === "portfolio" ? <ImagePlus /> : <FileCheck2 />}</div><div><h2 className="text-lg font-black">{current.title}</h2><p className="mt-1 text-sm text-muted-foreground">{current.description}</p></div></div><label className="mt-6 flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 text-center"><Upload className="h-9 w-9 text-primary" /><span className="font-bold">اضغط لاختيار {current.multiple ? "الملفات" : "الملف"}</span><span className="text-xs text-muted-foreground">JPG أو PNG أو WEBP أو PDF — حتى 10 ميجابايت</span><input type="file" accept={current.accept} multiple={current.multiple} className="sr-only" onChange={(event) => selectFiles(current.type, event.target.files)} /></label>{files[current.type]?.length ? <div className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">تم اختيار {files[current.type]?.length} ملف: {files[current.type]?.map((file) => file.name).join("، ")}</div> : null}<div className="mt-6 flex gap-3">{step > 0 && <Button variant="outline" className="h-12 flex-1 rounded-xl" onClick={() => setStep(step - 1)}>رجوع</Button>}{step < docs.length - 1 ? <Button className="h-12 flex-1 rounded-xl" onClick={() => setStep(step + 1)}>التالي</Button> : <Button className="h-12 flex-1 rounded-xl" onClick={submit} disabled={saving}>{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "إرسال للمراجعة"}</Button>}</div></div></section></main>;
}
