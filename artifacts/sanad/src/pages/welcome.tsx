import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowUpLeft,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useAuth, apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function GoogleButton({ role }: { role: "client" | "provider" }) {
  const { login } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) return;
    try {
      const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      const data = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          googleId: payload.sub,
          email: payload.email,
          name: payload.name,
          avatarUrl: payload.picture,
          role,
        }),
      });
      login(data.token, data.user);
      navigate('/');
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
    <main className="min-h-[100dvh] overflow-hidden bg-[#f5f3ee] text-primary" dir="rtl">
      <AnimatePresence mode="wait">
        {step === 'intro' ? (
          <motion.section
            key="intro"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 28 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-h-[100dvh] overflow-hidden bg-primary"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(202,164,74,0.22),transparent_28%),radial-gradient(circle_at_85%_70%,rgba(54,97,151,0.36),transparent_32%)]" />
            <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:42px_42px]" />
            <div className="absolute -left-28 top-36 h-72 w-72 rounded-full border border-[#d9b765]/20" />
            <div className="absolute -left-20 top-44 h-56 w-56 rounded-full border border-[#d9b765]/15" />

            <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-6 pb-7 pt-7 sm:max-w-lg sm:px-9">
              <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border border-[#e4c778]/50 bg-[#e4c778] text-primary shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
                    <ShieldCheck className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <div className="leading-none">
                    <p className="text-[17px] font-black tracking-tight text-white">فزعة</p>
                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#d9b765]">FAZAAH</p>
                  </div>
                </div>
                <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-semibold tracking-wide text-white/70">
                  ٠١ <span className="mx-1 text-[#d9b765]">/</span> ٠٢
                </span>
              </header>

              <div className="flex flex-1 flex-col justify-center py-9">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.65 }}
                  className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-[#d9b765]/25 bg-[#d9b765]/10 px-3.5 py-2 text-[11px] font-semibold text-[#f2d991]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>خدمة تستحق الثقة</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.7 }}
                  className="max-w-[16rem] text-[42px] font-black leading-[1.14] tracking-[-0.04em] text-white sm:text-[52px]"
                >
                  راحتك تبدأ
                  <span className="block text-[#e4c778]">بفزعة.</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.65 }}
                  className="mt-5 max-w-[19rem] text-[15px] leading-8 text-white/65"
                >
                  منصة يمنية تجمعك بالمهني المناسب، في الوقت المناسب، وبطريقة تشعرك بالاطمئنان.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.38, duration: 0.7 }}
                  className="relative mt-9 h-40 overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.07] shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
                >
                  <div className="absolute -left-7 -top-10 h-36 w-36 rounded-full bg-[#d9b765]/20 blur-2xl" />
                  <div className="absolute -bottom-14 right-5 h-36 w-36 rounded-full bg-[#7695be]/25 blur-2xl" />
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0b2348]/70 to-transparent" />
                  <div className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e4c778] text-primary shadow-[0_10px_28px_rgba(228,199,120,0.25)]">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div className="absolute right-[5.25rem] top-9 h-2 w-2 rounded-full bg-[#e4c778] shadow-[0_0_0_7px_rgba(228,199,120,0.12)]" />
                  <div className="absolute bottom-5 right-6 left-6 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-medium text-white/55">خدمات حولك</p>
                      <p className="mt-1 text-sm font-bold text-white">قريب منك، موثوق لك</p>
                    </div>
                    <ArrowUpLeft className="h-5 w-5 text-[#e4c778]" />
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <button
                  type="button"
                  onClick={() => setStep('start')}
                  className="group flex h-14 w-full items-center justify-between rounded-2xl bg-[#e4c778] px-5 text-right text-[15px] font-extrabold text-primary shadow-[0_14px_28px_rgba(228,199,120,0.2)] transition-transform hover:bg-[#f0d68e] active:scale-[0.98]"
                >
                  <span>اكتشف فزعة</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:-translate-x-1">
                    <ChevronLeft className="h-5 w-5" />
                  </span>
                </button>
                <div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-medium text-white/45">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#d9b765]" />
                  <span>تجربة آمنة ومصممة لك</span>
                </div>
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
            className="min-h-[100dvh] bg-[#f5f3ee]"
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

              <div className="flex flex-1 flex-col pt-11">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.55 }}
                >
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