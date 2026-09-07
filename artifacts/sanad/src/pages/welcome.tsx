import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  Code2,
  Construction,
  Droplets,
  Mail,
  MapPin,
  PaintRoller,
  Phone,
  ShieldCheck,
  Snowflake,
  Sparkles,
  UserRound,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useAuth, apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { buildGoogleAuthPayload, getPostAuthPath, type RegistrationRole } from "@/lib/registration";
import { BrandLogo } from "@/components/brand-logo";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function GoogleButton({ role }: { role: RegistrationRole }) {
  const { login } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) return;
    try {
      const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      const data = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify(buildGoogleAuthPayload(payload, role)),
      });
      login(data.token, data.user);
      navigate(getPostAuthPath(data.user.role === "provider" ? "provider" : "client"));
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    }
  }

  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        className="w-full flex items-center justify-center gap-3 h-13 rounded-2xl border border-[#d9d5cd] bg-white hover:bg-[#faf9f6] transition-colors text-[#162a2a] font-bold text-sm shadow-[0_8px_24px_rgba(22,42,42,0.05)]"
        onClick={() => window.alert('يرجى تكوين VITE_GOOGLE_CLIENT_ID لتفعيل تسجيل الدخول بجوجل')}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        المتابعة باستخدام جوجل
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl [&>div]:w-full">
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => {}}
          size="large"
          width="100%"
          text="continue_with"
          shape="rectangular"
        />
      </GoogleOAuthProvider>
    </div>
  );
}

type Step = 'intro' | 'start';
type Role = 'client' | 'provider';

const roleCopy = {
  client: {
    title: "أبحث عن خدمة",
    description: "أصل إلى الشخص المناسب بثقة",
    icon: UserRound,
    detail: "اطلب، تابع، وقيّم تجربتك من مكان واحد",
  },
  provider: {
    title: "أقدّم خدمة",
    description: "أحوّل خبرتي إلى فرص حقيقية",
    icon: BriefcaseBusiness,
    detail: "اعرض مهارتك واستقبل طلبات من حولك",
  },
} as const;

export default function Welcome() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>('intro');
  const [selectedRole, setSelectedRole] = useState<Role>('client');

  const getAuthPath = (type: 'phone' | 'email') => (
    `${type === 'phone' ? '/auth/phone' : '/auth/email'}?role=${selectedRole}`
  );

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#f7f8fa] text-primary" dir="rtl">
      <AnimatePresence mode="wait">
        {step === 'intro' ? (
          <motion.section
            key="intro"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 28 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-h-[100dvh] overflow-hidden bg-[#f7f8fa]"
          >
            <div className="absolute inset-x-0 bottom-0 h-[28%] bg-primary" />
            <div className="absolute -bottom-20 left-1/2 h-56 w-[130%] -translate-x-1/2 rounded-[50%] bg-primary" />

            <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-5 pt-6 sm:max-w-lg sm:px-9">
              <header className="flex justify-center">
                <BrandLogo className="h-[142px] w-[176px] object-contain" />
              </header>

              <div className="flex flex-1 flex-col items-center pt-1 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.65 }}
                  className="mt-1 inline-flex w-fit items-center gap-2 rounded-full border border-[#e4c778]/30 bg-[#e4c778]/10 px-3.5 py-2 text-[11px] font-bold text-[#a17b29]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>خدمة تستحق الثقة</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.7 }}
                  className="mt-4 max-w-[19rem] text-[31px] font-black leading-[1.25] tracking-[-0.04em] text-primary sm:text-[40px]"
                >
                  أهلاً وسهلاً بك في
                  <span className="relative mx-auto block w-fit text-[#b08625] after:absolute after:-bottom-1 after:right-0 after:h-1 after:w-20 after:rounded-full after:bg-[#e4c778]">فزعة</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.65 }}
                  className="mt-3 max-w-[20rem] text-[14px] leading-7 text-[#637087]"
                >
                  منصة توصلك بأفضل المهنيين والفنيين لإنجاز احتياجاتك بسهولة وسرعة.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.38, duration: 0.7 }}
                  className="relative mt-5 h-[340px] w-full overflow-hidden rounded-[34px] border border-white/70 bg-white shadow-[0_18px_50px_rgba(14,47,98,0.14)]"
                >
                  <img src="/assets/fazaah-worker-hero.png" alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
                  <div className="absolute inset-0 bg-gradient-to-b from-card/90 via-transparent to-primary/15" />
                  <div className="absolute right-5 top-7 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-primary shadow-md">
                    <Zap className="h-5 w-5 text-[#e4c778]" />
                  </div>
                  <div className="absolute left-5 top-12 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-primary shadow-md">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div className="absolute left-1/2 top-4 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-md">
                    <Construction className="h-5 w-5 text-[#b08625]" />
                  </div>
                  <div className="absolute right-3 top-28 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-primary shadow-md">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <div className="absolute left-3 top-28 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-primary shadow-md">
                    <Snowflake className="h-5 w-5" />
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="relative z-10 mt-4 w-full"
              >
                <button
                  type="button"
                  onClick={() => setStep('start')}
                  className="group flex h-14 w-full items-center justify-between rounded-2xl bg-[#f5ba20] px-5 text-right text-[15px] font-extrabold text-primary shadow-[0_14px_28px_rgba(228,199,120,0.25)] transition-transform hover:bg-[#ffca3a] active:scale-[0.98]"
                >
                  <span>لنبدأ</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:-translate-x-1">
                    <ChevronLeft className="h-5 w-5" />
                  </span>
                </button>
                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-medium text-white/65">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#d9b765]" />
                  <span>تجربة آمنة ومصممة لك</span>
                </div>
                <button type="button" onClick={() => setStep('start')} className="mt-3 block w-full text-center text-[11px] font-semibold text-white/55 hover:text-white">تخطي</button>
              </motion.div>
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="start"
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-[100dvh] bg-[#f7f8fa]"
          >
            <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-7 pt-7 sm:max-w-lg sm:px-9">
              <header className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('intro')}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ddd8ce] bg-white text-primary transition-colors hover:bg-[#ebe8e0]"
                  aria-label="العودة للشاشة السابقة"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-7 rounded-full bg-[#162a2a]" />
                  <span className="h-1.5 w-7 rounded-full bg-[#d9b765]" />
                  <span className="text-[10px] font-bold text-[#8e8b82]">٠٢ / ٠٢</span>
                </div>
              </header>

              <div className="flex flex-1 flex-col pt-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.55 }}
                >
                  <BrandLogo className="mb-2 h-20 w-28 object-contain object-right" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a17b29]">مرحباً بك في فزعة</p>
                  <h2 className="mt-3 text-[34px] font-black leading-[1.2] tracking-[-0.04em] text-primary">
                    اختر تجربتك،
                    <span className="block text-[#a17b29]">ونبدأ معاً.</span>
                  </h2>
                  <p className="mt-4 max-w-[19rem] text-sm leading-7 text-[#77766f]">
                    أخبرنا كيف ستستخدم فزعة لنجهز لك رحلة تناسب احتياجك من أول خطوة.
                  </p>
                </motion.div>

                <div className="mt-8 space-y-3">
                  {(Object.entries(roleCopy) as [Role, typeof roleCopy[Role]][]).map(([role, item], index) => {
                    const Icon = item.icon;
                    const isSelected = selectedRole === role;
                    return (
                      <motion.button
                        key={role}
                        type="button"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.08, duration: 0.5 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => setSelectedRole(role)}
                        className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-[24px] border p-4 text-right transition-all duration-300 ${
                          isSelected
                            ? "border-primary bg-primary text-white shadow-[0_16px_32px_rgba(14,47,98,0.16)]"
                            : "border-[#dedad1] bg-white text-primary hover:border-[#c9b77c]"
                        }`}
                      >
                        {isSelected && <div className="absolute -left-6 -top-10 h-24 w-24 rounded-full bg-[#d9b765]/20 blur-xl" />}
                        <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                          isSelected ? "bg-[#e4c778] text-primary" : "bg-[#f1eee7] text-[#a17b29]"
                        }`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="relative min-w-0 flex-1">
                          <p className="text-[15px] font-extrabold">{item.title}</p>
                          <p className={`mt-1 text-xs ${isSelected ? "text-white/60" : "text-[#8a887f]"}`}>{item.description}</p>
                          <p className={`mt-2 text-[10px] font-medium ${isSelected ? "text-[#e4c778]" : "text-[#aaa69b]"}`}>{item.detail}</p>
                        </div>
                        <div className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          isSelected ? "border-[#e4c778] bg-[#e4c778] text-[#162a2a]" : "border-[#d4d0c6] text-transparent"
                        }`}>
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="mt-auto pt-8"
                >
                  <p className="mb-3 text-center text-[11px] font-semibold text-[#9a978e]">ابدأ بطريقتك المفضلة</p>
                  <motion.div whileTap={{ scale: 0.985 }}>
                    <Button
                      className="h-14 w-full rounded-2xl bg-primary text-[15px] font-extrabold text-white shadow-[0_14px_28px_rgba(14,47,98,0.16)] hover:bg-primary/90"
                      onClick={() => navigate(getAuthPath('phone'))}
                    >
                      <Phone className="ml-2 h-5 w-5 text-[#e4c778]" />
                      التسجيل برقم الهاتف
                    </Button>
                  </motion.div>
                  <div className="my-3 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#dedad1]" />
                    <span className="text-[10px] font-bold text-[#aaa69b]">أو</span>
                    <div className="h-px flex-1 bg-[#dedad1]" />
                  </div>
                  <GoogleButton role={selectedRole} />
                  <motion.div whileTap={{ scale: 0.985 }} className="mt-3">
                    <Button
                      variant="outline"
                      className="h-12 w-full rounded-2xl border-[#d9d5cd] bg-transparent text-sm font-bold text-[#3a4a48] hover:bg-white"
                      onClick={() => navigate(getAuthPath('email'))}
                    >
                      <Mail className="ml-2 h-4 w-4 text-[#a17b29]" />
                      التسجيل بالبريد الإلكتروني
                    </Button>
                  </motion.div>
                  <button
                    type="button"
                    onClick={() => navigate('/auth/email')}
                    className="mt-5 block w-full text-center text-xs text-[#8b897f] transition-colors hover:text-primary"
                  >
                    لديك حساب بالفعل؟ <span className="font-extrabold text-[#a17b29]">تسجيل الدخول</span>
                  </button>
                  <p className="mt-4 text-center text-[10px] leading-5 text-[#aaa69b]">
                    بالمتابعة توافق على شروط الاستخدام وسياسة الخصوصية
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}