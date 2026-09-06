import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Eye, EyeOff, ArrowRight, BriefcaseBusiness, Check, ChevronDown, FileText, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CitySelector } from "@/components/city-selector";
import { useAuth, apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { getPostAuthPath, getRegistrationRole } from "@/lib/registration";

type Mode = "login" | "register";
type Category = { id: number; name: string; icon?: string | null };

export default function AuthEmail() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const role = getRegistrationRole(window.location.search);
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const RoleIcon = role === "provider" ? BriefcaseBusiness : UserRound;
  const roleTitle = role === "provider" ? "حساب مقدم خدمة" : "حساب عميل";
  const roleDescription = role === "provider" ? "استقبل الطلبات وأدر خدماتك" : "اكتشف المهنيين واطلب خدماتك";

  useEffect(() => {
    if (mode !== "register" || role !== "provider") return;
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
  }, [mode, role, toast]);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      toast({ title: "خطأ", description: "أدخل البريد وكلمة المرور", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      let data;
      if (mode === "login") {
        data = await apiRequest('/auth/login/email', {
          method: 'POST',
          body: JSON.stringify({ email: email.trim(), password }),
        });
      } else {
        if (!name.trim()) {
          toast({ title: "خطأ", description: "أدخل اسمك الكامل", variant: "destructive" });
          setLoading(false);
          return;
        }
        if (role === "provider" && !categoryId) {
          toast({ title: "حدد مجال خدمتك", description: "اختر المجال الذي ستقدم خدماته للعملاء", variant: "destructive" });
          setLoading(false);
          return;
        }
        if (role === "provider" && bio.trim().length < 10) {
          toast({ title: "اكتب نبذة عن خدمتك", description: "أضف وصفاً مختصراً لا يقل عن 10 أحرف", variant: "destructive" });
          setLoading(false);
          return;
        }
        data = await apiRequest('/auth/register/email', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
            role,
            city: city || undefined,
            categoryId: categoryId ? Number(categoryId) : undefined,
            bio: bio.trim() || undefined,
            yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
          }),
        });
        if (data.emailVerifyToken) {
          toast({ title: "تحقق من بريدك", description: `رمز التفعيل: ${data.emailVerifyToken}` });
        }
      }
      login(data.token, data.user);
      navigate(getPostAuthPath(data.user.role === "provider" ? "provider" : "client"));
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#f5f3ee] text-primary" dir="rtl">
      {/* Header */}
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 pb-2 pt-6 sm:max-w-lg sm:px-9">
        <button onClick={() => navigate('/welcome')} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ddd8ce] bg-white hover:bg-[#ebe8e0]">
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
        <span className="w-10 text-center text-[10px] font-bold text-[#a17b29]">آمن</span>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-10 sm:max-w-lg sm:px-9">
        <h1 className="text-3xl font-black tracking-[-0.04em]">
          {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
        </h1>
        <p className="mt-3 text-sm leading-7 text-[#77766f]">
          {mode === 'login' ? 'أهلاً بعودتك، تابع رحلتك مع فزعة.' : 'أنشئ حسابك وابدأ تجربة خدمات أكثر سهولة.'}
        </p>
        {/* Mode toggle */}
        <div className="my-8 flex rounded-2xl border border-[#dedad1] bg-white/60 p-1">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 h-10 rounded-xl font-semibold text-sm transition-colors ${mode === 'login' ? 'bg-primary text-white shadow-sm' : 'text-[#8c897f]'}`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 h-10 rounded-xl font-semibold text-sm transition-colors ${mode === 'register' ? 'bg-primary text-white shadow-sm' : 'text-[#8c897f]'}`}
          >
            حساب جديد
          </button>
        </div>

        <motion.form
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="h-7 w-7" />
          </div>

          {mode === "register" && (
            <>
              <Input
                placeholder="الاسم الكامل"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-12 rounded-xl"
              />
              <CitySelector value={city} onChange={setCity} />
              <div className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-primary p-3.5 text-white shadow-[0_12px_24px_rgba(14,47,98,0.1)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
                  <RoleIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold">{roleTitle}</p>
                  <p className="mt-0.5 text-[10px] text-white/60">{roleDescription}</p>
                </div>
                <Check className="h-4 w-4 text-accent" />
              </div>
              {role === "provider" && (
                <div className="space-y-4 rounded-[26px] border border-primary/10 bg-white p-4 shadow-[0_12px_28px_rgba(14,47,98,0.06)]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20 text-[#a17b29]">
                      <BriefcaseBusiness className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-primary">ما الخدمة التي تقدمها؟</p>
                      <p className="mt-0.5 text-[10px] text-[#8b897f]">ستظهر هذه المعلومات للعملاء</p>
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
                      placeholder="مثال: أقدم خدمات السباكة المنزلية وإصلاح التسربات..."
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
            </>
          )}

          <Input
            type="email"
              autoComplete="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={e => setEmail(e.target.value)}
             className="h-13 rounded-2xl border-[#d4d9df] bg-white shadow-sm focus-visible:ring-primary"
            dir="ltr"
          />

          <div className="relative">
            <Input
              type={showPwd ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="كلمة المرور"
              value={password}
              onChange={e => setPassword(e.target.value)}
               className="h-13 rounded-2xl border-[#d4d9df] bg-white pl-12 shadow-sm focus-visible:ring-primary"
              dir="ltr"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {mode === "login" && (
            <button
              onClick={() => navigate('/auth/forgot-password')}
              className="text-primary text-sm font-medium w-full text-start"
            >
              نسيت كلمة المرور؟
            </button>
          )}

          <Button
            type="submit"
            disabled={loading}
             className="mt-2 h-14 w-full rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground shadow-[0_12px_26px_rgba(14,47,98,0.16)] hover:bg-primary/90"
          >
            {loading ? 'جاري المعالجة...' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
          </Button>
        </motion.form>
      </div>
      <p className="pb-6 text-center text-[10px] text-[#aaa69b]">فزعة FAZAAH · تجربة آمنة ومصممة لك</p>
    </main>
  );
}
