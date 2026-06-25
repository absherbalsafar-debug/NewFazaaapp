import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Upload, CheckCircle, Camera, Phone, IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { id: 1, label: "رقم الهاتف", icon: Phone, desc: "توثيق رقم هاتفك" },
  { id: 2, label: "صورة شخصية", icon: Camera, desc: "رفع صورة واضحة" },
  { id: 3, label: "هوية وطنية", icon: IdCard, desc: "صورة من الهوية" },
];

export default function ProviderVerify() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [selfieFile, setSelfieFile] = useState<string | null>(null);
  const [idFile, setIdFile] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFileInput = (setter: (v: string) => void) => {
    const el = document.createElement('input');
    el.type = 'file';
    el.accept = 'image/*';
    el.capture = 'environment';
    el.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) setter(URL.createObjectURL(file));
    };
    el.click();
  };

  function handleSubmit() {
    toast({ title: "تم استلام طلب التوثيق", description: "سيتم مراجعة بياناتك خلال 24 ساعة" });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-8 text-center" dir="rtl">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-3">تم إرسال الطلب!</h2>
          <p className="text-muted-foreground mb-2">سيتم مراجعة بياناتك من قِبل فريق سند</p>
          <p className="text-sm text-muted-foreground bg-muted rounded-xl p-3 mb-8">
            ⏱ مدة المراجعة: 24 - 48 ساعة عمل
          </p>
          <Button onClick={() => navigate('/profile')} className="w-full h-14 rounded-2xl font-bold">
            العودة للحساب
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button onClick={() => navigate('/profile')} className="w-10 h-10 flex items-center justify-center rounded-full bg-muted">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold">توثيق الحساب</h1>
          <p className="text-xs text-muted-foreground">احصل على علامة التوثيق الخضراء ✓</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 px-6 py-5">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${step > s.id ? 'bg-green-500 text-white' : step === s.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              {step > s.id ? "✓" : s.id}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-10 rounded ${step > s.id ? 'bg-green-500' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 px-6 pb-8 max-w-sm mx-auto w-full">
        <motion.div key={step} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-5">

          {step === 1 && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">توثيق رقم الهاتف</h2>
              <p className="text-muted-foreground text-sm">رقم هاتفك الحالي: <span className="font-bold text-foreground" dir="ltr">{user?.phone}</span></p>

              {user?.phoneVerified ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                  <div>
                    <p className="font-bold text-green-800 text-sm">رقم الهاتف موثق بالفعل ✓</p>
                    <p className="text-xs text-green-600">يمكنك الانتقال للخطوة التالية</p>
                  </div>
                </div>
              ) : (
                <Button onClick={() => navigate('/auth/phone')} variant="outline" className="w-full h-12 rounded-xl">
                  توثيق رقم الهاتف الآن
                </Button>
              )}

              <Button onClick={() => setStep(2)} className="w-full h-14 rounded-2xl font-bold">
                التالي
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">صورة شخصية واضحة</h2>
              <p className="text-muted-foreground text-sm">يجب أن يظهر وجهك بوضوح في مكان مضيء</p>

              <button
                onClick={() => handleFileInput(setSelfieFile)}
                className={`w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors
                  ${selfieFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                {selfieFile ? (
                  <>
                    <img src={selfieFile} className="w-20 h-20 rounded-full object-cover" />
                    <p className="text-sm text-primary font-medium">تم رفع الصورة ✓</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">اضغط لرفع الصورة الشخصية</p>
                  </>
                )}
              </button>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl">رجوع</Button>
                <Button onClick={() => setStep(3)} disabled={!selfieFile} className="flex-1 h-12 rounded-xl font-bold">التالي</Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                <IdCard className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">صورة الهوية الوطنية</h2>
              <p className="text-muted-foreground text-sm">ارفع صورة واضحة من الوجه الأمامي لبطاقة الهوية</p>

              <button
                onClick={() => handleFileInput(setIdFile)}
                className={`w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors
                  ${idFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                {idFile ? (
                  <>
                    <img src={idFile} className="w-full h-32 rounded-xl object-cover" />
                    <p className="text-sm text-primary font-medium">تم رفع الهوية ✓</p>
                  </>
                ) : (
                  <>
                    <IdCard className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">اضغط لرفع صورة الهوية</p>
                  </>
                )}
              </button>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                🔒 بياناتك محمية ومشفرة ولن تُشارك مع أي طرف ثالث
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 rounded-xl">رجوع</Button>
                <Button onClick={handleSubmit} disabled={!idFile} className="flex-1 h-12 rounded-xl font-bold bg-green-600 hover:bg-green-700">
                  <ShieldCheck className="w-4 h-4 ml-1" />
                  إرسال للمراجعة
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
