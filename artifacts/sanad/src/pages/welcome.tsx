import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Phone, Mail, ChevronLeft, Briefcase, User, Star, Shield, Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useAuth, apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function GoogleButton() {
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
        className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl border border-border bg-white hover:bg-gray-50 transition-colors text-foreground font-medium text-sm shadow-sm"
        onClick={() => window.alert('يرجى تكوين VITE_GOOGLE_CLIENT_ID لتفعيل تسجيل الدخول بجوجل')}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        المتابعة باستخدام جوجل
      </button>
    );
  }

  return (
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
  );
}

type Step = 'role' | 'auth';
type Role = 'client' | 'provider';

export default function Welcome() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>('role');
  const [selectedRole, setSelectedRole] = useState<Role>('client');

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setStep('auth');
  };

  const getAuthPath = (type: 'phone' | 'email') => {
    return `${type === 'phone' ? '/auth/phone' : '/auth/email'}?role=${selectedRole}`;
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col" dir="rtl">
      <AnimatePresence mode="wait">
        {step === 'role' ? (
          <motion.div
            key="role"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {/* Header gradient */}
            <div className="gradient-primary pt-16 pb-24 px-6 relative overflow-hidden">
              <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5" />
              <div className="absolute -top-8 right-4 w-32 h-32 rounded-full bg-white/5" />
              <div className="absolute top-16 right-8 w-16 h-16 rounded-full bg-accent/20" />
              <div className="relative z-10 max-w-sm mx-auto">
                {/* Logo */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="w-16 h-16 gradient-gold rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                >
                  <Shield className="w-8 h-8 text-white" />
                </motion.div>
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-extrabold text-white mb-2"
                >
                  سند
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/75 text-base leading-relaxed"
                >
                  منصة الخدمات المهنية الموثوقة في اليمن
                </motion.p>

                {/* Trust indicators */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-4 mt-5"
                >
                  {[
                    { icon: Star, text: "٤.٨+ تقييم" },
                    { icon: Shield, text: "مهنيون موثقون" },
                    { icon: Zap, text: "استجابة فورية" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-1.5">
                      <item.icon className="w-3.5 h-3.5 text-accent" />
                      <span className="text-white/70 text-xs font-medium">{item.text}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Role selection cards */}
            <div className="flex-1 px-5 pt-8 pb-12 max-w-sm mx-auto w-full space-y-4">
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center font-bold text-lg text-foreground"
              >
                كيف تريد استخدام سند؟
              </motion.p>

              {/* Client card */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect('client')}
                className="w-full bg-white rounded-3xl p-5 border-2 border-border hover:border-primary/40 hover:shadow-lg transition-all duration-200 text-right group card-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/12 transition-colors">
                    <User className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base text-foreground">أريد طلب خدمة</p>
                    <p className="text-muted-foreground text-sm mt-0.5">ابحث عن المهنيين واحجز خدماتهم</p>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 pr-[4.5rem]">
                  {["🔧 سباكة", "⚡ كهرباء", "🏠 نظافة", "❄️ تكييف"].map(s => (
                    <span key={s} className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              </motion.button>

              {/* Provider card */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect('provider')}
                className="w-full bg-white rounded-3xl p-5 border-2 border-border hover:border-accent/60 hover:shadow-lg transition-all duration-200 text-right group card-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
                    <Briefcase className="w-7 h-7 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base text-foreground">أريد العمل كمهني</p>
                    <p className="text-muted-foreground text-sm mt-0.5">قدّم خدماتك واكسب دخلاً إضافياً</p>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 pr-[4.5rem]">
                  {["💰 أرباح مرتفعة", "🏅 شارة توثيق", "📊 لوحة إحصائيات"].map(s => (
                    <span key={s} className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium border border-amber-100">{s}</span>
                  ))}
                </div>
              </motion.button>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-center text-xs text-muted-foreground pt-2"
              >
                يمكنك تغيير نوع حسابك لاحقاً من الإعدادات
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="auth"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {/* Header */}
            <div className="gradient-primary pt-12 pb-16 px-6 relative overflow-hidden">
              <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/5" />
              <div className="relative z-10 max-w-sm mx-auto">
                <button
                  onClick={() => setStep('role')}
                  className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  رجوع
                </button>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${selectedRole === 'provider' ? 'bg-accent/20 border border-accent/30' : 'bg-white/10 border border-white/20'}`}>
                  {selectedRole === 'provider'
                    ? <Briefcase className="w-7 h-7 text-accent" />
                    : <User className="w-7 h-7 text-white" />
                  }
                </div>
                <h2 className="text-2xl font-extrabold text-white mb-1">
                  {selectedRole === 'provider' ? 'انضم كمهني' : 'ابدأ الآن'}
                </h2>
                <p className="text-white/70 text-sm">
                  {selectedRole === 'provider'
                    ? 'سجّل حسابك وابدأ استقبال الطلبات'
                    : 'أنشئ حساباً وابحث عن أفضل المهنيين'}
                </p>
              </div>
            </div>

            <div className="flex-1 px-5 pt-8 pb-12 max-w-sm mx-auto w-full space-y-3">
              {/* Phone OTP */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  className="w-full h-13 rounded-2xl bg-primary text-white font-bold text-base flex items-center gap-3 shadow-sm hover:bg-primary/90"
                  onClick={() => navigate(getAuthPath('phone'))}
                >
                  <Phone className="w-5 h-5" />
                  التسجيل برقم الهاتف
                </Button>
              </motion.div>

              {/* Google */}
              <GoogleButton />

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">أو</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Email */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-2xl border-border font-medium text-sm flex items-center gap-3"
                  onClick={() => navigate(getAuthPath('email'))}
                >
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  التسجيل بالبريد الإلكتروني
                </Button>
              </motion.div>

              {/* Already have account */}
              <div className="pt-4 text-center">
                <button
                  onClick={() => navigate('/auth/email')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  لديك حساب بالفعل؟{" "}
                  <span className="text-primary font-bold">تسجيل الدخول</span>
                </button>
              </div>

              <p className="text-center text-[11px] text-muted-foreground/60 pt-2 leading-relaxed">
                بالمتابعة توافق على شروط الاستخدام وسياسة الخصوصية
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
