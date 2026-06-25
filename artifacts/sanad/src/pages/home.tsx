import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetHomeFeed, useListProviders, useListRequests } from "@workspace/api-client-react";
import { ProviderCard } from "@/components/provider-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  Search, MapPin, Sparkles, ChevronLeft, AlertTriangle,
  Bell, Zap, TrendingUp, Star, ShieldCheck, Clock, CheckCircle2, PlayCircle
} from "lucide-react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const { data: feed, isLoading } = useGetHomeFeed({ lat: undefined, lng: undefined });
  const { data: mostRequested } = useListProviders(
    { limit: 4, sortBy: 'experience' },
    { query: { queryKey: ['home-most-requested'] } }
  );

  const { data: myRequests } = useListRequests(
    { role: user?.role === 'provider' ? 'provider' : 'client' },
    { query: { queryKey: ['home-requests', user?.id], enabled: !!user } }
  );

  const recentRequests = (myRequests ?? []).slice(0, 3);

  const requestStatusMap: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: "قيد الانتظار", color: "text-yellow-600 bg-yellow-50", icon: Clock },
    accepted: { label: "تم القبول", color: "text-blue-600 bg-blue-50", icon: CheckCircle2 },
    in_progress: { label: "جاري التنفيذ", color: "text-purple-600 bg-purple-50", icon: PlayCircle },
    completed: { label: "مكتمل", color: "text-green-600 bg-green-50", icon: CheckCircle2 },
    cancelled: { label: "ملغي", color: "text-gray-500 bg-gray-50", icon: Clock },
    rejected: { label: "مرفوض", color: "text-red-600 bg-red-50", icon: Clock },
  };

  function handleSearch() {
    if (searchQuery.trim()) navigate(`/providers?search=${encodeURIComponent(searchQuery)}`);
  }

  return (
    <div className="pb-28 min-h-[100dvh] bg-background" dir="rtl">
      {/* ── Hero ── */}
      <section className="bg-primary px-4 pt-5 pb-14 relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute top-5 right-0 w-24 h-24 rounded-full bg-accent/10" />

        <div className="max-w-md mx-auto relative">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white/60 text-xs">مرحباً،</p>
              <p className="text-white font-bold text-base">{user?.name ?? 'أهلاً بك'} 👋</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/notifications">
                <button className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
                </button>
              </Link>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-white mb-4 leading-snug">
            عن ماذا تبحث<br />اليوم؟
          </h1>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="كهربائي، سباك، نجار..."
              className="h-13 pr-12 pl-4 rounded-2xl bg-background border-0 shadow-xl text-base"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            {searchQuery && (
              <button
                onClick={handleSearch}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-primary text-white px-3 h-9 rounded-xl text-sm font-medium"
              >
                بحث
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-md mx-auto px-4">
        {/* ── Location + Emergency Card ── */}
        <div className="mt-[-1.75rem] relative z-10 flex gap-3">
          <div className="flex-1 bg-card rounded-2xl p-3 shadow-md border border-border flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">موقعك</p>
              <p className="text-sm font-bold truncate">{user?.city ?? 'صنعاء'}</p>
            </div>
          </div>
          <Link href="/emergency">
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="bg-red-600 rounded-2xl px-4 flex items-center gap-2 shadow-md cursor-pointer"
            >
              <AlertTriangle className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-sm">طوارئ</span>
            </motion.div>
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-8 space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-5 bg-muted animate-pulse rounded w-1/3" />
                <div className="grid grid-cols-4 gap-3">
                  {[...Array(4)].map((_, j) => <div key={j} className="aspect-square bg-muted animate-pulse rounded-2xl" />)}
                </div>
              </div>
            ))}
          </div>
        ) : feed ? (
          <div className="mt-6 space-y-8">
            {/* ── Stats strip ── */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "مهني متاح", value: feed.topRatedProviders.length + "+", icon: ShieldCheck, color: "text-green-600 bg-green-50" },
                { label: "خدمة متاحة", value: feed.categories.length.toString(), icon: Sparkles, color: "text-accent bg-accent/10" },
                { label: "طلب اليوم", value: "٢٤+", icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
              ].map(stat => (
                <div key={stat.label} className="bg-card rounded-2xl p-3 border border-border text-center">
                  <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-2`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-extrabold text-primary">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* ── Categories ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold">التصنيفات</h2>
                <Link href="/providers" className="text-xs text-primary font-medium flex items-center gap-1">
                  عرض الكل <ChevronLeft className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {feed.categories.slice(0, 8).map((cat) => (
                  <Link key={cat.id} href={`/providers?categoryId=${cat.id}`}>
                    <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
                      <div className="w-full aspect-square rounded-2xl bg-secondary flex items-center justify-center text-2xl border border-border/50 group-hover:bg-primary group-hover:border-primary transition-all shadow-sm">
                        {cat.icon}
                      </div>
                      <span className="text-[10px] text-center font-medium text-muted-foreground line-clamp-1">{cat.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
              {feed.categories.length > 8 && (
                <div className="grid grid-cols-4 gap-2.5 mt-2.5">
                  {feed.categories.slice(8, 12).map((cat) => (
                    <Link key={cat.id} href={`/providers?categoryId=${cat.id}`}>
                      <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
                        <div className="w-full aspect-square rounded-2xl bg-secondary flex items-center justify-center text-2xl border border-border/50 group-hover:bg-primary transition-all shadow-sm">
                          {cat.icon}
                        </div>
                        <span className="text-[10px] text-center font-medium text-muted-foreground line-clamp-1">{cat.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* ── Emergency Quick Services ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  خدمات الطوارئ
                </h2>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {[
                  { icon: "⚡", label: "كهرباء", catId: 2 },
                  { icon: "🔧", label: "سباكة", catId: 1 },
                  { icon: "🔒", label: "أقفال", catId: 4 },
                  { icon: "❄️", label: "تكييف", catId: 8 },
                ].map(s => (
                  <Link key={s.catId} href={`/providers?categoryId=${s.catId}`}>
                    <div className="shrink-0 flex flex-col items-center gap-1.5 bg-card border border-border rounded-2xl px-5 py-3 hover:border-primary/40 transition-colors cursor-pointer">
                      <span className="text-xl">{s.icon}</span>
                      <span className="text-xs font-medium whitespace-nowrap">{s.label}</span>
                    </div>
                  </Link>
                ))}
                <Link href="/emergency">
                  <div className="shrink-0 flex flex-col items-center gap-1.5 bg-red-600 rounded-2xl px-5 py-3 cursor-pointer">
                    <AlertTriangle className="w-5 h-5 text-white" />
                    <span className="text-xs font-medium text-white whitespace-nowrap">الآن!</span>
                  </div>
                </Link>
              </div>
            </section>

            {/* ── Top Rated ── */}
            {feed.topRatedProviders.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    الأعلى تقييماً
                  </h2>
                  <Link href="/providers?sortBy=rating" className="text-xs text-primary font-medium flex items-center gap-1">
                    عرض الكل <ChevronLeft className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {feed.topRatedProviders.slice(0, 3).map(p => (
                    <ProviderCard key={p.id} provider={p} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Most Requested ── */}
            {(mostRequested?.providers ?? []).length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    الأكثر طلباً
                  </h2>
                  <Link href="/discover" className="text-xs text-primary font-medium flex items-center gap-1">
                    عرض الكل <ChevronLeft className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {(mostRequested?.providers ?? []).slice(0, 3).map(p => (
                    <ProviderCard key={p.id} provider={p} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Nearby ── */}
            {feed.nearbyProviders.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    بالقرب منك
                  </h2>
                </div>
                <div className="space-y-3">
                  {feed.nearbyProviders.slice(0, 3).map(p => (
                    <ProviderCard key={p.id} provider={p} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Recent Requests ── */}
            {recentRequests.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    آخر طلباتك
                  </h2>
                  <Link href="/my-requests" className="text-xs text-primary font-medium flex items-center gap-1">
                    عرض الكل <ChevronLeft className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {recentRequests.map(req => {
                    const st = requestStatusMap[req.status] ?? requestStatusMap.pending;
                    const StatusIcon = st.icon;
                    return (
                      <Link key={req.id} href={`/my-requests/${req.id}`}>
                        <div className="bg-card border border-border rounded-2xl p-3.5 flex items-center gap-3 hover:border-primary/30 transition-colors cursor-pointer">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${st.color}`}>
                            <StatusIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{(req as any).title ?? (req as any).serviceType ?? 'طلب خدمة'}</p>
                            <p className="text-xs text-muted-foreground">{(req as any).providerName ?? 'جاري البحث عن مهني'}</p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${st.color}`}>
                            {st.label}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
