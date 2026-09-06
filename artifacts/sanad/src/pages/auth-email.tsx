import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Eye, EyeOff, ArrowRight, Lock } from "lucide-react";
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
  const [role, setRole] = useState<"client" | "provider">(
    new URLSearchParams(window.location.search).get("role") === "provider" ? "provider" : "client",
  );
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

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
    <div className="min-h-[100dvh] bg-background flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 pt-safe">
        <button onClick={() => navigate('/welcome')} className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80">
          <ArrowRight className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">
          {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
        </h1>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-12 max-w-sm mx-auto w-full">
        {/* Mode toggle */}
        <div className="flex bg-muted rounded-2xl p-1 mb-8">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 h-10 rounded-xl font-semibold text-sm transition-colors ${mode === 'login' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 h-10 rounded-xl font-semibold text-sm transition-colors ${mode === 'register' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
          >
            حساب جديد
          </button>
        </div>

        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 text-primary" />
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
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRole('client')}
                  className={`h-12 rounded-xl border-2 font-semibold text-sm transition-colors ${role === 'client' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground'}`}
                >
                  عميل
                </button>
                <button
                  onClick={() => setRole('provider')}
                  className={`h-12 rounded-xl border-2 font-semibold text-sm transition-colors ${role === 'provider' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground'}`}
                >
                  مقدم خدمة
                </button>
              </div>
            </>
          )}

          <Input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="h-12 rounded-xl"
            dir="ltr"
          />

          <div className="relative">
            <Input
              type={showPwd ? "text" : "password"}
              placeholder="كلمة المرور"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="h-12 rounded-xl pl-12"
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
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-14 rounded-2xl text-lg font-bold mt-2"
          >
            {loading ? 'جاري المعالجة...' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
