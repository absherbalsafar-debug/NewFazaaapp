import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { BottomNav } from "@/components/layout/bottom-nav";
import { CallManager } from "@/components/call-manager";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { PageTransition } from "@/components/layout/page-transition";

// Auth Pages
import Welcome from "@/pages/welcome";
import AuthPhone from "@/pages/auth-phone";
import AuthEmail from "@/pages/auth-email";
import ForgotPassword from "@/pages/forgot-password";

// App Pages
import Home from "@/pages/home";
import Discover from "@/pages/discover";
import Providers from "@/pages/providers";
import ProviderDetail from "@/pages/provider-detail";
import NewRequest from "@/pages/new-request";
import MyRequests from "@/pages/my-requests";
import RequestDetail from "@/pages/request-detail";
import Favorites from "@/pages/favorites";
import Messages from "@/pages/messages";
import Chat from "@/pages/chat";
import Call from "@/pages/call";
import Notifications from "@/pages/notifications";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import Emergency from "@/pages/emergency";
import ProviderVerify from "@/pages/provider-verify";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminProviders from "@/pages/admin/providers";
import ProviderDashboard from "@/pages/provider-dashboard";
import Earnings from "@/pages/earnings";
import Wallet from "@/pages/wallet";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="premium-surface flex min-h-screen bg-background text-foreground" dir="rtl">
    <aside className="w-64 border-l border-border bg-card/90 p-4 shadow-[0_0_40px_rgba(14,47,98,0.06)] backdrop-blur-xl">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-primary shadow-sm">
          <span className="text-lg font-black">ف</span>
        </div>
        <div>
          <h2 className="text-base font-black text-primary">إدارة فزعة</h2>
          <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">لوحة التحكم المركزية</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        <a href="/admin" className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-primary/8 hover:text-primary">لوحة التحكم</a>
        <a href="/admin/users" className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-primary/8 hover:text-primary">المستخدمين</a>
        <a href="/admin/providers" className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-primary/8 hover:text-primary">المهنيين</a>
      </nav>
      <a href="/" className="mt-auto block rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-primary">← العودة للتطبيق</a>
    </aside>
      <main className="app-stage min-w-0 flex-1 overflow-y-auto">
      <PageTransition>{children}</PageTransition>
    </main>
  </div>
);

function AppShell({ children, showNav = true }: { children: React.ReactNode; showNav?: boolean }) {
  return (
    <>
      <main className={`app-stage premium-surface ${showNav ? "min-h-[100dvh] pb-20" : "min-h-[100dvh]"}`}>
        <PageTransition>{children}</PageTransition>
      </main>
      {showNav && <BottomNav />}
    </>
  );
}

function RoleHome() {
  const { user } = useAuth();
  return user?.role === "provider" ? <ProviderDashboard /> : <Home />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center animate-pulse">
            <span className="text-2xl font-extrabold text-primary">ف</span>
          </div>
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* ── Auth Routes (public) ── */}
      <Route path="/welcome"><PageTransition><Welcome /></PageTransition></Route>
      <Route path="/auth/phone"><PageTransition><AuthPhone /></PageTransition></Route>
      <Route path="/auth/email"><PageTransition><AuthEmail /></PageTransition></Route>
      <Route path="/auth/forgot-password"><PageTransition><ForgotPassword /></PageTransition></Route>
      {/* Legacy redirects */}
      <Route path="/login"><Redirect to="/auth/email" /></Route>
      <Route path="/register"><Redirect to="/welcome" /></Route>

      {/* ── Admin Routes ── */}
      <Route path="/admin">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout><AdminDashboard /></AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout><AdminUsers /></AdminLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/admin/providers">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout><AdminProviders /></AdminLayout>
        </ProtectedRoute>
      </Route>

      {/* ── Protected App Routes ── */}
      <Route path="/">
        <ProtectedRoute>
          <AppShell><RoleHome /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/provider-dashboard">
        <ProtectedRoute allowedRoles={['provider']}>
          <AppShell><ProviderDashboard /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/discover">
        <ProtectedRoute>
          <AppShell><Discover /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/providers">
        <ProtectedRoute>
          <AppShell><Providers /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/providers/:id">
        <ProtectedRoute>
          <AppShell><ProviderDetail /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/emergency">
        <ProtectedRoute>
          <AppShell showNav={false}><Emergency /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/request/new">
        <ProtectedRoute>
          <AppShell showNav={false}><NewRequest /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/my-requests">
        <ProtectedRoute>
          <AppShell><MyRequests /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/my-requests/:id">
        <ProtectedRoute>
          <AppShell showNav={false}><RequestDetail /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/favorites">
        <ProtectedRoute>
          <AppShell><Favorites /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/messages">
        <ProtectedRoute>
          <AppShell><Messages /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/messages/:id">
        <ProtectedRoute>
          <AppShell showNav={false}><Chat /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/call/:id">
        <ProtectedRoute>
          <AppShell showNav={false}><Call /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/notifications">
        <ProtectedRoute>
          <AppShell><Notifications /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <AppShell><Profile /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <AppShell showNav={false}><Settings /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/earnings">
        <ProtectedRoute allowedRoles={['provider']}>
          <AppShell><Earnings /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/wallet">
        <ProtectedRoute allowedRoles={['client']}>
          <AppShell><Wallet /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/privacy">
        <AppShell showNav={false}><Privacy /></AppShell>
      </Route>
      <Route path="/terms">
        <AppShell showNav={false}><Terms /></AppShell>
      </Route>
      <Route path="/verify">
        <ProtectedRoute allowedRoles={['provider']}>
          <AppShell showNav={false}><ProviderVerify /></AppShell>
        </ProtectedRoute>
      </Route>

      <Route><NotFound /></Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="fazaah-theme">
        <AuthProvider>
          <TooltipProvider>
            <div dir="rtl" className="min-h-[100dvh] bg-background text-foreground font-sans">
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
                <CallManager />
              </WouterRouter>
            </div>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
