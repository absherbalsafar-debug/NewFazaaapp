import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowUpLeft,
  BarChart3,
  BadgeCheck,
  Ban,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronLeft,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Filter,
  LayoutDashboard,
  LoaderCircle,
  MapPin,
  Menu,
  Megaphone,
  Phone,
  ReceiptText,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  UserCheck,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';
import {
  useGetAdminStats,
  useGetServiceStats,
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

const queryClient = new QueryClient();

type PaymentWallet = 'jeeb' | 'floosk' | 'jawali' | 'cash' | 'one_cash' | 'hasib' | 'easy';

type PaymentWalletSetting = {
  wallet: PaymentWallet;
  merchantName: string;
  merchantAccount: string;
  instructions: string;
  isActive: boolean;
};

const navItems = [
  { href: '/', label: 'نظرة عامة', caption: 'صحة المنصة', icon: LayoutDashboard },
  { href: '/users', label: 'المستخدمون', caption: 'الحسابات والنشاط', icon: UsersRound },
  { href: '/providers', label: 'المهنيون', caption: 'التوثيق والاعتماد', icon: BadgeCheck },
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

function Overview() {
  const statsQuery = useGetAdminStats({ query: { queryKey: ['sanad-admin', 'stats'], refetchOnWindowFocus: false } });
  const servicesQuery = useGetServiceStats({ query: { queryKey: ['sanad-admin', 'services'], refetchOnWindowFocus: false } });
  const stats = statsQuery.data;
  const services = servicesQuery.data ?? [];
  const cards = stats ? [
    { label: 'إجمالي المستخدمين', value: stats.totalUsers, note: `${formatNumber(stats.activeToday)} نشطون اليوم`, icon: UsersRound, tone: 'teal' },
    { label: 'المهنيون المسجلون', value: stats.totalProviders, note: `${formatNumber(stats.pendingProviders)} بانتظار التوثيق`, icon: BriefcaseBusiness, tone: 'gold' },
    { label: 'طلبات الخدمة', value: stats.totalRequests, note: `${formatNumber(stats.requestsThisWeek)} هذا الأسبوع`, icon: BarChart3, tone: 'blue' },
    { label: 'طلبات مكتملة', value: stats.completedRequests, note: `${stats.totalRequests ? Math.round((stats.completedRequests / stats.totalRequests) * 100) : 0}% من الإجمالي`, icon: CheckCircle2, tone: 'green' },
  ] : [];
  const maxRequests = Math.max(...services.map((service) => service.requestCount), 1);
  return (
    <>
      <PageHeader eyebrow="ملخص اليوم" title="نظرة عامة على فزعة" description="صورة تشغيلية سريعة تساعدك على اتخاذ القرار في الوقت المناسب." action={<Button variant="secondary" onClick={() => { void statsQuery.refetch(); void servicesQuery.refetch(); }} disabled={statsQuery.isFetching || servicesQuery.isFetching} testId="button-refresh-overview"><RefreshCw className={`h-4 w-4 ${statsQuery.isFetching ? 'animate-spin' : ''}`} /> تحديث البيانات</Button>} />
      <QueryState loading={statsQuery.isLoading || servicesQuery.isLoading} error={statsQuery.error || servicesQuery.error} onRetry={() => { void statsQuery.refetch(); void servicesQuery.refetch(); }}>
        {stats && (
          <div className="animate-rise space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => {
                const Icon = card.icon;
                const iconClass = card.tone === 'gold' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : card.tone === 'green' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : card.tone === 'blue' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' : 'bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]';
                return <div className="panel rounded-2xl p-5" key={card.label} data-testid={`card-stat-${card.label}`}>
                  <div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">{card.label}</p><p className="mt-3 font-[var(--font-display)] text-3xl font-bold tracking-tight">{formatNumber(card.value)}</p></div><div className={`rounded-xl p-3 ${iconClass}`}><Icon className="h-5 w-5" /></div></div>
                  <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted-foreground))]"><span className="status-dot bg-emerald-500" />{card.note}</div>
                </div>;
              })}
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
              <Panel title="حركة الخدمات" subtitle="مقارنة الطلبات مع قاعدة المهنيين حسب التصنيف" icon={BarChart3} action={<Badge tone="teal">{formatNumber(services.reduce((sum, item) => sum + item.requestCount, 0))} طلب</Badge>}>
                <QueryState loading={servicesQuery.isLoading} error={servicesQuery.error} onRetry={() => { void servicesQuery.refetch(); }}>
                  {services.length === 0 ? <div className="flex min-h-[300px] items-center justify-center p-6 text-sm text-[hsl(var(--muted-foreground))]">لا توجد إحصائيات خدمات متاحة بعد.</div> : <div className="space-y-5 p-5 md:p-6">
                    {services.map((service, index) => <div key={service.categoryName} className="animate-rise" style={{ animationDelay: `${index * 45}ms` }} data-testid={`row-service-${index}`}>
                      <div className="mb-2 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[hsl(var(--muted))] text-xs font-bold text-[hsl(var(--primary))]">{String(index + 1).padStart(2, '0')}</span><span className="text-sm font-semibold">{service.categoryName}</span></div><div className="flex items-center gap-4 text-[11px] text-[hsl(var(--muted-foreground))]"><span>{formatNumber(service.providerCount)} مهني</span><b className="text-[hsl(var(--foreground))]">{formatNumber(service.requestCount)} طلب</b></div></div>
                      <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]"><div className="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-700" style={{ width: `${Math.max((service.requestCount / maxRequests) * 100, 4)}%` }} /></div>
                    </div>)}
                  </div>}
                </QueryState>
              </Panel>
              <Panel title="مؤشرات المنصة" subtitle="قراءة مختصرة لأهم نقاط المتابعة" icon={Activity}>
                <div className="divide-y divide-[hsl(var(--border))]">
                  <div className="flex items-center justify-between gap-3 p-5"><div className="flex items-center gap-3"><div className="rounded-lg bg-amber-50 p-2 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><ShieldAlert className="h-4 w-4" /></div><div><p className="text-sm font-semibold">توثيق المهنيين</p><p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">طلبات تحتاج مراجعة</p></div></div><span className="font-[var(--font-display)] text-xl font-bold">{formatNumber(stats.pendingProviders)}</span></div>
                  <div className="flex items-center justify-between gap-3 p-5"><div className="flex items-center gap-3"><div className="rounded-lg bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><UserCheck className="h-4 w-4" /></div><div><p className="text-sm font-semibold">نشاط اليوم</p><p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">مستخدمون تفاعلوا اليوم</p></div></div><span className="font-[var(--font-display)] text-xl font-bold">{formatNumber(stats.activeToday)}</span></div>
                  <div className="flex items-center justify-between gap-3 p-5"><div className="flex items-center gap-3"><div className="rounded-lg bg-sky-50 p-2 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"><TrendingUpIcon /></div><div><p className="text-sm font-semibold">طلبات الشهر</p><p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">إجمالي الشهر الحالي</p></div></div><span className="font-[var(--font-display)] text-xl font-bold">{formatNumber(stats.requestsThisMonth)}</span></div>
                </div>
                <div className="m-5 rounded-xl bg-[hsl(var(--primary)/.06)] p-4 text-xs leading-6 text-[hsl(var(--primary))]">تذكير: راجع طلبات التوثيق والمدفوعات اليدوية يومياً لضمان تجربة موثوقة للعملاء.</div>
              </Panel>
            </div>
          </div>
        )}
      </QueryState>
    </>
  );
}

function TrendingUpIcon() {
  return <ArrowUpLeft className="h-4 w-4" />;
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
  const toast = useToast();
  const providersQuery = useListAdminUsers({ role: 'provider' }, { query: { queryKey: ['sanad-admin', 'providers'], refetchOnWindowFocus: false } });
  const verifyProvider = useVerifyProvider();
  const providers = useMemo(() => (providersQuery.data?.users ?? []).filter((provider) => filter === 'all' || (filter === 'verified' ? provider.isVerified : !provider.isVerified)), [providersQuery.data?.users, filter]);
  const verify = (id: number, isVerified: boolean) => {
    verifyProvider.mutate({ id, data: { isVerified } }, {
      onSuccess: () => { toast.toast({ title: isVerified ? 'تم توثيق المهني' : 'تم إلغاء التوثيق' }); void providersQuery.refetch(); },
      onError: (error) => toast.toast({ title: 'تعذر تحديث التوثيق', description: shortError(error), variant: 'destructive' }),
    });
  };
  return <>
    <PageHeader eyebrow="الثقة والجودة" title="توثيق المهنيين" description="راجع بيانات المهنيين وحافظ على أن يكون الدليل موثوقاً لكل عميل." action={<Button variant="secondary" onClick={() => { void providersQuery.refetch(); }} disabled={providersQuery.isFetching} testId="button-refresh-providers"><RefreshCw className={`h-4 w-4 ${providersQuery.isFetching ? 'animate-spin' : ''}`} /> تحديث</Button>} />
    <Panel className="animate-rise" title="قائمة المهنيين" subtitle={providersQuery.data ? `${formatNumber(providersQuery.data.total)} مهني مسجل` : 'مراجعة حالات التوثيق'} icon={BadgeCheck} action={<div className="flex rounded-xl bg-[hsl(var(--muted))] p-1"><button onClick={() => setFilter('all')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === 'all' ? 'bg-[hsl(var(--card))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid="button-filter-providers-all">الكل</button><button onClick={() => setFilter('pending')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === 'pending' ? 'bg-[hsl(var(--card))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid="button-filter-providers-pending">بانتظار التوثيق</button><button onClick={() => setFilter('verified')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === 'verified' ? 'bg-[hsl(var(--card))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid="button-filter-providers-verified">موثق</button></div>}>
      <QueryState loading={providersQuery.isLoading} error={providersQuery.error} onRetry={() => { void providersQuery.refetch(); }}>
        {providers.length === 0 ? <EmptyState icon={BriefcaseBusiness} title="لا يوجد مهنيون في هذا العرض" description="ستظهر طلبات المهنيين الجدد هنا عند التسجيل." /> : <div className="scrollbar-thin overflow-x-auto"><table className="w-full min-w-[800px] text-right text-sm"><thead className="bg-[hsl(var(--muted)/.55)] text-xs text-[hsl(var(--muted-foreground))]"><tr><th className="px-5 py-3 font-semibold">المهني</th><th className="px-5 py-3 font-semibold">الخدمة والمدينة</th><th className="px-5 py-3 font-semibold">الأداء</th><th className="px-5 py-3 font-semibold">التوثيق</th><th className="px-5 py-3 font-semibold">الإجراء</th></tr></thead><tbody className="divide-y divide-[hsl(var(--border))]">{providers.map((provider) => <tr key={provider.id} className="transition hover:bg-[hsl(var(--muted)/.35)]" data-testid={`row-provider-${provider.id}`}><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--primary)/.1)] font-bold text-[hsl(var(--primary))]">{provider.name.slice(0, 1)}</div><div><p className="font-semibold">{provider.name}</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]" dir="ltr">{provider.phone}</p></div></div></td><td className="px-5 py-4"><p className="font-medium">{provider.categoryName || '—'}</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{provider.city || '—'}</p></td><td className="px-5 py-4"><div className="flex items-center gap-1 text-sm font-semibold text-amber-600"><Star className="h-4 w-4 fill-current" />{provider.rating?.toFixed(1) || '—'}</div><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{formatNumber(provider.completedJobs)} أعمال مكتملة</p></td><td className="px-5 py-4">{provider.isVerified ? <Badge tone="good"><ShieldCheck className="h-3.5 w-3.5" />موثق</Badge> : <Badge tone="warn"><ShieldAlert className="h-3.5 w-3.5" />بانتظار التوثيق</Badge>}</td><td className="px-5 py-4"><Button variant={provider.isVerified ? 'danger' : 'secondary'} className="h-9 px-3 text-xs" onClick={() => verify(provider.id, !provider.isVerified)} disabled={verifyProvider.isPending} testId={`${provider.isVerified ? 'button-unverify' : 'button-verify'}-provider-${provider.id}`}>{verifyProvider.isPending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : provider.isVerified ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}{provider.isVerified ? 'إلغاء التوثيق' : 'توثيق المهني'}</Button></td></tr>)}</tbody></table></div>}
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
  const [drafts, setDrafts] = useState<Record<string, Omit<PaymentWalletSetting, 'wallet'>>>({});
  useEffect(() => {
    if (walletsQuery.data) setDrafts(Object.fromEntries(walletsQuery.data.map((wallet: PaymentWalletSetting) => [wallet.wallet, { merchantName: wallet.merchantName, merchantAccount: wallet.merchantAccount, instructions: wallet.instructions, isActive: wallet.isActive }])));
  }, [walletsQuery.data]);
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
      <Panel title="محافظ الدفع" subtitle="تظهر البيانات النشطة للمهني أثناء الدفع اليدوي للاشتراك." icon={WalletCards}>
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
  return <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/.32)] p-4" data-testid={`card-wallet-${wallet.wallet}`}><div className="mb-4 flex items-start justify-between gap-3"><div><p className="font-bold">{walletNames[wallet.wallet] || wallet.wallet}</p><p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">إعدادات الحساب التجاري</p></div><label className="flex cursor-pointer items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft({ isActive: event.target.checked })} data-testid={`input-wallet-active-${wallet.wallet}`} className="h-4 w-4 accent-[hsl(var(--primary))]" />مفعلة</label></div><div className="space-y-2.5"><input value={draft.merchantName} onChange={(event) => setDraft({ merchantName: event.target.value })} placeholder="اسم التاجر" data-testid={`input-wallet-name-${wallet.wallet}`} className="h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs outline-none focus:border-[hsl(var(--primary))]" /><input value={draft.merchantAccount} onChange={(event) => setDraft({ merchantAccount: event.target.value })} placeholder="رقم أو حساب التاجر" dir="ltr" data-testid={`input-wallet-account-${wallet.wallet}`} className="h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 text-xs outline-none focus:border-[hsl(var(--primary))]" /><textarea value={draft.instructions} onChange={(event) => setDraft({ instructions: event.target.value })} placeholder="تعليمات التحويل" data-testid={`input-wallet-instructions-${wallet.wallet}`} className="min-h-16 w-full resize-y rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 py-2 text-xs outline-none focus:border-[hsl(var(--primary))]" /><Button className="h-9 w-full text-xs" onClick={onSave} disabled={pending} testId={`button-save-wallet-${wallet.wallet}`}>{pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}حفظ الإعدادات</Button></div></div>;
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof UsersRound; title: string; description: string }) {
  return <div className="flex flex-col items-center justify-center px-6 py-16 text-center"><div className="mb-4 rounded-2xl bg-[hsl(var(--muted))] p-4 text-[hsl(var(--primary))]"><Icon className="h-6 w-6" /></div><p className="text-sm font-bold">{title}</p><p className="mt-1 max-w-xs text-xs leading-6 text-[hsl(var(--muted-foreground))]">{description}</p></div>;
}

function Router() {
  const [location] = useLocation();
  const hasToken = Boolean(localStorage.getItem('fazaah_token'));
  return <ErrorBoundary resetKey={location}><Shell>{hasToken ? <Switch><Route path="/" component={Overview} /><Route path="/users" component={UsersPage} /><Route path="/providers" component={ProvidersPage} /><Route path="/business" component={BusinessPage} /><Route component={NotFound} /></Switch> : <AccessRequired />}</Shell></ErrorBoundary>;
}

function App() {
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem('fazaah_token'));
    return () => setAuthTokenGetter(null);
  }, []);
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;