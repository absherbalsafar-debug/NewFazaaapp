import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Droplets, Lock, ArrowRight, MapPin, AlertTriangle, CheckCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/auth";
import { useAuth } from "@/lib/auth";

const EMERGENCY_SERVICES = [
  { id: 1, icon: Zap, label: "كهربائي طارئ", color: "bg-yellow-500", categoryId: 2, desc: "مشكلة كهربائية خطيرة" },
  { id: 2, icon: Droplets, label: "سباك طارئ", color: "bg-blue-500", categoryId: 1, desc: "تسرب مياه أو انسداد" },
  { id: 3, icon: Lock, label: "فتح أقفال", color: "bg-gray-700", categoryId: null, desc: "فتح باب أو قفل" },
];

export default function Emergency() {
  const [selected, setSelected] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  async function sendEmergency(serviceId: number) {
    setSelected(serviceId);
    const service = EMERGENCY_SERVICES.find(s => s.id === serviceId)!;
    setSending(true);
    try {
      const query = new URLSearchParams({ limit: "20" });
      if (service.categoryId) query.set("categoryId", String(service.categoryId));
      const providersPage = await apiRequest(`/providers?${query.toString()}`);
      const provider = providersPage.providers.find((item: { isAvailable: boolean }) => item.isAvailable)
        ?? providersPage.providers[0];
      if (!provider) throw new Error("لا يوجد مهني متاح لهذا النوع حالياً");
      await apiRequest('/requests', {
        method: 'POST',
        body: JSON.stringify({
          providerId: provider.id,
          serviceType: service.label,
          description: `طلب طارئ: ${service.desc}`,
          city: user?.city ?? 'صنعاء',
          district: "",
          scheduledAt: null,
          isImmediate: true,
        }),
      });
      setSent(true);
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-[100dvh] bg-primary flex flex-col items-center justify-center p-8 text-center" dir="rtl">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
          <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">تم إرسال طلبك!</h2>
          <p className="text-white/70 mb-8">نبحث الآن عن أقرب مهني متاح في منطقتك</p>
          <div className="bg-white/10 rounded-2xl p-4 mb-8">
            <p className="text-white/60 text-sm">متوسط وقت الاستجابة</p>
            <p className="text-white text-3xl font-bold">١٥ دقيقة</p>
          </div>
          <Button onClick={() => navigate('/my-requests')} className="bg-accent text-primary font-bold h-14 px-10 rounded-2xl">
            تتبع الطلب
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col" dir="rtl">
      {/* Header */}
      <div className="bg-red-600 text-white pt-safe">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            <h1 className="text-xl font-bold">خدمة الطوارئ</h1>
          </div>
        </div>
        <div className="px-4 pb-6">
          <p className="text-red-100 text-sm">اضغط على نوع الطارئ وسنرسل لك أقرب مهني متاح فوراً</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-8 space-y-4 max-w-sm mx-auto w-full">
        {EMERGENCY_SERVICES.map((service) => {
          const Icon = service.icon;
          const isSelected = selected === service.id;
          return (
            <motion.button
              key={service.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => !sending && sendEmergency(service.id)}
              disabled={sending}
              className={`w-full rounded-2xl p-5 flex items-center gap-4 border-2 transition-all text-right shadow-sm ${
                isSelected ? 'border-red-500 bg-red-50' : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl ${service.color} flex items-center justify-center shrink-0`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold">{service.label}</p>
                <p className="text-sm text-muted-foreground">{service.desc}</p>
              </div>
              {isSelected && sending && (
                <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              )}
            </motion.button>
          );
        })}

        <div className="mt-8 bg-muted rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="w-5 h-5 text-primary" />
            <p className="font-semibold text-sm">موقعك الحالي</p>
          </div>
          <p className="text-muted-foreground text-sm">{user?.city ?? 'صنعاء'} — سيتم تحديد الموقع الدقيق عند الإرسال</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <Phone className="w-5 h-5 text-red-600 mx-auto mb-2" />
          <p className="text-red-700 text-sm font-medium">في حالات الخطر الشديد</p>
          <a href="tel:199" className="text-red-600 text-2xl font-bold block mt-1">اتصل 199</a>
        </div>
      </div>
    </div>
  );
}
