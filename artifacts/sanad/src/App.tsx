import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ProtectedRoute } from "@/components/layout/protected-route";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen bg-background text-foreground" dir="rtl">
    <aside className="w-64 bg-card border-l border-border p-4 flex flex-col gap-1">
      <h2 className="text-xl font-bold text-primary mb-6 px-2">إدارة فزعة</h2>
      <a href="/admin" className="px-4 py-2.5 hover:bg-muted rounded-xl transition-colors font-medium text-sm">لوحة التحكم</a>
      <a href="/admin/users" className="px-4 py-2.5 hover:bg-muted rounded-xl transition-colors font-medium text-sm">المستخدمين</a>
      <a href="/admin/providers" className="px-4 py-2.5 hover:bg-muted rounded-xl transition-colors font-medium text-sm">المهنيين</a>
      <a href="/" className="px-4 py-2.5 hover:bg-muted rounded-xl transition-colors font-medium text-sm text-muted-foreground mt-auto">← العودة للتطبيق</a>
    </aside>
    <main className="flex-1 overflow-y-auto">{children}</main>
  </div>
);

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
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
      <Route path="/welcome" component={Welcome} />
      <Route path="/auth/phone" component={AuthPhone} />
      <Route path="/auth/email" component={AuthEmail} />
      <Route path="/auth/forgot-password" component={ForgotPassword} />
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
          <Emergency />
        </ProtectedRoute>
      </Route>
      <Route path="/request/new">
        <ProtectedRoute>
          <NewRequest />
        </ProtectedRoute>
      </Route>
      <Route path="/my-requests">
        <ProtectedRoute>
          <AppShell><MyRequests /></AppShell>
        </ProtectedRoute>
      </Route>
      <Route path="/my-requests/:id">
        <ProtectedRoute>
          <RequestDetail />
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
          <Chat />
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
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/verify">
        <ProtectedRoute allowedRoles={['provider']}>
          <ProviderVerify />
        </ProtectedRoute>
      </Route>

      <Route><NotFound /></Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div dir="rtl" className="min-h-[100dvh] bg-background text-foreground font-sans">
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </div>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
