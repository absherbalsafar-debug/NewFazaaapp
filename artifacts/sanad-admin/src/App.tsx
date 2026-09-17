import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BadgeCheck,
  Ban,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  ExternalLink,
  Eye,
  Filter,
  LayoutDashboard,
  LoaderCircle,
  MapPin,
  Menu,
  Megaphone,
  MessageCircle,
  MousePointerClick,
  Phone,
  ReceiptText,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  TrendingUp,
  UsersRound,
  Upload,
  WalletCards,
  X,
} from 'lucide-react';
import {
  useGetAdminAnalytics,
  useListAdminSubscriptionPayments,
  useListAdminUsers,
  useReviewAdvertisement,
  useReviewSubscriptionPayment,
  setAuthTokenGetter,
  useUpdateUserStatus,
  useVerifyProvider,
  type AdminUser,
  type UserStatusUpdateStatus,
} from '@workspace/api-client-react';
// The workspace declaration bundle can lag behind the generated source for these two
// admin wallet operations; the runtime still comes from the shared generated client.
// @ts-ignore
import { useListAdminPaymentWallets, useUpdatePaymentWallet } from '@workspace/api-client-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import NotFound from '@/pages/not-found';
import VerificationCenter from '@/pages/verification-center';

const queryClient = new QueryClient();

type CommercialPlan = { id: number; code: string; kind: 'subscription' | 'advertisement'; name: string; description: string; price: number; durationDays: number; benefits: string[]; isActive: boolean; sortOrder: number };
async function adminCommercialApi<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('fazaah_token');
  const response = await fetch(`/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'تعذر تنفيذ العملية');
  return response.json() as Promise<T>;
}

type PaymentWallet = string;

type PaymentWalletSetting = {
  wallet: PaymentWallet;
  displayName: string;
  logoUrl?: string | null;
  description: string;
  usage: 'subscriptions' | 'advertisements' | 'both';
  sortOrder: number;
  merchantName: string;
  merchantAccount: string;
  instructions: string;
  isActive: boolean;
};

const navItems = [
  { href: '/', label: 'نظرة عامة', caption: 'صحة المنصة', icon: LayoutDashboard },
  { href: '/users', label: 'المستخدمون', caption: 'الحسابات والنشاط', icon: UsersRound },
  { href: '/providers', label: 'المهنيون', caption: 'التوثيق والاعتماد', icon: BadgeCheck },
  { href: '/verification', label: 'مركز التحقق', caption: 'الوثائق والاعتماد', icon: ShieldCheck },
  { href: '/business', label: 'المدفوعات والتجاري', caption: 'المحافظ والإعلانات', icon: WalletCards },
];

const walletNames: Record<string, string> = {
  jeeb: 'جيب',
  floosk: 'فلوسك',
  jawali: 'جوالي',
  cash: 'كاش',
  one_cash: 'ون كاش',
  hasib: 'حاسب',
  easy: 'إيزي',
};

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat('ar-YE').format(value ?? 0);
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ar-YE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function shortError(error: unknown) {
  return error instanceof Error ? error.message : 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}

function errorStatus(error: unknown) {
  return typeof error === 'object' && error !== null && 'status' in error
    ? Number((error as { status?: unknown }).status)
    : null;
}

function Button({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  testId,
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  testId?: string;
}) {
  const styles = {
    primary: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:brightness-110',
    secondary: 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary)/.72)]',
    ghost: 'bg-transparent text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
    danger: 'border border-[hsl(var(--destructive)/.25)] bg-[hsl(var(--destructive)/.07)] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/.13)]',
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Badge({ children, tone = 'neutral', testId }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'teal'; testId?: string }) {
  const tones = {
    neutral: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
    good: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    warn: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    bad: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    teal: 'bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]',
  };
  return <span data-testid={testId} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-[hsl(var(--primary))]">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
          {eyebrow}
        </div>
        <h1 data-testid="text-page-title" className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] md:text-[1.8rem]">{title}</h1>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Panel({ children, className = '', title, subtitle, icon: Icon, action }: { children: ReactNode; className?: string; title?: string; subtitle?: string; icon?: typeof Activity; action?: ReactNode }) {
  return (
    <section className={`panel overflow-hidden rounded-2xl ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-[hsl(var(--border))] px-5 py-4 md:px-6">
          <div className="flex items-start gap-3">
            {Icon && <div className="mt-0.5 rounded-lg bg-[hsl(var(--primary)/.09)] p-2 text-[hsl(var(--primary))]"><Icon className="h-4 w-4" /></div>}
            <div>
              {title && <h2 className="text-sm font-bold">{title}</h2>}
              {subtitle && <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function QueryState({ loading, error, onRetry, children, empty, className = '' }: { loading?: boolean; error?: unknown; onRetry?: () => void; children?: ReactNode; empty?: ReactNode; className?: string }) {
  if (loading) {
    return <div className={`space-y-3 p-5 ${className}`}><div className="skeleton h-12 rounded-xl" /><div className="skeleton h-12 rounded-xl" /><div className="skeleton h-12 rounded-xl" /></div>;
  }
  if (error) {
    const status = errorStatus(error);
    const accessMessage = status === 401
      ? 'سجّل الدخول من تطبيق فزعة بحسابك الإداري، ثم أعد تحميل هذه الصفحة.'
      : status === 403
        ? 'الحساب الحالي لا يملك صلاحيات إدارة المنصة.'
        : shortError(error);
    return (
      <div className={`flex flex-col items-center justify-center gap-3 p-10 text-center ${className}`}>
        <div className="rounded-full bg-red-50 p-3 text-red-600 dark:bg-red-950/40"><AlertTriangle className="h-5 w-5" /></div>
        <div><p className="text-sm font-semibold">{status === 401 || status === 403 ? 'لا يمكن فتح بيانات الإدارة' : 'تعذر تحميل البيانات'}</p><p className="mt-1 max-w-sm text-xs leading-6 text-[hsl(var(--muted-foreground))]">{accessMessage}</p></div>
        {onRetry && <Button variant="secondary" onClick={onRetry} testId="button-retry"><RefreshCw className="h-4 w-4" /> إعادة المحاولة</Button>}
      </div>
    );
  }
  return <>{children ?? empty}</>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = navItems.find((item) => item.href === location) ?? navItems[0];
  return (
    <div dir="rtl" className="app-shell">
      <aside className={`sidebar-gradient fixed inset-y-0 right-0 z-40 flex w-[272px] flex-col text-white transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3" data-testid="link-brand">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[hsl(var(--accent))] text-lg font-black text-[hsl(var(--accent-foreground))] shadow-lg shadow-black/15">ف</span>
            <span><span className="block font-[var(--font-display)] text-xl font-extrabold tracking-tight">فزعة</span><span className="block text-[10px] font-medium text-white/55">مركز العمليات</span></span>
          </Link>
          <button className="rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(false)} data-testid="button-close-menu" aria-label="إغلاق القائمة"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-5 pb-4 pt-6">
          <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/40">التشغيل</p>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active = location === item.href;
              const Icon = item.icon;
              return (
                <Link href={item.href} key={item.href} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${item.href === '/' ? 'overview' : item.href.slice(1)}`} className={`group flex items-center gap-3 rounded-xl px-3 py-3 transition duration-200 ${active ? 'bg-white/13 text-white shadow-inner' : 'text-white/62 hover:bg-white/8 hover:text-white'}`}>
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${active ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]' : 'bg-white/7 text-white/65 group-hover:text-white'}`}><Icon className="h-[17px] w-[17px]" /></span>
                  <span className="flex-1"><span className="block text-sm font-semibold">{item.label}</span><span className="mt-0.5 block text-[10px] text-white/38">{item.caption}</span></span>
                  {active && <ChevronLeft className="h-4 w-4 text-white/50" />}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-5">
          <div className="rounded-2xl border border-white/10 bg-white/7 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-white/80"><Activity className="h-4 w-4 text-[hsl(var(--accent))]" /> حالة المنصة</div>
            <div className="flex items-center gap-2 text-xs text-white/55"><span className="status-dot bg-emerald-400" /> جميع الخدمات تعمل بشكل طبيعي</div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[92%] rounded-full bg-[hsl(var(--accent))]" /></div>
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/13 text-xs font-bold text-[hsl(var(--accent))]">م</div>
            <div className="min-w-0"><p className="truncate text-xs font-semibold text-white/85">مدير العمليات</p><p className="mt-0.5 text-[10px] text-white/40">فريق فزعة</p></div>
          </div>
        </div>
      </aside>
      {mobileOpen && <button aria-label="إغلاق القائمة" className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden" onClick={() => setMobileOpen(false)} data-testid="button-overlay-menu" />}
      <div className="lg:mr-[272px]">
        <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-[hsl(var(--border)/.8)] bg-[hsl(var(--background)/.9)] px-5 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2.5 lg:hidden" onClick={() => setMobileOpen(true)} data-testid="button-open-menu" aria-label="فتح القائمة"><Menu className="h-5 w-5" /></button>
            <div><p className="text-[11px] font-medium text-[hsl(var(--muted-foreground))]">مركز العمليات / <span className="text-[hsl(var(--foreground))]">{current.label}</span></p><p className="mt-1 hidden text-xs text-[hsl(var(--muted-foreground))] md:block">آخر مزامنة منذ لحظات</p></div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300 md:flex"><span className="status-dot bg-emerald-500" /> النظام متصل</div>
            <div className="h-8 w-px bg-[hsl(var(--border))]" />
            <div className="text-left"><p className="text-xs font-bold">فريق فزعة</p><p className="text-[10px] text-[hsl(var(--muted-foreground))]">صلاحيات الإدارة</p></div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[hsl(var(--primary))] text-xs font-bold text-white">ف</div>
          </div>
        </header>
        <main className="app-stage mx-auto max-w-[1520px] px-5 py-7 md:px-8 md:py-9">{children}</main>
      </div>
    </div>
  );
}

function AccessRequired() {
  return (
    <div dir="rtl" className="mx-auto flex min-h-[calc(100vh-190px)] max-w-xl items-center justify-center">
      <Panel className="w-full animate-rise p-8 text-center" title="تسجيل الدخول مطلوب" subtitle="لوحة التحكم مستقلة عن واجهة العملاء، لكنها تستخدم نفس جلسة فزعة الآمنة." icon={ShieldAlert}>
        <div className="px-2 pb-2 pt-5">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <p className="text-sm leading-7 text-[hsl(var(--muted-foreground))]">سجّل الدخول من تطبيق فزعة بحساب يملك صلاحيات الإدارة، ثم ارجع إلى لوحة التحكم.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => { window.location.href = '/auth/email'; }} testId="button-open-login">فتح صفحة تسجيل الدخول</Button>
            <Button variant="secondary" onClick={() => window.location.reload()} testId="button-reload-access"><RefreshCw className="h-4 w-4" /> تحقّق مرة أخرى</Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

type AnalyticsRange = '7d' | '30d' | '90d';

const analyticsRangeLabels: Record<AnalyticsRange, string> = {
  '7d': 'آخر 7 أيام',
  '30d': 'آخر 30 يوماً',
  '90d': 'آخر 90 يوماً',
};

function formatCurrency(value?: number | null) {
  return `${new Intl.NumberFormat('ar-YE', { maximumFractionDigits: 0 }).format(value ?? 0)} ريال`;
}

function formatChartDate(value: string) {
  return new Intl.DateTimeFormat('ar-YE', { day: 'numeric', month: 'short' }).format(new Date(value));
}

function RangeSwitcher({ value, onChange, testIdPrefix }: { value: AnalyticsRange; onChange: (value: AnalyticsRange) => void; testIdPrefix: string }) {
  return (
    <div className="flex rounded-xl bg-[hsl(var(--muted))] p-1" role="tablist" aria-label="الفترة الزمنية">
      {(Object.keys(analyticsRangeLabels) as AnalyticsRange[]).map((range) => (
        <button key={range} onClick={() => onChange(range)} role="tab" aria-selected={value === range} data-testid={`${testIdPrefix}-${range}`} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${value === range ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}>
          {analyticsRangeLabels[range]}
        </button>
      ))}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, tone = 'teal', detail }: { label: string; value: number; icon: typeof Activity; tone?: 'teal' | 'gold' | 'blue' | 'green'; detail?: string }) {
  const iconClass = tone === 'gold' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : tone === 'green' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : tone === 'blue' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' : 'bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]';
  return (
    <div className="panel rounded-2xl p-5 transition duration-200 hover:-translate-y-0.5" data-testid={`card-analytics-${label}`}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">{label}</p><p className="mt-3 font-[var(--font-display)] text-2xl font-bold tracking-tight">{formatNumber(value)}</p></div>
        <div className={`rounded-xl p-3 ${iconClass}`}><Icon className="h-5 w-5" /></div>
      </div>
      {detail && <p className="mt-4 text-[11px] text-[hsl(var(--muted-foreground))]">{detail}</p>}
    </div>
  );
}

function AnalyticsChart({ series }: { series: Array<{ date: string; requests: number; messages: number; payments: number; approvedPayments: number }> }) {
  if (series.length === 0) return <EmptyState icon={BarChart3} title="لا توجد حركة زمنية" description="سيظهر المخطط عند توفر أحداث خلال الفترة المحددة." />;
  const width = 760;
  const height = 230;
  const padding = { top: 18, right: 20, bottom: 40, left: 30 };
  const max = Math.max(...series.flatMap((point) => [point.requests, point.messages, point.payments]), 1);
  const pointAt = (value: number, index: number) => {
    const x = padding.left + (index / Math.max(series.length - 1, 1)) * (width - padding.left - padding.right);
    const y = padding.top + (1 - value / max) * (height - padding.top - padding.bottom);
    return `${x},${y}`;
  };
  const line = (key: 'requests' | 'messages' | 'payments') => series.map((point, index) => pointAt(point[key], index)).join(' ');
  const labels = series.length > 6 ? [0, Math.floor(series.length / 2), series.length - 1] : series.map((_, index) => index);
  return (
    <div className="p-5 md:p-6" dir="ltr" data-testid="chart-analytics-timeline">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3" dir="rtl">
        <div className="flex flex-wrap gap-4 text-[11px] font-semibold text-[hsl(var(--muted-foreground))]">
          <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />طلبات</span>
          <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />رسائل</span>
          <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-sky-500" />مدفوعات</span>
        </div>
        <span className="text-[11px] text-[hsl(var(--muted-foreground))]">النشاط اليومي</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible" role="img" aria-label="مخطط الطلبات والرسائل والمدفوعات">
        {[0, 1, 2, 3].map((step) => {
          const y = padding.top + (step / 3) * (height - padding.top - padding.bottom);
          return <line key={step} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="hsl(var(--border))" strokeDasharray="3 5" />;
        })}
        <polyline points={line('requests')} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={line('messages')} fill="none" stroke="hsl(var(--accent))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={line('payments')} fill="none" stroke="#3b82b6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {labels.map((index) => {
          const point = series[index];
          const x = padding.left + (index / Math.max(series.length - 1, 1)) * (width - padding.left - padding.right);
          return <text key={point.date} x={x} y={height - 12} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">{formatChartDate(point.date)}</text>;
        })}
      </svg>
    </div>
  );
}

function Overview() {
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const analyticsQuery = useGetAdminAnalytics({ range }, { query: { queryKey: ['sanad-admin', 'analytics', range], refetchOnWindowFocus: false } });
  const analytics = analyticsQuery.data;
  const overview = analytics?.overview;
  return (
    <>
       <PageHeader eyebrow="مركز القرار" title="لوحة أداء فزعة" description="قراءة تشغيلية موحدة للحركة التراكمية، مع مخطط يومي قابل للتبديل حسب الفترة." action={<div className="flex flex-wrap items-center gap-2"><RangeSwitcher value={range} onChange={setRange} testIdPrefix="button-range-overview" /><Button variant="secondary" onClick={() => { void analyticsQuery.refetch(); }} disabled={analyticsQuery.isFetching} testId="button-refresh-overview"><RefreshCw className={`h-4 w-4 ${analyticsQuery.isFetching ? 'animate-spin' : ''}`} /> تحديث</Button></div>} />
      <QueryState loading={analyticsQuery.isLoading} error={analyticsQuery.error} onRetry={() => { void analyticsQuery.refetch(); }}>
        {analytics && overview ? (
          <div className="animate-rise space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="إجمالي المستخدمين" value={overview.totalUsers} icon={UsersRound} detail={`${formatNumber(overview.totalClients)} عميل · ${formatNumber(overview.totalProviders)} مهني`} />
              <MetricCard label="المهنيون النشطون" value={overview.activeProviders} icon={BriefcaseBusiness} tone="gold" detail={`${formatNumber(overview.verifiedProviders)} موثق · ${formatNumber(overview.pendingProviders)} بانتظار المراجعة`} />
              <MetricCard label="طلبات الخدمة" value={overview.totalRequests} icon={BarChart3} tone="blue" detail={`${formatNumber(overview.completedRequests)} مكتملة · ${formatNumber(overview.pendingRequests)} قيد المتابعة`} />
               <MetricCard label="مشاهدات الملفات" value={overview.profileViews} icon={Eye} tone="green" detail="إجمالي منذ بدء القياس" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="ضغطات الاتصال" value={overview.callClicks} icon={Phone} />
              <MetricCard label="ضغطات واتساب" value={overview.whatsappClicks} icon={MessageCircle} tone="green" />
              <MetricCard label="الرسائل" value={overview.messageCount} icon={MessageCircle} tone="gold" detail={`${formatNumber(overview.conversationCount)} محادثة`} />
              <MetricCard label="المدفوعات المعتمدة" value={overview.approvedPayments} icon={CheckCircle2} tone="teal" detail={formatCurrency(overview.approvedPaymentAmount)} />
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.45fr_.8fr]">
              <Panel title="نبض المنصة" subtitle={`الطلبات والرسائل والمدفوعات · ${analyticsRangeLabels[range]}`} icon={TrendingUp} action={<Badge tone="teal">{formatNumber(analytics.series.reduce((sum, point) => sum + point.requests, 0))} طلب زمني</Badge>}>
                <AnalyticsChart series={analytics.series} />
              </Panel>
              <Panel title="ملخص المدفوعات" subtitle="توزيع العمليات وقيمتها حسب الحالة" icon={WalletCards}>
                 {analytics.paymentSummary.length === 0 ? <EmptyState icon={WalletCards} title="لا توجد مدفوعات" description="لم تسجل المنصة مدفوعات حتى الآن." /> : <div className="divide-y divide-[hsl(var(--border))]">{analytics.paymentSummary.map((item) => {
                  const label = item.status === 'approved' ? 'معتمدة' : item.status === 'pending' ? 'قيد المراجعة' : item.status === 'rejected' ? 'مرفوضة' : item.status === 'refunded' ? 'مستردة' : 'منتهية';
                  const tone = item.status === 'approved' ? 'good' : item.status === 'pending' ? 'warn' : item.status === 'rejected' ? 'bad' : 'neutral';
                  return <div key={item.status} className="flex items-center justify-between gap-3 p-4" data-testid={`row-payment-summary-${item.status}`}><div><Badge tone={tone}>{label}</Badge><p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{formatNumber(item.count)} عملية</p></div><p className="font-[var(--font-display)] text-sm font-bold">{formatCurrency(item.amount)}</p></div>;
                })}</div>}
                <div className="m-4 rounded-xl bg-[hsl(var(--primary)/.06)] p-4"><p className="text-xs font-semibold text-[hsl(var(--primary))]">المبالغ قيد المراجعة</p><p className="mt-2 font-[var(--font-display)] text-xl font-bold text-[hsl(var(--primary))]">{formatCurrency(overview.pendingPaymentAmount)}</p><p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">{formatNumber(overview.pendingPayments)} عملية تحتاج قراراً</p></div>
              </Panel>
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
              <Panel title="أفضل المهنيين أداءً" subtitle="ترتيب مركب من التفاعل والطلبات خلال الفترة" icon={BadgeCheck} action={<Link href="/providers" className="text-xs font-bold text-[hsl(var(--primary))]" data-testid="link-analytics-providers">عرض الدليل</Link>}>
                {analytics.topProviders.length === 0 ? <EmptyState icon={BriefcaseBusiness} title="لا توجد بيانات مهنيين" description="ستظهر المؤشرات بعد تسجيل نشاط للمهنيين." /> : <div className="divide-y divide-[hsl(var(--border))]">{analytics.topProviders.slice(0, 5).map((provider, index) => <div key={provider.providerId} className="flex items-center gap-3 p-4" data-testid={`row-top-provider-${provider.providerId}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[hsl(var(--muted))] text-xs font-bold text-[hsl(var(--primary))]">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-bold">{provider.name}</p>{provider.isVerified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}</div><p className="mt-1 truncate text-[11px] text-[hsl(var(--muted-foreground))]">{provider.categoryName} · {provider.city}</p></div><div className="text-left"><p className="text-sm font-bold">{formatNumber(provider.requests)} طلب</p><p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{formatNumber(provider.profileViews)} مشاهدة</p></div></div>)}</div>}
              </Panel>
              <Panel title="أحدث المدفوعات" subtitle="آخر العمليات الواردة من النظام" icon={ReceiptText}>
                {analytics.recentPayments.length === 0 ? <EmptyState icon={ReceiptText} title="لا توجد عمليات حديثة" description="لا توجد مدفوعات ضمن الفترة المحددة." /> : <div className="divide-y divide-[hsl(var(--border))]">{analytics.recentPayments.slice(0, 5).map((payment) => <div key={payment.id} className="flex items-center justify-between gap-3 p-4" data-testid={`row-recent-payment-${payment.id}`}><div className="min-w-0"><p className="truncate text-sm font-semibold">{payment.providerName}</p><p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">{payment.plan === 'yearly' ? 'اشتراك سنوي' : 'اشتراك شهري'} · {walletNames[payment.wallet] || payment.wallet}</p></div><div className="text-left"><p className="text-sm font-bold">{formatCurrency(payment.amount)}</p><p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{formatDate(payment.createdAt)}</p></div></div>)}</div>}
              </Panel>
            </div>
          </div>
        ) : <EmptyState icon={Activity} title="لا توجد بيانات تحليلية" description="لم يعثر الخادم على بيانات تشغيلية ضمن الفترة المحددة." />}
      </QueryState>
    </>
  );
}

function UsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const toast = useToast();
  const usersQuery = useListAdminUsers({ search: search || undefined, role: role === 'all' ? undefined : role, status: status === 'all' ? undefined : status }, { query: { queryKey: ['sanad-admin', 'users', search, role, status], refetchOnWindowFocus: false } });
  const updateStatus = useUpdateUserStatus();
  const users = usersQuery.data?.users ?? [];
  const changeStatus = (id: number, nextStatus: UserStatusUpdateStatus) => {
    updateStatus.mutate({ id, data: { status: nextStatus } }, {
      onSuccess: () => { toast.toast({ title: nextStatus === 'active' ? 'تم تنشيط الحساب' : 'تم حظر الحساب' }); void usersQuery.refetch(); },
      onError: (error) => toast.toast({ title: 'تعذر تحديث حالة الحساب', description: shortError(error), variant: 'destructive' }),
    });
  };
  return (
    <>
      <PageHeader eyebrow="إدارة الحسابات" title="المستخدمون" description="ابحث في حسابات فزعة، راجع نشاطها، واتخذ إجراءً واضحاً عند الحاجة." action={<Button variant="secondary" onClick={() => { void usersQuery.refetch(); }} disabled={usersQuery.isFetching} testId="button-refresh-users"><RefreshCw className={`h-4 w-4 ${usersQuery.isFetching ? 'animate-spin' : ''}`} /> تحديث</Button>} />
      <Panel className="animate-rise" title="دليل المستخدمين" subtitle={usersQuery.data ? `${formatNumber(usersQuery.data.total)} حساب في النتائج` : 'بحث وفلاتر مباشرة'} icon={UsersRound}>
        <div className="flex flex-col gap-3 border-b border-[hsl(var(--border))] p-5 md:flex-row">
          <label className="relative flex-1"><Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالاسم أو رقم الهاتف" data-testid="input-search-users" className="h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] pr-10 pl-3 text-sm outline-none transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/.12)]" /></label>
          <div className="relative"><Filter className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))]" /><select value={role} onChange={(event) => setRole(event.target.value)} data-testid="select-user-role" className="h-10 min-w-[160px] appearance-none rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-9 pl-8 text-sm outline-none"><option value="all">كل الأدوار</option><option value="client">عملاء</option><option value="provider">مهنيون</option><option value="admin">إدارة</option></select></div>
          <div className="relative"><SlidersHorizontal className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[hsl(var(--muted-foreground))]" /><select value={status} onChange={(event) => setStatus(event.target.value)} data-testid="select-user-status" className="h-10 min-w-[160px] appearance-none rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-9 pl-8 text-sm outline-none"><option value="all">كل الحالات</option><option value="active">نشط</option><option value="pending">قيد الانتظار</option><option value="banned">محظور</option></select></div>
        </div>
        <QueryState loading={usersQuery.isLoading} error={usersQuery.error} onRetry={() => { void usersQuery.refetch(); }} empty={<EmptyState icon={UsersRound} title="لا توجد حسابات" description="لم تعثر الفلاتر الحالية على أي مستخدم." />}>
          {users.length === 0 ? <EmptyState icon={UsersRound} title="لا توجد حسابات" description="لم تعثر الفلاتر الحالية على أي مستخدم." /> : <div className="scrollbar-thin overflow-x-auto"><table className="w-full min-w-[850px] text-right text-sm"><thead className="bg-[hsl(var(--muted)/.55)] text-xs text-[hsl(var(--muted-foreground))]"><tr><th className="px-5 py-3 font-semibold">المستخدم</th><th className="px-5 py-3 font-semibold">الدور</th><th className="px-5 py-3 font-semibold">الموقع / التصنيف</th><th className="px-5 py-3 font-semibold">التسجيل</th><th className="px-5 py-3 font-semibold">الحالة</th><th className="px-5 py-3 font-semibold">الإجراء</th></tr></thead><tbody className="divide-y divide-[hsl(var(--border))]">{users.map((user, index) => <UserRow key={user.id} user={user} index={index} onStatus={changeStatus} pending={updateStatus.isPending} />)}</tbody></table></div>}
        </QueryState>
      </Panel>
    </>
  );
}

function UserRow({ user, index, onStatus, pending }: { user: AdminUser; index: number; onStatus: (id: number, status: UserStatusUpdateStatus) => void; pending: boolean }) {
  const roleLabel = user.role === 'provider' ? 'مهني' : user.role === 'client' ? 'عميل' : 'إدارة';
  const statusLabel = user.status === 'active' ? 'نشط' : user.status === 'banned' ? 'محظور' : 'قيد الانتظار';
  const tone = user.status === 'active' ? 'good' : user.status === 'banned' ? 'bad' : 'warn';
  return <tr className="transition hover:bg-[hsl(var(--muted)/.35)]" data-testid={`row-user-${user.id}`}><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[hsl(var(--primary)/.1)] text-xs font-bold text-[hsl(var(--primary))]">{user.name.slice(0, 1)}</div><div><p className="font-semibold">{user.name}</p><p className="mt-1 flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]" dir="ltr"><Phone className="h-3 w-3" />{user.phone}</p></div></div></td><td className="px-5 py-4"><Badge tone={user.role === 'provider' ? 'teal' : 'neutral'}>{roleLabel}</Badge></td><td className="px-5 py-4"><p className="flex items-center gap-1 text-xs font-medium">{user.city || 'غير محدد'} <MapPin className="h-3 w-3 text-[hsl(var(--muted-foreground))]" /></p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{user.categoryName || '—'}</p></td><td className="px-5 py-4 text-xs text-[hsl(var(--muted-foreground))]">{formatDate(user.createdAt)}</td><td className="px-5 py-4"><Badge tone={tone} testId={`status-user-${user.id}`}><span className={`status-dot ${user.status === 'active' ? 'bg-emerald-500' : user.status === 'banned' ? 'bg-red-500' : 'bg-amber-500'}`} />{statusLabel}</Badge></td><td className="px-5 py-4"><div className="flex items-center gap-2">{user.status !== 'active' && <Button variant="secondary" className="h-8 px-3 text-xs text-emerald-700 dark:text-emerald-300" onClick={() => onStatus(user.id, 'active')} disabled={pending} testId={`button-activate-user-${user.id}`}><Check className="h-3.5 w-3.5" />تنشيط</Button>}{user.status !== 'banned' && user.role !== 'admin' && <Button variant="danger" className="h-8 px-3 text-xs" onClick={() => onStatus(user.id, 'banned')} disabled={pending} testId={`button-ban-user-${user.id}`}><Ban className="h-3.5 w-3.5" />حظر</Button>}{user.status === 'active' && user.role === 'admin' && <span className="text-xs text-[hsl(var(--muted-foreground))]">حساب إداري</span>}</div></td></tr>;
}

function ProvidersPage() {
  const [filter, setFilter] = useState('all');
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const toast = useToast();
  const providersQuery = useListAdminUsers({ role: 'provider' }, { query: { queryKey: ['sanad-admin', 'providers'], refetchOnWindowFocus: false } });
  const analyticsQuery = useGetAdminAnalytics({ range }, { query: { queryKey: ['sanad-admin', 'provider-analytics', range], refetchOnWindowFocus: false } });
  const verifyProvider = useVerifyProvider();
  const providers = useMemo(() => (providersQuery.data?.users ?? []).filter((provider) => filter === 'all' || (filter === 'verified' ? provider.isVerified : !provider.isVerified)), [providersQuery.data?.users, filter]);
  const verify = (id: number, isVerified: boolean) => {
    verifyProvider.mutate({ id, data: { isVerified } }, {
      onSuccess: () => { toast.toast({ title: isVerified ? 'تم توثيق المهني' : 'تم إلغاء التوثيق' }); void providersQuery.refetch(); },
      onError: (error) => toast.toast({ title: 'تعذر تحديث التوثيق', description: shortError(error), variant: 'destructive' }),
    });
  };
  return <>
     <PageHeader eyebrow="الثقة والجودة" title="المهنيون" description="راجع التوثيق واقرأ أداء المهنيين قبل اتخاذ قرارات التشغيل." action={<div className="flex flex-wrap items-center gap-2"><RangeSwitcher value={range} onChange={setRange} testIdPrefix="button-range-providers" /><Button variant="secondary" onClick={() => { void providersQuery.refetch(); void analyticsQuery.refetch(); }} disabled={providersQuery.isFetching || analyticsQuery.isFetching} testId="button-refresh-providers"><RefreshCw className={`h-4 w-4 ${providersQuery.isFetching || analyticsQuery.isFetching ? 'animate-spin' : ''}`} /> تحديث</Button></div>} />
     <Panel className="mb-6 animate-rise" title="مؤشرات أداء المهنيين" subtitle="المؤشرات التراكمية للزيارات والتفاعل والطلبات" icon={TrendingUp}>
      <QueryState loading={analyticsQuery.isLoading} error={analyticsQuery.error} onRetry={() => { void analyticsQuery.refetch(); }}>
        {analyticsQuery.data ? <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="المهنيون النشطون" value={analyticsQuery.data.overview.activeProviders} icon={BriefcaseBusiness} tone="gold" />
          <MetricCard label="المهنيون الموثقون" value={analyticsQuery.data.overview.verifiedProviders} icon={ShieldCheck} tone="green" />
          <MetricCard label="مشاهدات الملفات" value={analyticsQuery.data.overview.profileViews} icon={Eye} tone="blue" />
          <MetricCard label="طلبات الخدمة" value={analyticsQuery.data.overview.totalRequests} icon={BarChart3} />
        </div> : <EmptyState icon={TrendingUp} title="لا توجد مؤشرات" description="ستظهر مؤشرات الأداء عند توفر بيانات من الخادم." />}
      </QueryState>
    </Panel>
    <Panel className="animate-rise" title="قائمة المهنيين" subtitle={providersQuery.data ? `${formatNumber(providersQuery.data.total)} مهني مسجل` : 'مراجعة حالات التوثيق'} icon={BadgeCheck} action={<div className="flex rounded-xl bg-[hsl(var(--muted))] p-1"><button onClick={() => setFilter('all')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === 'all' ? 'bg-[hsl(var(--card))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid="button-filter-providers-all">الكل</button><button onClick={() => setFilter('pending')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === 'pending' ? 'bg-[hsl(var(--card))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid="button-filter-providers-pending">بانتظار التوثيق</button><button onClick={() => setFilter('verified')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === 'verified' ? 'bg-[hsl(var(--card))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid="button-filter-providers-verified">موثق</button></div>}>
      <QueryState loading={providersQuery.isLoading} error={providersQuery.error} onRetry={() => { void providersQuery.refetch(); }}>
        {providers.length === 0 ? <EmptyState icon={BriefcaseBusiness} title="لا يوجد مهنيون في هذا العرض" description="ستظهر طلبات المهنيين الجدد هنا عند التسجيل." /> : <div className="scrollbar-thin overflow-x-auto"><table className="w-full min-w-[1080px] text-right text-sm"><thead className="bg-[hsl(var(--muted)/.55)] text-xs text-[hsl(var(--muted-foreground))]"><tr><th className="px-5 py-3 font-semibold">المهني</th><th className="px-5 py-3 font-semibold">الخدمة والمدينة</th><th className="px-5 py-3 font-semibold">التفاعل</th><th className="px-5 py-3 font-semibold">الطلبات</th><th className="px-5 py-3 font-semibold">التوثيق</th><th className="px-5 py-3 font-semibold">الإجراء</th></tr></thead><tbody className="divide-y divide-[hsl(var(--border))]">{providers.map((provider) => { const metrics = analyticsQuery.data?.topProviders.find((item) => item.providerId === provider.id); return <tr key={provider.id} className="transition hover:bg-[hsl(var(--muted)/.35)]" data-testid={`row-provider-${provider.id}`}><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--primary)/.1)] font-bold text-[hsl(var(--primary))]">{provider.name.slice(0, 1)}</div><div><p className="font-semibold">{provider.name}</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]" dir="ltr">{provider.phone}</p></div></div></td><td className="px-5 py-4"><p className="font-medium">{provider.categoryName || '—'}</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{provider.city || '—'}</p></td><td className="px-5 py-4"><div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold"><span className="inline-flex items-center gap-1 text-[hsl(var(--primary))]"><Eye className="h-3.5 w-3.5" />{formatNumber(metrics?.profileViews)} </span><span className="inline-flex items-center gap-1 text-[hsl(var(--muted-foreground))]"><MousePointerClick className="h-3.5 w-3.5" />{formatNumber((metrics?.callClicks ?? 0) + (metrics?.whatsappClicks ?? 0))}</span></div><p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">{formatNumber(metrics?.messages)} رسالة</p></td><td className="px-5 py-4"><div className="flex items-center gap-1 text-sm font-semibold text-[hsl(var(--primary))]"><BarChart3 className="h-4 w-4" />{formatNumber(metrics?.requests)}</div><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{formatNumber(provider.completedJobs)} أعمال مكتملة</p></td><td className="px-5 py-4">{provider.isVerified ? <Badge tone="good"><ShieldCheck className="h-3.5 w-3.5" />موثق</Badge> : <Badge tone="warn"><ShieldAlert className="h-3.5 w-3.5" />بانتظار التوثيق</Badge>}</td><td className="px-5 py-4"><Button variant={provider.isVerified ? 'danger' : 'secondary'} className="h-9 px-3 text-xs" onClick={() => verify(provider.id, !provider.isVerified)} disabled={verifyProvider.isPending} testId={`${provider.isVerified ? 'button-unverify' : 'button-verify'}-provider-${provider.id}`}>{verifyProvider.isPending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : provider.isVerified ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}{provider.isVerified ? 'إلغاء التوثيق' : 'توثيق المهني'}</Button></td></tr>; })}</tbody></table></div>}
      </QueryState>
    </Panel>
  </>;
}

function BusinessPage() {
  const toast = useToast();
  const paymentsQuery = useListAdminSubscriptionPayments({ query: { queryKey: ['sanad-admin', 'payments'], refetchOnWindowFocus: false } });
  const walletsQuery = useListAdminPaymentWallets({ query: { queryKey: ['sanad-admin', 'wallets'], refetchOnWindowFocus: false } });
  const reviewPayment = useReviewSubscriptionPayment();
  const reviewAd = useReviewAdvertisement();
  const updateWallet = useUpdatePaymentWallet();
  const [note, setNote] = useState('');
  const [adId, setAdId] = useState('');
  const [adNote, setAdNote] = useState('');
  const [newWalletId, setNewWalletId] = useState('');
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Omit<PaymentWalletSetting, 'wallet'>>>({});
  useEffect(() => {
    if (walletsQuery.data) setDrafts(Object.fromEntries(walletsQuery.data.map((wallet: PaymentWalletSetting) => [wallet.wallet, { displayName: wallet.displayName, logoUrl: wallet.logoUrl, description: wallet.description, usage: wallet.usage, sortOrder: wallet.sortOrder, merchantName: wallet.merchantName, merchantAccount: wallet.merchantAccount, instructions: wallet.instructions, isActive: wallet.isActive }])));
  }, [walletsQuery.data]);
  useEffect(() => { void adminCommercialApi<CommercialPlan[]>('/admin/commercial-plans').then(setPlans).catch((error) => toast.toast({ title: 'تعذر تحميل الباقات', description: shortError(error), variant: 'destructive' })); }, []);
  const reviewPaymentAction = (id: number, status: 'approved' | 'rejected') => reviewPayment.mutate({ id, data: { status, adminNote: note.trim() || null } }, {
    onSuccess: () => { setNote(''); toast.toast({ title: status === 'approved' ? 'تم اعتماد الاشتراك' : 'تم رفض عملية الدفع' }); void paymentsQuery.refetch(); },
    onError: (error) => toast.toast({ title: 'تعذر مراجعة الدفع', description: shortError(error), variant: 'destructive' }),
  });
  const reviewAdAction = (status: 'active' | 'rejected') => {
    const id = Number(adId);
    if (!Number.isInteger(id) || id < 1) { toast.toast({ title: 'أدخل رقم إعلان صحيح', variant: 'destructive' }); return; }
    reviewAd.mutate({ id, data: { status, reviewNote: adNote.trim() || null } }, {
      onSuccess: () => { setAdId(''); setAdNote(''); toast.toast({ title: status === 'active' ? 'تم تفعيل الإعلان' : 'تم رفض الإعلان' }); },
      onError: (error) => toast.toast({ title: 'تعذر تحديث الإعلان', description: shortError(error), variant: 'destructive' }),
    });
  };
  const saveWallet = (wallet: PaymentWalletSetting) => {
    const draft = drafts[wallet.wallet];
    if (!draft) return;
    updateWallet.mutate({ wallet: wallet.wallet, data: draft }, {
      onSuccess: () => { toast.toast({ title: `تم حفظ إعدادات محفظة ${walletNames[wallet.wallet] || wallet.wallet}` }); void walletsQuery.refetch(); },
      onError: (error: unknown) => toast.toast({ title: 'تعذر حفظ إعدادات المحفظة', description: shortError(error), variant: 'destructive' }),
    });
  };
  const addWallet = () => {
    const wallet = newWalletId.trim().toLowerCase().replace(/\s+/g, '_');
    if (!wallet) { toast.toast({ title: 'أدخل معرف المحفظة', variant: 'destructive' }); return; }
    updateWallet.mutate({ wallet, data: { displayName: wallet, logoUrl: null, description: '', usage: 'both', sortOrder: 0, merchantName: '', merchantAccount: '', instructions: '', isActive: true } }, { onSuccess: () => { setNewWalletId(''); toast.toast({ title: 'تمت إضافة المحفظة' }); void walletsQuery.refetch(); }, onError: (error) => toast.toast({ title: 'تعذر إضافة المحفظة', description: shortError(error), variant: 'destructive' }) });
  };
  const savePlan = async (plan: CommercialPlan) => { try { const saved = await adminCommercialApi<CommercialPlan>(`/admin/commercial-plans/${plan.id}`, { method: 'PATCH', body: JSON.stringify(plan) }); setPlans((current) => current.map((item) => item.id === saved.id ? saved : item)); toast.toast({ title: `تم حفظ ${saved.name}` }); } catch (error) { toast.toast({ title: 'تعذر حفظ الباقة', description: shortError(error), variant: 'destructive' }); } };
  const payments = paymentsQuery.data ?? [];
  return <>
    <PageHeader eyebrow="العمليات التجارية" title="المدفوعات والتجاري" description="راجع التحويلات اليدوية، تحكم في محافظ التجار، واعتمد الإعلانات المدفوعة." action={<Button variant="secondary" onClick={() => { void paymentsQuery.refetch(); void walletsQuery.refetch(); }} disabled={paymentsQuery.isFetching || walletsQuery.isFetching} testId="button-refresh-business"><RefreshCw className={`h-4 w-4 ${paymentsQuery.isFetching ? 'animate-spin' : ''}`} /> تحديث العمليات</Button>} />
    <div className="space-y-6 animate-rise">
      <Panel title="مراجعة إعلان مدفوع" subtitle="أدخل رقم الإعلان كما يظهر في طلب المهني ثم سجل قرار المراجعة." icon={Megaphone}>
        <div className="grid gap-3 p-5 md:grid-cols-[170px_1fr_auto_auto] md:items-start">
          <input value={adId} onChange={(event) => setAdId(event.target.value)} placeholder="رقم الإعلان" dir="ltr" data-testid="input-ad-id" className="h-10 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:border-[hsl(var(--primary))]" />
          <textarea value={adNote} onChange={(event) => setAdNote(event.target.value)} placeholder="ملاحظة المراجعة (اختيارية)" data-testid="input-ad-note" className="min-h-10 resize-y rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]" />
          <Button onClick={() => reviewAdAction('active')} disabled={reviewAd.isPending} testId="button-approve-ad"><Check className="h-4 w-4" />تفعيل الإعلان</Button>
          <Button variant="danger" onClick={() => reviewAdAction('rejected')} disabled={reviewAd.isPending} testId="button-reject-ad"><X className="h-4 w-4" />رفض الإعلان</Button>
        </div>
      </Panel>
      <Panel title="باقات الاشتراكات والإعلانات" subtitle="عدّل الأسعار والمزايا والمدة والترتيب والتفعيل من مكان واحد." icon={SlidersHorizontal}>
        <div className="grid gap-4 p-5 xl:grid-cols-2">{plans.map((plan) => <div key={plan.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.25)] p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-[hsl(var(--primary))]">{plan.kind === 'subscription' ? 'اشتراك مهني' : 'إعلان مدفوع'}</p><p className="font-bold">{plan.code}</p></div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={plan.isActive} onChange={(event) => setPlans((current) => current.map((item) => item.id === plan.id ? { ...item, isActive: event.target.checked } : item))} />مفعلة</label></div><div className="grid gap-2 sm:grid-cols-2"><input value={plan.name} onChange={(event) => setPlans((current) => current.map((item) => item.id === plan.id ? { ...item, name: event.target.value } : item))} placeholder="اسم الباقة" className="h-10 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs" /><input type="number" value={plan.price} onChange={(event) => setPlans((current) => current.map((item) => item.id === plan.id ? { ...item, price: Number(event.target.value) || 0 } : item))} placeholder="السعر بالريال" className="h-10 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs" /><input value={plan.description} onChange={(event) => setPlans((current) => current.map((item) => item.id === plan.id ? { ...item, description: event.target.value } : item))} placeholder="وصف الباقة" className="h-10 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs sm:col-span-2" /><input type="number" value={plan.durationDays} onChange={(event) => setPlans((current) => current.map((item) => item.id === plan.id ? { ...item, durationDays: Number(event.target.value) || 1 } : item))} placeholder="المدة بالأيام" className="h-10 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs" /><input type="number" value={plan.sortOrder} onChange={(event) => setPlans((current) => current.map((item) => item.id === plan.id ? { ...item, sortOrder: Number(event.target.value) || 0 } : item))} placeholder="الترتيب" className="h-10 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs" /></div><textarea value={plan.benefits.join('\n')} onChange={(event) => setPlans((current) => current.map((item) => item.id === plan.id ? { ...item, benefits: event.target.value.split('\n').map((value) => value.trim()).filter(Boolean) } : item))} placeholder="ميزة في كل سطر" className="mt-2 min-h-20 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 py-2 text-xs" /><Button className="mt-3 w-full" onClick={() => void savePlan(plan)}>حفظ الباقة</Button></div>)}</div>
      </Panel>
      <Panel title="محافظ الدفع" subtitle="تظهر البيانات النشطة للمهني أثناء الدفع اليدوي للاشتراك." icon={WalletCards}>
        <div className="flex gap-2 border-b border-[hsl(var(--border))] p-5"><input value={newWalletId} onChange={(event) => setNewWalletId(event.target.value)} placeholder="معرف محفظة جديدة مثل cash_mobile" dir="ltr" className="h-10 flex-1 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm" /><Button onClick={addWallet} disabled={updateWallet.isPending}>إضافة محفظة</Button></div>
        <QueryState loading={walletsQuery.isLoading} error={walletsQuery.error} onRetry={() => { void walletsQuery.refetch(); }}>
          {(walletsQuery.data ?? []).length === 0 ? <EmptyState icon={WalletCards} title="لا توجد محافظ معدة" description="لم تصل إعدادات المحافظ من الخادم." /> : <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">{(walletsQuery.data ?? []).map((wallet: PaymentWalletSetting) => <WalletCard key={wallet.wallet} wallet={wallet} draft={drafts[wallet.wallet] ?? wallet} setDraft={(next) => setDrafts((current) => ({ ...current, [wallet.wallet]: { ...current[wallet.wallet], ...next } }))} onSave={() => saveWallet(wallet)} pending={updateWallet.isPending} />)}</div>}
        </QueryState>
      </Panel>
      <Panel title="طلبات تحويل الاشتراك" subtitle="لا يتم تفعيل الاشتراك تلقائياً قبل اعتماد التحويل." icon={ReceiptText} action={<Badge tone="warn">{formatNumber(payments.filter((payment) => payment.status === 'pending').length)} قيد المراجعة</Badge>}>
        <QueryState loading={paymentsQuery.isLoading} error={paymentsQuery.error} onRetry={() => { void paymentsQuery.refetch(); }}>
          {payments.length === 0 ? <EmptyState icon={ReceiptText} title="لا توجد طلبات دفع" description="ستظهر التحويلات اليدوية الجديدة هنا." /> : <div className="divide-y divide-[hsl(var(--border))]">{payments.map((payment) => <div className="grid gap-5 p-5 md:grid-cols-[1.1fr_1fr_auto] md:items-center" key={payment.id} data-testid={`row-payment-${payment.id}`}><div><div className="flex flex-wrap items-center gap-2"><span className="font-[var(--font-display)] font-bold">#{payment.id}</span><Badge tone={payment.status === 'pending' ? 'warn' : payment.status === 'approved' ? 'good' : 'bad'}>{payment.status === 'pending' ? 'قيد المراجعة' : payment.status === 'approved' ? 'معتمد' : 'مرفوض'}</Badge><span className="text-xs text-[hsl(var(--muted-foreground))]">{payment.plan === 'yearly' ? 'اشتراك سنوي' : 'اشتراك شهري'}</span></div><p className="mt-2 text-sm">المهني رقم <b>{formatNumber(payment.providerId)}</b> · {walletNames[payment.wallet] || payment.wallet}</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">مرجع العملية: <b dir="ltr">{payment.transactionReference}</b> · {formatDate(payment.createdAt)}</p>{payment.receiptUrl && <a href={payment.receiptUrl.startsWith('http') ? payment.receiptUrl : `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api/storage${payment.receiptUrl}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[hsl(var(--primary))] underline" data-testid={`link-receipt-${payment.id}`}>فتح الإيصال <ExternalLink className="h-3 w-3" /></a>}</div><div className="text-xs text-[hsl(var(--muted-foreground))]"><p className="mb-2 font-semibold text-[hsl(var(--foreground))]">ملاحظة الإدارة</p><p className="leading-6">{payment.adminNote || 'لا توجد ملاحظة مسجلة'}</p>{payment.reviewedAt && <p className="mt-2">تمت المراجعة في {formatDate(payment.reviewedAt)}</p>}</div>{payment.status === 'pending' ? <div className="flex flex-wrap gap-2 md:flex-col"><Button className="h-9 px-3 text-xs" onClick={() => reviewPaymentAction(payment.id, 'approved')} disabled={reviewPayment.isPending} testId={`button-approve-payment-${payment.id}`}><Check className="h-3.5 w-3.5" />اعتماد</Button><Button variant="danger" className="h-9 px-3 text-xs" onClick={() => reviewPaymentAction(payment.id, 'rejected')} disabled={reviewPayment.isPending} testId={`button-reject-payment-${payment.id}`}><X className="h-3.5 w-3.5" />رفض</Button></div> : <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><Clock3 className="h-4 w-4" /> تمت المراجعة</div>}</div>)}</div>}
        </QueryState>
      </Panel>
    </div>
  </>;
}

function WalletCard({ wallet, draft, setDraft, onSave, pending }: { wallet: PaymentWalletSetting; draft: Omit<PaymentWalletSetting, 'wallet'>; setDraft: (next: Partial<Omit<PaymentWalletSetting, 'wallet'>>) => void; onSave: () => void; pending: boolean }) {
  const [uploading, setUploading] = useState(false);
  const uploadLogo = async (file: File) => { setUploading(true); try { const token = localStorage.getItem('fazaah_token'); const response = await fetch('/api/storage/uploads/request-url', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }) }); const upload = await response.json(); if (!response.ok) throw new Error(upload.error || 'تعذر تجهيز الرفع'); const put = await fetch(upload.uploadURL, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file }); if (!put.ok) throw new Error('تعذر رفع الشعار'); setDraft({ logoUrl: upload.objectPath }); } finally { setUploading(false); } };
  return <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.32)] p-4" data-testid={`card-wallet-${wallet.wallet}`}><div className="mb-4 flex items-start justify-between gap-3"><div><p className="font-bold">{draft.displayName || walletNames[wallet.wallet] || wallet.wallet}</p><p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">بطاقة اختيار المحفظة</p></div><label className="flex cursor-pointer items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ isActive: event.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" />مفعلة</label></div><div className="space-y-2.5"><input value={draft.displayName} onChange={(event) => setDraft({ displayName: event.target.value })} placeholder="اسم المحفظة" className="h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs" /><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[hsl(var(--primary)/.35)] p-3 text-xs"><Upload className="h-4 w-4 text-[hsl(var(--primary))]" /><span className="flex-1">{uploading ? 'جاري رفع الشعار...' : 'رفع شعار المحفظة'}</span><input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadLogo(file); }} /></label><input value={draft.logoUrl ?? ''} onChange={(event) => setDraft({ logoUrl: event.target.value || null })} placeholder="أو رابط الشعار /objects/..." dir="ltr" className="h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs" /><input value={draft.description} onChange={(event) => setDraft({ description: event.target.value })} placeholder="وصف مختصر (اختياري)" className="h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs" /><div className="grid grid-cols-2 gap-2"><select value={draft.usage} onChange={(event) => setDraft({ usage: event.target.value as PaymentWalletSetting['usage'] })} className="h-10 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-2 text-xs"><option value="subscriptions">الاشتراكات</option><option value="advertisements">الإعلانات</option><option value="both">الاثنان</option></select><input type="number" value={draft.sortOrder} onChange={(event) => setDraft({ sortOrder: Number(event.target.value) || 0 })} placeholder="الترتيب" className="h-10 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs" /></div><input value={draft.merchantName} onChange={(event) => setDraft({ merchantName: event.target.value })} placeholder="اسم التاجر" className="h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs" /><input value={draft.merchantAccount} onChange={(event) => setDraft({ merchantAccount: event.target.value })} placeholder="رقم أو حساب التاجر" dir="ltr" className="h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs" /><textarea value={draft.instructions} onChange={(event) => setDraft({ instructions: event.target.value })} placeholder="تعليمات التحويل" className="min-h-16 w-full resize-y rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 py-2 text-xs" /><Button className="h-9 w-full text-xs" onClick={onSave} disabled={pending}>{pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}حفظ الإعدادات</Button></div></div>;
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof UsersRound; title: string; description: string }) {
  return <div className="flex flex-col items-center justify-center px-6 py-16 text-center"><div className="mb-4 rounded-2xl bg-[hsl(var(--muted))] p-4 text-[hsl(var(--primary))]"><Icon className="h-6 w-6" /></div><p className="text-sm font-bold">{title}</p><p className="mt-1 max-w-xs text-xs leading-6 text-[hsl(var(--muted-foreground))]">{description}</p></div>;
}

function Router() {
  const [location] = useLocation();
  const hasToken = Boolean(localStorage.getItem('fazaah_token'));
  return <ErrorBoundary resetKey={location}><Shell>{hasToken ? <Switch><Route path="/" component={Overview} /><Route path="/users" component={UsersPage} /><Route path="/providers" component={ProvidersPage} /><Route path="/verification" component={VerificationCenter} /><Route path="/business" component={BusinessPage} /><Route component={NotFound} /></Switch> : <AccessRequired />}</Shell></ErrorBoundary>;
}

function App() {
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem('fazaah_token'));
    return () => setAuthTokenGetter(null);
  }, []);
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
