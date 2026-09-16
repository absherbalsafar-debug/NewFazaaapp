import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, FileCheck2, IdCard, MapPin, Save, Send, ShieldCheck, Upload, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth, apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type Category = { id: number; name: string; icon: string };
type Profile = { name: string; categoryId: number; city: string; district: string; bio: string; yearsExperience: number; verificationStatus: string; identityDocumentsUploaded: { front: boolean; back: boolean }; rejectionReason?: string | null };
type Side = "front" | "back";

const API_BASE = `${import.meta.env.BASE_URL?.replace(/\/$/, "")}/api`;
const token = () => localStorage.getItem("fazaah_token");

export default function ProviderVerify() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<Profile>({ name: user?.name ?? "", categoryId: 1, city: user?.city ?? "", district: "", bio: "", yearsExperience: 0, verificationStatus: "draft", identityDocumentsUploaded: { front: false, back: false } });
  const [files, setFiles] = useState<Partial<Record<Side, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<Side, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([apiRequest("/categories"), apiRequest("/providers/me")]).then(([categoryData, profileData]) => {
      if (!active) return;
      setCategories(categoryData);
      setProfile((current) => ({ ...current, ...profileData, name: profileData.name ?? current.name, identityDocumentsUploaded: profileData.identityDocumentsUploaded ?? { front: false, back: false } }));
    }).catch((error) => toast({ title: "تعذر تحميل ملفك", description: error.message, variant: "destructive" })).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [toast]);

  const selectedCategory = useMemo(() => categories.find((item) => item.id === Number(profile.categoryId)), [categories, profile.categoryId]);

  async function saveProfile() {
    if (!profile.name.trim() || !profile.city.trim() || !profile.district.trim() || !profile.bio.trim() || profile.bio.trim().length < 20) {
      toast({ title: "أكمل بيانات الملف", description: "الاسم والمدينة والحي والنبذة (20 حرفاً على الأقل) مطلوبة.", variant: "destructive" });
      return false;
    }
    setSaving(true);
    try {
      const saved = await apiRequest("/providers/me", { method: "PATCH", body: JSON.stringify({ name: profile.name.trim(), categoryId: Number(profile.categoryId), city: profile.city.trim(), district: profile.district.trim(), bio: profile.bio.trim(), yearsExperience: Number(profile.yearsExperience) || 0 }) });
      setProfile((current) => ({ ...current, ...saved }));
      toast({ title: "تم حفظ الملف", description: "أكمل رفع وثيقتي الهوية للمتابعة." });
      return true;
    } catch (error) { toast({ title: "تعذر حفظ الملف", description: error instanceof Error ? error.message : "حاول مرة أخرى", variant: "destructive" }); return false; }
    finally { setSaving(false); }
  }

  async function chooseFile(side: Side, file: File | undefined) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type) || file.size > 8 * 1024 * 1024) {
      toast({ title: "ملف غير صالح", description: "ارفع صورة JPG أو PNG أو WEBP بحجم لا يتجاوز 8 ميجابايت.", variant: "destructive" }); return;
    }
    setFiles((current) => ({ ...current, [side]: file }));
    setPreviews((current) => ({ ...current, [side]: URL.createObjectURL(file) }));
  }

  async function uploadIdentity(side: Side) {
    const file = files[side];
    if (!file) return profile.identityDocumentsUploaded[side];
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/providers/me/identity/${side}`, { method: "POST", headers: { "Content-Type": file.type, ...(token() ? { Authorization: `Bearer ${token()}` } : {}) }, body: file });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر رفع الصورة");
      setProfile((current) => ({ ...current, identityDocumentsUploaded: { ...current.identityDocumentsUploaded, [side]: true } }));
      toast({ title: side === "front" ? "تم رفع الوجه الأمامي" : "تم رفع الوجه الخلفي", description: "تم حفظ الوثيقة بشكل خاص ولن تظهر للعملاء." });
      return true;
    } catch (error) { toast({ title: "تعذر رفع الوثيقة", description: error instanceof Error ? error.message : "حاول مرة أخرى", variant: "destructive" }); return false; }
    finally { setSaving(false); }
  }

  async function submitForReview() {
    const front = await uploadIdentity("front");
    const back = await uploadIdentity("back");
    if (!front || !back) { toast({ title: "أرفق وجهي البطاقة", description: "يجب رفع صورة واضحة من الأمام والخلف قبل الإرسال.", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await apiRequest("/providers/me/verification/submit", { method: "POST", body: JSON.stringify({}) });
      setProfile((current) => ({ ...current, verificationStatus: "submitted" }));
      setSubmitted(true);
    } catch (error) { toast({ title: "تعذر إرسال الملف", description: error instanceof Error ? error.message : "أكمل البيانات وحاول مرة أخرى", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex min-h-[100dvh] items-center justify-center text-sm text-muted-foreground" dir="rtl">جاري تحميل ملفك المهني...</div>;
  if (submitted || profile.verificationStatus === "submitted") return <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background p-8 text-center" dir="rtl"><div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100"><CheckCircle className="h-12 w-12 text-green-600" /></div><h2 className="mb-3 text-2xl font-black">تم إرسال ملفك للمراجعة</h2><p className="mb-2 text-muted-foreground">راجع فريق فزعة بياناتك ووثائقك بشكل خاص.</p><p className="mb-8 rounded-xl bg-muted p-3 text-sm text-muted-foreground">تظهر علامة التوثيق بعد اعتماد الملف.</p><Button onClick={() => navigate("/provider-dashboard")} className="h-14 w-full max-w-sm rounded-2xl font-bold">العودة إلى لوحة المهني</Button></div>;

  const stepTitle = step === 1 ? "أكمل ملفك المهني" : step === 2 ? "ارفع الوجه الأمامي" : "ارفع الوجه الخلفي";
  const stepDescription = step === 1 ? "كلما كان الملف واضحاً اكتسبت ثقة العملاء أسرع." : step === 2 ? "صورة واضحة للوجه الأمامي من البطاقة الشخصية." : "صورة واضحة للوجه الخلفي من البطاقة الشخصية.";
  const side: Side = step === 2 ? "front" : "back";

  return <main className="min-h-[100dvh] bg-background pb-10" dir="rtl"><header className="border-b border-border bg-background/90 px-4 py-4"><div className="mx-auto flex max-w-xl items-center gap-3"><button onClick={() => step === 1 ? navigate("/profile") : setStep(step - 1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-muted" aria-label="رجوع"><ArrowRight className="h-5 w-5" /></button><div><p className="text-xs font-bold text-muted-foreground">إكمال ملف المهني</p><h1 className="text-xl font-black">توثيق الحساب</h1></div><span className="mr-auto rounded-full bg-muted px-3 py-1 text-xs font-bold">{step} / ٣</span></div></header>
    <div className="mx-auto max-w-xl px-4 pt-6"><div className="mb-6 flex items-center justify-center gap-2">{[1, 2, 3].map((item) => <div key={item} className={`h-2 flex-1 rounded-full ${step >= item ? "bg-primary" : "bg-muted"}`} />)}</div><motion.div key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="space-y-5"><div><p className="text-xs font-bold text-primary">التحقق الآمن</p><h2 className="mt-2 text-2xl font-black">{stepTitle}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{stepDescription}</p></div>
      {step === 1 && <section className="space-y-4 rounded-3xl border border-border bg-card p-5"><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm font-bold">اسم الملف<Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="مثال: مؤسسة النخبة" /></label><label className="space-y-2 text-sm font-bold">مجال الخدمة<select value={profile.categoryId} onChange={(e) => setProfile({ ...profile, categoryId: Number(e.target.value) })} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm">{categories.map((item) => <option key={item.id} value={item.id}>{item.icon} {item.name}</option>)}</select></label><label className="space-y-2 text-sm font-bold">المدينة<Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} placeholder="صنعاء" /></label><label className="space-y-2 text-sm font-bold">الحي / المنطقة<Input value={profile.district} onChange={(e) => setProfile({ ...profile, district: e.target.value })} placeholder="حدة" /></label><label className="space-y-2 text-sm font-bold sm:col-span-2">سنوات الخبرة<Input type="number" min="0" max="60" value={profile.yearsExperience} onChange={(e) => setProfile({ ...profile, yearsExperience: Number(e.target.value) })} /></label></div><label className="block space-y-2 text-sm font-bold">نبذة عن خدمتك<Textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="اكتب خبرتك والخدمات التي تقدمها للعملاء..." className="min-h-32" /></label><div className="rounded-2xl bg-primary/5 p-4 text-xs leading-6 text-muted-foreground"><UserRound className="mb-2 h-5 w-5 text-primary" />سيظهر هذا الجزء للعملاء، لذلك لا تضع رقم الهوية أو أي بيانات حساسة هنا.</div><Button onClick={async () => { if (await saveProfile()) setStep(2); }} disabled={saving} className="h-12 w-full rounded-xl font-bold"><Save className="ml-2 h-4 w-4" />{saving ? "جاري الحفظ..." : "حفظ والانتقال للهوية"}</Button></section>}
      {(step === 2 || step === 3) && <section className="space-y-4 rounded-3xl border border-border bg-card p-5"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800"><ShieldCheck className="mb-2 h-5 w-5" /><b>خصوصية وأمان:</b> صور الهوية تحفظ في مساحة خاصة ولا تُرسل أو تُعرض للعملاء. تستخدم فقط لمراجعة الحساب عند حدوث نزاع أو بلاغ.</div><label className={`flex min-h-64 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed ${previews[side] || profile.identityDocumentsUploaded[side] ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => chooseFile(side, e.target.files?.[0])} />{previews[side] ? <img src={previews[side]} alt="معاينة وثيقة الهوية" className="max-h-44 max-w-full rounded-xl object-contain" /> : profile.identityDocumentsUploaded[side] ? <><FileCheck2 className="h-14 w-14 text-green-600" /><p className="font-bold text-green-700">تم رفع هذه الوثيقة مسبقاً</p></> : <><IdCard className="h-14 w-14 text-muted-foreground" /><p className="font-bold">اضغط لاختيار صورة البطاقة</p><p className="text-xs text-muted-foreground">JPG أو PNG أو WEBP — حتى 8 ميجابايت</p></>}</label><p className="text-center text-xs text-muted-foreground">{side === "front" ? "الوجه الأمامي: الاسم والصورة والبيانات الأساسية" : "الوجه الخلفي: العنوان أو العلامات الأمنية"}</p><div className="flex gap-3"><Button variant="outline" onClick={() => setStep(step - 1)} className="h-12 flex-1 rounded-xl">رجوع</Button><Button onClick={async () => { if (step === 2) { if (await uploadIdentity("front")) setStep(3); } else await submitForReview(); }} disabled={saving || (!files[side] && !profile.identityDocumentsUploaded[side])} className="h-12 flex-1 rounded-xl font-bold">{saving ? "جاري الحفظ..." : step === 2 ? <><Upload className="ml-2 h-4 w-4" />حفظ والانتقال للخلف</> : <><Send className="ml-2 h-4 w-4" />إرسال للمراجعة</>}</Button></div></section>}
    </motion.div></div></main>;
}
