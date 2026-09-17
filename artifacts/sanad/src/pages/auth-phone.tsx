import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, ChevronDown, FileText, Loader2, MapPin, Phone, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CitySelector } from "@/components/city-selector";
import { useAuth, apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { getPostAuthPath, getRegistrationRole, type RegistrationRole } from "@/lib/registration";

type Step = "phone" | "otp" | "name";
type Category = { id: number; name: string; icon?: string | null };

const roleLabels: Record<RegistrationRole, { title: string; description: string }> = {
  client: { title: "أبحث عن خدمة", description: "ستظهر لك أفضل الخدمات والمهنيين" },
  provider: { title: "أقدّم خدمة", description: "ستستقبل طلبات العملاء وتدير عملك" },
};

export default function AuthPhone() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const role = getRegistrationRole(window.location.search);
  const selectedRole = roleLabels[role];
  const RoleIcon = role === "provider" ? BriefcaseBusiness : UserRound;

  useEffect(() => {
    if (role !== "provider" || step !== "name") return;
    let active = true;
    setCategoriesLoading(true);
    apiRequest("/categories")
      .then((data) => {
        if (active) setCategories(Array.isArray(data) ? data : []);
      })
      .catch((err: any) => {
        if (active) toast({ title: "تعذر تحميل مجالات الخدمة", description: err.message, variant: "destructive" });
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [role, step, toast]);

  async function sendOtp() {
    if (phone.trim().length < 7) {
      toast({ title: "خطأ", description: "أدخل رقم هاتف صحيح", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim() }),
      });
      if (data.otp) setDevOtp(data.otp);
      setOtpSent(true);
      toast({ title: "تم الإرسال", description: "تم إرسال رمز التحقق إلى هاتفك" });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (otp.length !== 6) {
      toast({ title: "خطأ", description: "أدخل الرمز المكون من 6 أرقام", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim(), code: otp }),
      });
      if (data.needsRegistration) {
        setStep("name");
      } else {
        login(data.token, data.user);
        navigate(getPostAuthPath(data.user.role === "provider" ? "provider" : "client"));
      }
    } catch (err: any) {
      toast({ title: "رمز خاطئ", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function completeRegistration() {
    if (!name.trim()) {
      toast({ title: "خطأ", description: "أدخل اسمك الكامل", variant: "destructive" });
      return;
    }
    if (role === "provider" && !categoryId) {
      toast({ title: "حدد مجال خدمتك", description: "اختر المجال الذي ستقدم خدماته للعملاء", variant: "destructive" });
      return;
    }
    if (role === "provider" && bio.trim().length < 10) {
      toast({ title: "اكتب نبذة عن خدمتك", description: "أضف وصفاً مختصراً لا يقل عن 10 أحرف", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          phone: phone.trim(),
          code: otp,
          name: name.trim(),
          role,
          city: city || undefined,
          categoryId: categoryId ? Number(categoryId) : undefined,
          bio: bio.trim() || undefined,
          yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
        }),
      });
      login(data.token, data.user);
      navigate(getPostAuthPath(role));
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const stepNumber = step === "phone" ? "٠١" : step === "otp" ? "٠٢" : "٠٣";
  const stepTitle = step === "phone" ? "أدخل رقم هاتفك" : step === "otp" ? "تحقق من هاتفك" : "خطوة أخيرة";

  return (
    <main className="min-h-[100dvh] bg-[#f5f3ee] text-primary" dir="rtl">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-y-auto px-5 pb-8 pt-6 sm:max-w-lg sm:px-9">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => step === "phone" ? navigate("/welcome") : setStep(step === "otp" ? "phone" : "otp")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ddd8ce] bg-white text-primary transition-colors hover:bg-[#ebe8e0]"
            aria-label="رجوع"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-primary shadow-sm">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="text-right leading-none">
              <p className="text-sm font-black">فزعة</p>
              <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.24em] text-[#a17b29]">FAZAAH</p>
            </div>
          </div>
          <span className="rounded-full border border-[#d9d5cd] bg-white px-3 py-1.5 text-[10px] font-bold text-[#8e8b82]">
            {stepNumber} <span className="mx-1 text-[#a17b29]">/</span> ٠٣
          </span>
        </header>

        <div className="flex flex-1 flex-col justify-center">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-7"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a17b29]">التحقق الآمن</p>
              <h1 className="mt-3 text-[32px] font-black leading-tight tracking-[-0.04em]">{stepTitle}</h1>
              <p className="mt-3 text-sm leading-7 text-[#77766f]">
                {step === "phone" && "سنرسل رمزاً قصيراً إلى رقمك لتبدأ تجربتك بأمان."}
                {step === "otp" && "أدخل الرمز الذي وصل إلى هاتفك لإكمال الدخول."}
                {step === "name" && (role === "provider"
                  ? "عرّف العملاء بخدمتك حتى تصل إليك الطلبات المناسبة."
                  : "تعرف عليك فزعة باسمك، وأكملنا لك حسابك في خطوة واحدة.")}
              </p>
            </div>

            {step === "phone" && (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-primary/10 text-primary shadow-[0_12px_28px_rgba(14,47,98,0.08)]">
                  <Phone className="h-9 w-9" />
                </div>
                <Input
                  type="tel"
                  placeholder="7XXXXXXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="h-14 rounded-2xl border-[#d4d9df] bg-white text-center text-lg font-semibold shadow-sm focus-visible:ring-primary"
                  dir="ltr"
                  disabled={loading}
                  onKeyDown={e => e.key === "Enter" && sendOtp()}
                />
                <Button onClick={sendOtp} disabled={loading} className="h-14 w-full rounded-2xl bg-primary text-base font-extrabold text-primary-foreground shadow-[0_12px_26px_rgba(14,47,98,0.16)] hover:bg-primary/90">
                  {loading ? <><Loader2 className="ml-2 h-5 w-5 animate-spin" /> جاري إرسال الرمز...</> : <>{otpSent ? "إعادة إرسال الرمز" : "إرسال رمز التحقق"}<ArrowLeft className="mr-2 h-4 w-4" /></>}
                </Button>
                {otpSent && (
                  <div className="space-y-4 rounded-[26px] border border-primary/10 bg-white p-4 shadow-[0_12px_28px_rgba(14,47,98,0.06)]">
                    <div>
                      <p className="mb-2 text-sm text-[#77766f]">أدخل رمز التأكيد هنا لإكمال الدخول</p>
                      {devOtp && (
                        <p className="mb-3 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-[#8a6925]">
                          رمز التأكيد: <span className="font-mono text-base font-bold tracking-widest">{devOtp}</span>
                        </p>
                      )}
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        maxLength={6}
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                        className="h-14 rounded-2xl border-[#d4d9df] bg-white text-center font-mono text-2xl tracking-[0.5em] shadow-sm focus-visible:ring-primary"
                        dir="ltr"
                        disabled={loading}
                        autoFocus
                        onKeyDown={e => e.key === "Enter" && verifyOtp()}
                      />
                    </div>
                    <Button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="h-14 w-full rounded-2xl bg-primary text-base font-extrabold text-primary-foreground shadow-[0_12px_26px_rgba(14,47,98,0.16)] hover:bg-primary/90">
                      {loading ? <><Loader2 className="ml-2 h-5 w-5 animate-spin" /> جاري التحقق...</> : <>تأكيد الدخول<Check className="mr-2 h-4 w-4" /></>}
                    </Button>
                    {loading && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-2 text-xs font-bold text-[#a17b29]"
                        role="status"
                        aria-live="polite"
                      >
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a17b29]" />
                        نتحقق من الرمز ونجهز حسابك...
                      </motion.div>
                    )}
                  </div>
                )}
              </>
            )}

            {step === "otp" && (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-accent/20 text-[#a17b29] shadow-[0_12px_28px_rgba(161,123,41,0.08)]">
                  <ShieldCheck className="h-9 w-9" />
                </div>
                <div>
                  <p className="mb-3 text-sm text-[#77766f]">
                    أرسلنا الرمز إلى <span className="font-bold text-primary" dir="ltr">{phone}</span>
                  </p>
                  {devOtp && (
                    <p className="mb-3 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-[#8a6925]">
                      رمز التطوير: <span className="font-mono font-bold">{devOtp}</span>
                    </p>
                  )}
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="h-14 rounded-2xl border-[#d4d9df] bg-white text-center font-mono text-2xl tracking-[0.5em] shadow-sm focus-visible:ring-primary"
                    dir="ltr"
                  />
                </div>
                <Button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="h-14 w-full rounded-2xl bg-primary text-base font-extrabold text-primary-foreground shadow-[0_12px_26px_rgba(14,47,98,0.16)] hover:bg-primary/90">
                  {loading ? "جاري التحقق..." : "تأكيد الرمز"}
                  <Check className="mr-2 h-4 w-4" />
                </Button>
                <button type="button" onClick={sendOtp} className="w-full text-center text-sm font-bold text-[#a17b29]">
                  إعادة إرسال الرمز
                </button>
              </>
            )}

            {step === "name" && (
              <>
                <div className="rounded-[26px] border border-primary/10 bg-primary p-4 text-white shadow-[0_16px_32px_rgba(14,47,98,0.14)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
                      <RoleIcon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-extrabold">{selectedRole.title}</p>
                      <p className="mt-1 text-xs text-white/65">{selectedRole.description}</p>
                    </div>
                    <Check className="h-5 w-5 text-accent" />
                  </div>
                  <p className="mt-3 border-t border-white/10 pt-3 text-[10px] font-medium text-white/55">
                    تم حفظ اختيارك ولن نطلب منك تحديده مرة أخرى.
                  </p>
                </div>
                <Input
                  placeholder="الاسم الكامل"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="h-14 rounded-2xl border-[#d4d9df] bg-white text-base shadow-sm focus-visible:ring-primary"
                  autoFocus
                />
                {role === "provider" && (
                  <div className="space-y-4 rounded-[26px] border border-primary/10 bg-white p-4 shadow-[0_12px_28px_rgba(14,47,98,0.06)]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 text-[#a17b29]">
                        <BriefcaseBusiness className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-primary">ما الخدمة التي تقدمها؟</p>
                        <p className="mt-0.5 text-[10px] text-[#8b897f]">هذه المعلومات تظهر للعملاء عند تصفح المهنيين</p>
                      </div>
                    </div>
                    <div className="relative">
                      <select
                        value={categoryId}
                        onChange={(event) => setCategoryId(event.target.value)}
                        disabled={categoriesLoading}
                        className="h-14 w-full appearance-none rounded-2xl border border-[#d4d9df] bg-[#fbfaf7] px-4 pl-10 text-sm font-bold text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                      >
                        <option value="">{categoriesLoading ? "جاري تحميل مجالات الخدمة..." : "اختر مجال خدمتك"}</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.icon ? `${category.icon} ` : ""}{category.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e8b82]" />
                    </div>
                    <div className="relative">
                      <FileText className="pointer-events-none absolute right-4 top-4 h-4 w-4 text-[#a17b29]" />
                      <Textarea
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        placeholder="مثال: أقدم خدمات السباكة المنزلية وإصلاح التسربات وتركيب الأدوات الصحية..."
                        className="min-h-[96px] resize-none rounded-2xl border-[#d4d9df] bg-[#fbfaf7] pr-11 pt-3 text-sm leading-6 shadow-none focus-visible:ring-primary"
                        maxLength={240}
                      />
                      <span className="mt-1 block text-left text-[10px] text-[#aaa69b]">{bio.length}/240</span>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={60}
                      inputMode="numeric"
                      placeholder="سنوات الخبرة (اختياري)"
                      value={yearsExperience}
                      onChange={(event) => setYearsExperience(event.target.value)}
                      className="h-14 rounded-2xl border-[#d4d9df] bg-[#fbfaf7] text-sm shadow-none focus-visible:ring-primary"
                    />
                  </div>
                )}
                <div className="relative">
                  <MapPin className="absolute right-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#a17b29]" />
                  <CitySelector value={city} onChange={setCity} placeholder="المدينة (اختياري)" />
                </div>
                <Button onClick={completeRegistration} disabled={loading || !name.trim()} className="h-14 w-full rounded-2xl bg-primary text-base font-extrabold text-primary-foreground shadow-[0_12px_26px_rgba(14,47,98,0.16)] hover:bg-primary/90">
                  {loading ? "جاري إنشاء الحساب..." : "أكمل إلى فزعة"}
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Button>
              </>
            )}
          </motion.div>
        </div>

        <p className="text-center text-[10px] leading-5 text-[#aaa69b]">
          بياناتك محمية، وبالاستمرار توافق على شروط الاستخدام وسياسة الخصوصية
        </p>
      </div>
    </main>
  );
}
