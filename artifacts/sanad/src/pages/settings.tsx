import { useLocation } from "wouter";
import { ArrowRight, Moon, Sun, Bell, Lock, Trash2, LogOut, HelpCircle, Info, Phone, Shield, Globe, ChevronLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { Switch } from "@/components/ui/switch";

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
      <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a17b29]">{title}</p>
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
    icon: any; label: string; sub?: string; iconColor?: string;
    danger?: boolean; onClick?: () => void; right?: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-primary/[0.04] ${danger ? 'text-destructive' : ''}`}
    >
        <div className={`w-9 h-9 rounded-xl bg-primary/[0.06] flex items-center justify-center shrink-0 ${iconColor}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? 'text-destructive' : 'text-foreground'}`}>{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {right ?? <ChevronLeft className="w-4 h-4 text-muted-foreground/50" />}
    </button>
  );

  return (
    <div className="premium-surface min-h-[100dvh] bg-background pb-8" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-primary/10 bg-background/80 px-4 py-4 backdrop-blur-xl">
        <button onClick={() => navigate('/profile')} className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card hover:bg-muted">
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
        {/* Appearance */}
        <Section title="المظهر">
          <Item
            icon={theme === 'dark' ? Moon : Sun}
            label="الوضع الليلي"
            sub={theme === 'dark' ? 'مفعّل' : 'معطل'}
            right={
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
              />
            }
          />
          <Item
            icon={Globe}
            label="اللغة"
            sub="العربية"
            onClick={() => toast({ title: "قريباً", description: "سيتم دعم لغات إضافية" })}
          />
        </Section>

        {/* Notifications */}
        <Section title="الإشعارات">
          <Item
            icon={Bell}
            label="إشعارات الطلبات"
            sub="تلقي تنبيهات عند تحديث الطلبات"
            right={<Switch defaultChecked />}
          />
          <Item
            icon={Bell}
            label="إشعارات الرسائل"
            sub="تنبيه عند وصول رسائل جديدة"
            right={<Switch defaultChecked />}
          />
        </Section>

        {/* Security */}
        <Section title="الأمان والخصوصية">
          <Item
            icon={Lock}
            label="تغيير كلمة المرور"
            onClick={() => navigate('/auth/forgot-password')}
          />
          <Item
            icon={Shield}
            label="توثيق رقم الهاتف"
            sub={user?.phoneVerified ? "موثق ✓" : "غير موثق"}
            onClick={() => navigate('/auth/phone')}
          />
          <Item
            icon={LogOut}
            label="تسجيل الخروج من جميع الأجهزة"
            onClick={handleLogout}
          />
        </Section>

        {/* Support */}
        <Section title="الدعم والمساعدة">
          <Item icon={HelpCircle} label="الأسئلة الشائعة" onClick={() => toast({ title: "قريباً" })} />
          <Item icon={Phone} label="تواصل معنا" onClick={() => toast({ title: "قريباً" })} />
          <Item icon={Info} label="من نحن" onClick={() => toast({ title: "فزعة — منصة الخدمات المهنية في اليمن" })} />
          <Item icon={Info} label="سياسة الاستخدام" onClick={() => toast({ title: "قريباً" })} />
        </Section>

        {/* Danger Zone */}
        <Section title="منطقة الخطر">
          <Item
            icon={LogOut}
            label="تسجيل الخروج"
            iconColor="text-destructive"
            danger
            onClick={handleLogout}
          />
          <Item
            icon={Trash2}
            label="حذف الحساب"
            sub="هذا الإجراء لا يمكن التراجع عنه"
            iconColor="text-destructive"
            danger
            onClick={() => toast({ title: "تواصل مع الدعم", description: "لحذف الحساب تواصل مع فريق الدعم", variant: "destructive" })}
          />
        </Section>

        <p className="text-center text-xs text-muted-foreground mt-2 pb-4">فزعة FAZAAH v1.0.0 — صنعاء، اليمن</p>
      </div>
    </div>
  );
}
