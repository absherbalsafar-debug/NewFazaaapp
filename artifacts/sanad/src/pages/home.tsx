import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetHomeFeed, useListProviders } from "@workspace/api-client-react";
import { ProviderCard } from "@/components/provider-card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import {
  Search, MapPin, Bell, ChevronLeft, ChevronRight,
  AlertTriangle, Zap, Star, TrendingUp, Shield, Clock
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const BANNERS = [
  {
    id: 1,
    title: "مهنيون موثقون",
    subtitle: "جميع المهنيين تم التحقق من هوياتهم",
    color: "from-blue-900 to-blue-700",
    icon: Shield,
    emoji: "🏅",
  },
  {
    id: 2,
    title: "خدمات الطوارئ",
    subtitle: "استجابة فورية على مدار الساعة",
    color: "from-red-700 to-orange-600",
    icon: Zap,
    emoji: "⚡",
  },
  {
    id: 3,
    title: "أسعار شفافة",
    subtitle: "تعرف على السعر قبل تأكيد الطلب",
    color: "from-purple-900 to-purple-700",
    icon: Star,
    emoji: "💎",
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [bannerIndex, setBannerIndex] = useState(0);

  const { data: feed, isLoading } = useGetHomeFeed({ lat: undefined, lng: undefined });
  const { data: topProviders } = useListProviders(
    { limit: 6, sortBy: 'rating' },
    { query: { queryKey: ['home-top'] } }
  );
  const { data: recentProviders } = useListProviders(
    { limit: 4 },
    { query: { queryKey: ['home-recent'] } }
  );

  useEffect(() => {
    const t = setInterval(() => setBannerIndex(i => (i + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  function handleSearch() {
    if (searchQuery.trim()) navigate(`/providers?search=${encodeURIComponent(searchQuery)}`);
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "صباح الخير";
    if (h < 17) return "مساء الخير";
    return "مساء النور";
  };

  return (
    <div className="pb-24 min-h-[100dvh] bg-background" dir="rtl">
      {/* ── Header ── */}
      <div className="gradient-primary px-4 pt-6 pb-16 relative overflow-hidden">
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute -top-8 -right-4 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute top-10 left-10 w-16 h-16 rounded-full bg-accent/20" />

        <div className="relative max-w-lg mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-white/20">
                <AvatarImage src={user?.avatarUrl || ""} />
                <AvatarFallback className="bg-white/20 text-white font-bold text-sm">
                  {user?.name?.charAt(0) ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white/65 text-xs">{greeting()}</p>
                <p className="text-white font-bold text-sm leading-tight">{user?.name ?? "مرحباً"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/notifications">
                <button className="relative w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 transition-colors flex items-center justify-center">
                  <Bell className="w-4.5 h-4.5 text-white" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border border-primary" />
                </button>
              </Link>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 mb-4">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            <span className="text-white/75 text-xs font-medium">{user?.city ?? "صنعاء، اليمن"}</span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث عن خدمة أو مهني..."
              className="h-12 pr-11 pl-4 rounded-2xl bg-white border-0 shadow-lg text-sm font-medium"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            {searchQuery && (
              <button
                onClick={handleSearch}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-primary text-white px-3 h-8 rounded-xl text-xs font-bold"
              >
                بحث
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-[-2.5rem] space-y-6">
        {/* ── Quick Actions ── */}
        <div className="flex gap-2.5 relative z-10">
          <div className="flex-1 bg-white rounded-2xl p-3 border border-border card-shadow flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground leading-none mb-0.5">موقعك الحالي</p>
              <p className="text-xs font-bold truncate">{user?.city ?? "صنعاء"}</p>
            </div>
          </div>
          <Link href="/emergency">
            <motion.div
              whileTap={{ scale: 0.96 }}
              className="bg-red-500 rounded-2xl px-4 flex items-center gap-2 card-shadow cursor-pointer hover:bg-red-600 transition-colors"
            >
              <AlertTriangle className="w-4.5 h-4.5 text-white" />
              <span className="text-white font-bold text-xs whitespace-nowrap">طوارئ</span>
            </motion.div>
          </Link>
        </div>

        {/* ── Banners ── */}
        <div className="relative overflow-hidden rounded-2xl h-28 card-shadow-lg">
          <AnimatePresence mode="wait">
            {BANNERS.map((b, i) =>
              i === bannerIndex ? (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                  className={`absolute inset-0 bg-gradient-to-l ${b.color} p-5 flex items-center justify-between`}
                >
                  <div>
                    <p className="text-white font-extrabold text-lg leading-tight">{b.title}</p>
                    <p className="text-white/75 text-xs mt-1">{b.subtitle}</p>
                    <Link href="/providers">
                      <button className="mt-2.5 text-xs bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1 rounded-full transition-colors">
                        اكتشف الآن
                      </button>
                    </Link>
                  </div>
                  <span className="text-5xl opacity-80">{b.emoji}</span>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>
          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setBannerIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === bannerIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
              />
            ))}
          </div>
          {/* Arrows */}
          <button
            onClick={() => setBannerIndex(i => (i - 1 + BANNERS.length) % BANNERS.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setBannerIndex(i => (i + 1) % BANNERS.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, j) => <div key={j} className="aspect-square bg-muted animate-pulse rounded-2xl" />)}
                </div>
              </div>
            ))}
          </div>
        ) : feed ? (
          <>
            {/* ── Stats ── */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: "مهني نشط", value: `${feed.topRatedProviders.length}+`, color: "bg-blue-50 text-blue-700", emoji: "👷" },
                { label: "فئة خدمة", value: `${feed.categories.length}`, color: "bg-amber-50 text-amber-700", emoji: "🛠" },
                { label: "طلب اليوم", value: "٢٤+", color: "bg-green-50 text-green-700", emoji: "📋" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-3 border border-border card-shadow text-center">
                  <span className="text-2xl">{s.emoji}</span>
                  <p className="text-base font-extrabold text-foreground mt-1">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* ── Categories ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm text-foreground">التصنيفات</h2>
                <Link href="/providers" className="text-xs text-primary font-semibold flex items-center gap-0.5">
                  عرض الكل <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {feed.categories.slice(0, 8).map(cat => (
                  <Link key={cat.id} href={`/providers?categoryId=${cat.id}`}>
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className="w-full aspect-square rounded-2xl bg-white border border-border card-shadow flex items-center justify-center text-2xl group-hover:border-primary/40 group-hover:bg-primary/5 transition-all">
                        {cat.icon}
                      </div>
                      <span className="text-[10px] text-center font-medium text-muted-foreground line-clamp-1">{cat.name}</span>
                    </motion.div>
                  </Link>
                ))}
              </div>
              {feed.categories.length > 8 && (
                <div className="grid grid-cols-4 gap-2.5 mt-2.5">
                  {feed.categories.slice(8, 12).map(cat => (
                    <Link key={cat.id} href={`/providers?categoryId=${cat.id}`}>
                      <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
                        <div className="w-full aspect-square rounded-2xl bg-white border border-border flex items-center justify-center text-2xl group-hover:border-primary/40 transition-all card-shadow">
                          {cat.icon}
                        </div>
                        <span className="text-[10px] text-center font-medium text-muted-foreground line-clamp-1">{cat.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* ── Emergency quick access ── */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-accent" />
                <h2 className="font-bold text-sm text-foreground">خدمات الطوارئ</h2>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {[
                  { icon: "⚡", label: "كهرباء", catId: 2 },
                  { icon: "🔧", label: "سباكة", catId: 1 },
                  { icon: "🔒", label: "أقفال", catId: 4 },
                  { icon: "❄️", label: "تكييف", catId: 8 },
                  { icon: "🚿", label: "حمامات", catId: 3 },
                ].map(s => (
                  <Link key={s.catId} href={`/providers?categoryId=${s.catId}`}>
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      className="shrink-0 flex flex-col items-center gap-1.5 bg-white border border-border rounded-2xl px-4 py-3 hover:border-primary/30 transition-colors cursor-pointer card-shadow"
                    >
                      <span className="text-xl">{s.icon}</span>
                      <span className="text-xs font-medium whitespace-nowrap text-foreground">{s.label}</span>
                    </motion.div>
                  </Link>
                ))}
                <Link href="/emergency">
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="shrink-0 flex flex-col items-center gap-1.5 bg-red-500 rounded-2xl px-4 py-3 cursor-pointer card-shadow"
                  >
                    <AlertTriangle className="w-5 h-5 text-white" />
                    <span className="text-xs font-bold text-white whitespace-nowrap">الآن!</span>
                  </motion.div>
                </Link>
              </div>
            </section>

            {/* ── Top Rated Providers ── */}
            {feed.topRatedProviders.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Star className="w-4 h-4 text-accent fill-accent/80" />
                    الأعلى تقييماً
                  </h2>
                  <Link href="/providers?sortBy=rating" className="text-xs text-primary font-semibold flex items-center gap-0.5">
                    عرض الكل <ChevronLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                  {feed.topRatedProviders.slice(0, 6).map(p => (
                    <ProviderCard key={p.id} provider={p} compact />
                  ))}
                </div>
              </section>
            )}

            {/* ── Most Requested ── */}
            {(topProviders?.providers ?? []).length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    الأكثر طلباً
                  </h2>
                  <Link href="/providers" className="text-xs text-primary font-semibold flex items-center gap-0.5">
                    عرض الكل <ChevronLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {(topProviders?.providers ?? []).slice(0, 3).map(p => (
                    <ProviderCard key={p.id} provider={p} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Nearby ── */}
            {feed.nearbyProviders.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    قريب منك
                  </h2>
                </div>
                <div className="space-y-3">
                  {feed.nearbyProviders.slice(0, 3).map(p => (
                    <ProviderCard key={p.id} provider={p} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Special Offers ── */}
            <section className="bg-gradient-to-l from-amber-500 to-yellow-400 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-white text-base">عروض خاصة</p>
                <p className="text-white/80 text-xs mt-0.5">خصومات حصرية على خدمات مختارة</p>
                <Link href="/discover">
                  <button className="mt-2 text-xs bg-white text-yellow-600 font-bold px-3 py-1 rounded-full hover:bg-yellow-50 transition-colors">
                    اكتشف العروض
                  </button>
                </Link>
              </div>
              <span className="text-5xl">🎁</span>
            </section>

            {/* ── Recent ── */}
            {(recentProviders?.providers ?? []).length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    مهنيون جدد
                  </h2>
                  <Link href="/providers" className="text-xs text-primary font-semibold flex items-center gap-0.5">
                    عرض الكل <ChevronLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {(recentProviders?.providers ?? []).slice(0, 3).map(p => (
                    <ProviderCard key={p.id} provider={p} />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
