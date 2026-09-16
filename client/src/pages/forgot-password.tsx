import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  async function handleSubmit() {
    if (!email.trim()) {
      toast({ title: "خطأ", description: "أدخل بريدك الإلكتروني", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      if (data.resetToken) setDevToken(data.resetToken);
      setSent(true);
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col" dir="rtl">
      <div className="flex items-center gap-4 p-4 pt-safe">
        <button onClick={() => navigate('/auth/email')} className="w-10 h-10 flex items-center justify-center rounded-full bg-muted">
          <ArrowRight className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">استعادة كلمة المرور</h1>
      </div>
      <div className="flex-1 flex flex-col justify-center px-6 pb-12 max-w-sm mx-auto w-full">
        {sent ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">تم الإرسال!</h2>
            <p className="text-muted-foreground text-sm">إذا كان البريد مسجلاً ستصلك رسالة لإعادة تعيين كلمة المرور</p>
            {devToken && (
              <div className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3 text-start">
                <p className="font-bold mb-1">رمز التطوير:</p>
                <p className="font-mono break-all">{devToken}</p>
              </div>
            )}
            <Button onClick={() => navigate('/auth/email')} className="w-full h-12 rounded-2xl mt-4">
              العودة لتسجيل الدخول
            </Button>
          </motion.div>
        ) : (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">نسيت كلمة المرور؟</h2>
              <p className="text-muted-foreground text-sm">أدخل بريدك الإلكتروني وسنرسل لك رابط الاستعادة</p>
            </div>
            <Input
              type="email"
              placeholder="بريدك الإلكتروني"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-12 rounded-xl"
              dir="ltr"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <Button onClick={handleSubmit} disabled={loading} className="w-full h-14 rounded-2xl text-lg font-bold">
              {loading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
