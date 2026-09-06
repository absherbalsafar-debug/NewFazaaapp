import { useLocation } from "wouter";
import { ArrowRight, Moon, Sun, Bell, Lock, Trash2, LogOut, HelpCircle, Info, Phone, Shield, Globe, ChevronLeft, ShieldCheck, UserRound, Monitor, FileText, ScrollText } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";

type ThemeOption = "system" | "light" | "dark";

export default function Settings() {
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [, navigate] = useLocation();

  function handleLogout() {
    logout();
    navigate('/welcome');
    toast({ title: "تم تسجيل الخروج" });
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a17b29]">{title}</p>
      <div className="premium-card mx-4 divide-y divide-border overflow-hidden rounded-[24px] bg-card">
        {children}
      </div>
    </div>
  );

  const Item = ({
    icon: Icon,
    label,
    sub,
    iconColor = "text-primary",
    danger = false,
    onClick,
    right,
  }: {
    icon: typeof UserRound;
    label: string;
    sub?: string;
    iconColor?: string;
    danger?: boolean;
    onClick?: () => void;
    right?: React.ReactNode;
  }) => {
    const content = (
      <>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/[0.06] ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${danger ? 'text-destructive' : 'text-foreground'}`}>{label}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        {right ?? <ChevronLeft className="h-4 w-4 text-muted-foreground/50" />}
      </>
    );

    if (!onClick) {
      return <div className={`flex w-full items-center gap-3 px-4 py-3.5 text-start ${danger ? 'text-destructive' : ''}`}>{content}</div>;
    }

    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-primary/[0.04] ${danger ? 'text-destructive' : ''}`}
      >
        {content}
      </button>
    );
  };

  const themeOptions: { value: ThemeOption; label: string; icon: typeof Monitor }[] = [
    { value: "system", label: "تلقائي", icon: Monitor },
    { value: "light", label: "نهاري", icon: Sun },
    { value: "dark", label: "ليلي", icon: Moon },
  ];

  return (
    <div className="premium-surface min-h-[100dvh] bg-background pb-8" dir="rtl">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-primary/10 bg-background/80 px-4 py-4 backdrop-blur-xl">
        <button type="button" onClick={() => navigate('/profile')} className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card hover:bg-muted">
          <ArrowRight className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-primary">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-black">الإعدادات</h1>
            <p className="text-[10px] text-muted-foreground">خصص تجربة فزعة كما تحب</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Section title="حسابي">
          <Item
            icon={UserRound}
            label="الملف الشخصي"
            sub={`${user?.name ?? "حسابك"} · المعلومات والبيانات`}
            onClick={() => navigate('/profile')}
          />
        </Section>

        <Section title="المظهر">
          <Item
            icon={theme === "system" ? Monitor : theme === "dark" ? Moon : Sun}
            label="وضع التطبيق"
            sub={theme === "system" ? "يتبع إعدادات جهازك تلقائياً" : theme === "dark" ? "الوضع الليلي مفعّل يدوياً" : "الوضع النهاري مفعّل يدوياً"}
            right={<span className="text-xs font-bold text-primary">{theme === "system" ? "تلقائي" : theme === "dark" ? "ليلي" : "نهاري"}</span>}
          />
          <div className="grid grid-cols-3 gap-2 border-t border-border/60 p-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const active = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-[11px] font-bold transition-colors ${active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background text-muted-foreground hover:border-primary/30"}`}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
          <Item icon={Globe} label="اللغة" sub="العربية" onClick={() => toast({ title: "قريباً", description: "سيتم دعم لغات إضافية" })} />
        </Section>

        <Section title="الإشعارات">
          <Item icon={Bell} label="إشعارات الطلبات" sub="تلقي تنبيهات عند تحديث الطلبات" right={<input type="checkbox" defaultChecked className="h-5 w-5 accent-primary" />} />
          <Item icon={Bell} label="إشعارات الرسائل" sub="تنبيه عند وصول رسائل جديدة" right={<input type="checkbox" defaultChecked className="h-5 w-5 accent-primary" />} />
        </Section>

        <Section title="الأمان والخصوصية">
          <Item icon={Lock} label="تغيير كلمة المرور" onClick={() => navigate('/auth/forgot-password')} />
          <Item icon={Shield} label="توثيق رقم الهاتف" sub={user?.phoneVerified ? "موثق ✓" : "غير موثق"} onClick={() => navigate('/auth/phone')} />
          <Item icon={FileText} label="سياسة الخصوصية" sub="كيف نحمي بياناتك ونستخدمها" onClick={() => navigate('/privacy')} />
          <Item icon={ScrollText} label="شروط الاستخدام" sub="القواعد المنظمة لاستخدام فزعة" onClick={() => navigate('/terms')} />
        </Section>

        <Section title="الدعم والمساعدة">
          <Item icon={HelpCircle} label="الأسئلة الشائعة" onClick={() => toast({ title: "قريباً" })} />
          <Item icon={Phone} label="تواصل معنا" onClick={() => toast({ title: "قريباً" })} />
          <Item icon={Info} label="من نحن" onClick={() => toast({ title: "فزعة — منصة الخدمات المهنية في اليمن" })} />
        </Section>

        <Section title="منطقة الخطر">
          <Item icon={LogOut} label="تسجيل الخروج" iconColor="text-destructive" danger onClick={handleLogout} />
          <Item icon={Trash2} label="حذف الحساب" sub="هذا الإجراء لا يمكن التراجع عنه" iconColor="text-destructive" danger onClick={() => toast({ title: "تواصل مع الدعم", description: "لحذف الحساب تواصل مع فريق الدعم", variant: "destructive" })} />
        </Section>

        <p className="mt-2 pb-4 text-center text-xs text-muted-foreground">فزعة FAZAAH v1.0.0 — صنعاء، اليمن</p>
      </div>
    </div>
  );
}