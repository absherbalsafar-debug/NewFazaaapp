import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Phone, ArrowRight, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CitySelector } from "@/components/city-selector";
import { useAuth, apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type Step = "phone" | "otp" | "name";

export default function AuthPhone() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"client" | "provider">(
    new URLSearchParams(window.location.search).get("role") === "provider" ? "provider" : "client",
  );
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

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
      setStep("otp");
      toast({ title: "تم الإرسال", description: "تم إرسال رمز التحقق" });
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
        navigate('/');
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
    setLoading(true);
    try {
      const data = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim(), code: otp, name: name.trim(), role, city }),
      });
      login(data.token, data.user);
      navigate(role === 'provider' ? '/complete-provider' : '/');
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
        <button onClick={() => step === 'phone' ? navigate('/welcome') : setStep(step === 'otp' ? 'phone' : 'otp')} className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80">
          <ArrowRight className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">
          {step === 'phone' ? 'أدخل رقم هاتفك' : step === 'otp' ? 'أدخل رمز التحقق' : 'أكمل بياناتك'}
        </h1>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-12 max-w-sm mx-auto w-full">
        <motion.div
          key={step}
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {step === 'phone' && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-6">
                  سنرسل رمز تحقق إلى رقم هاتفك للتأكيد
                </p>
                <Input
                  type="tel"
                  placeholder="7XXXXXXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="h-14 text-lg text-center rounded-2xl"
                  dir="ltr"
                  onKeyDown={e => e.key === 'Enter' && sendOtp()}
                />
              </div>
              <Button onClick={sendOtp} disabled={loading} className="w-full h-14 rounded-2xl text-lg font-bold">
                {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
              </Button>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-2">
                  أدخل الرمز المرسل إلى <span className="font-bold text-foreground" dir="ltr">{phone}</span>
                </p>
                {devOtp && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4">
                    رمز التطوير: <span className="font-mono font-bold">{devOtp}</span>
                  </p>
                )}
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="h-14 text-2xl text-center tracking-[0.5em] rounded-2xl font-mono"
                  dir="ltr"
                />
              </div>
              <Button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="w-full h-14 rounded-2xl text-lg font-bold">
                {loading ? 'جاري التحقق...' : 'تأكيد'}
              </Button>
              <button onClick={sendOtp} className="w-full text-primary text-sm font-medium text-center">
                إعادة إرسال الرمز
              </button>
            </>
          )}

          {step === 'name' && (
            <>
              <div>
                <p className="text-muted-foreground text-sm mb-6">
                  أنت عضو جديد! أكمل بياناتك لإنشاء حسابك
                </p>
                <div className="space-y-4">
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
                      className={`h-12 rounded-xl border-2 font-semibold transition-colors ${role === 'client' ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}
                    >
                      عميل
                    </button>
                    <button
                      onClick={() => setRole('provider')}
                      className={`h-12 rounded-xl border-2 font-semibold transition-colors ${role === 'provider' ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}
                    >
                      مقدم خدمة
                    </button>
                  </div>
                </div>
              </div>
              <Button onClick={completeRegistration} disabled={loading || !name.trim()} className="w-full h-14 rounded-2xl text-lg font-bold">
                {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
