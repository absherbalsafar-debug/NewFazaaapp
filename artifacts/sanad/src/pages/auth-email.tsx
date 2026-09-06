import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Eye, EyeOff, ArrowRight, BriefcaseBusiness, Check, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CitySelector } from "@/components/city-selector";
import { useAuth, apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type Mode = "login" | "register";

export default function AuthEmail() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const role: "client" | "provider" = new URLSearchParams(window.location.search).get("role") === "provider" ? "provider" : "client";
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const RoleIcon = role === "provider" ? BriefcaseBusiness : UserRound;
  const roleTitle = role === "provider" ? "حساب مقدم خدمة" : "حساب عميل";
  const roleDescription = role === "provider" ? "استقبل الطلبات وأدر خدماتك" : "اكتشف المهنيين واطلب خدماتك";

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
        data = await apiRequest('/auth/register/email', {
          method: 'POST',
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role, city }),
        });
        if (data.emailVerifyToken) {
          toast({ title: "تحقق من بريدك", description: `رمز التفعيل: ${data.emailVerifyToken}` });
        }
      }
      login(data.token, data.user);
      navigate('/');
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
            onClick={handleSubmit}
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
