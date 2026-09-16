import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetHomeFeed, useListFeaturedAdvertisements } from "@/lib/api-client-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import {
  Search,
  MapPin,
  Bell,
  ChevronLeft,
  ChevronDown,
  SlidersHorizontal,
  AlertTriangle,
  Zap,
  Star,
  UserRound,
  Construction,
  BrickWall,
  Droplets,
  Snowflake,
  Code2,
  PaintRoller,
  Wrench,
  Truck,
  House,
  Sparkles,
  History,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/brand-logo";

function CategoryIcon({ name }: { name: string }) {
  const normalized = name.toLowerCase();
  if (normalized.includes("كهرب") || normalized.includes("electric")) return <Zap />;
  if (normalized.includes("بناء") || normalized.includes("build")) return <BrickWall />;
  if (normalized.includes("مقاول") || normalized.includes("contract")) return <Wrench />;
  if (normalized.includes("مهندس") || normalized.includes("engineer")) return <Construction />;
  if (normalized.includes("سباك") || normalized.includes("plumb")) return <Droplets />;
  if (normalized.includes("تكييف") || normalized.includes("ac")) return <Snowflake />;
  if (normalized.includes("برمج") || normalized.includes("develop")) return <Code2 />;
  if (normalized.includes("صباغ") || normalized.includes("paint")) return <PaintRoller />;
  if (normalized.includes("نقل") || normalized.includes("transport")) return <Truck />;
  if (normalized.includes("منزل") || normalized.includes("house")) return <House />;
  return <Wrench />;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: feed, isLoading } = useGetHomeFeed({ lat: undefined, lng: undefined });
  const { data: featuredAds = [] } = useListFeaturedAdvertisements();

  const categories = feed?.categories?.slice(0, 8) ?? [];
  const recentRequests = feed?.recentRequests ?? [];

  function handleSearch() {
    if (searchQuery.trim()) navigate(`/providers?search=${encodeURIComponent(searchQuery)}`);
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f8fa] pb-24 text-[#0e2f62]" dir="rtl">
      <header className="relative border-b border-[#0e2f62]/[0.06] bg-white px-4 pb-2 pt-3">
        <div className="mx-auto flex h-[74px] max-w-lg items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full bg-[#f3f6fa] px-3 py-2 text-[11px] font-bold text-[#0e2f62]"
            aria-label="اختيار المدينة"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            <span>{user?.city ?? "صنعاء"}</span>
            <MapPin className="h-4 w-4 text-[#0e2f62]" />
          </button>

          <Link href="/" className="absolute left-1/2 top-2 -translate-x-1/2">
            <BrandLogo className="h-[76px] w-[126px] object-contain" />
          </Link>

          <div className="flex items-center gap-4 text-[#0e2f62]">
            <Link href="/notifications" className="relative">
              <Bell className="h-[22px] w-[22px]" strokeWidth={1.7} />
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#f5b916]" />
            </Link>
            <Link href="/profile">
              <UserRound className="h-[22px] w-[22px]" strokeWidth={1.7} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-5 px-4 pt-4">
        <section className="relative h-[178px] overflow-hidden rounded-[25px] bg-[#eef2f6] shadow-[0_10px_25px_rgba(14,47,98,0.08)]">
          <img
            src="/assets/fazaah-worker-hero.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-card via-card/80 to-transparent" />
          <div className="relative z-10 flex h-full max-w-[62%] flex-col justify-center px-5">
            <p className="text-[11px] font-semibold text-[#60728a]">احتياجك .. نوصلك بالشخص المناسب</p>
            <h1 className="mt-1 text-[25px] font-black leading-[1.25] text-[#0e2f62]">
              تحتاج شيء؟
              <span className="relative block w-fit text-[#0e2f62] after:absolute after:-bottom-1 after:right-0 after:h-1 after:w-16 after:rounded-full after:bg-[#f5b916]">
                فزعت لك!
              </span>
            </h1>
            <p className="mt-2 text-[10px] leading-5 text-[#60728a]">ابحث عن المهني المناسب لإنجاز احتياجك بسهولة.</p>
          </div>
        </section>

        <div className="relative flex h-[54px] items-center rounded-full border border-[#dfe5ec] bg-white p-1.5 shadow-[0_8px_20px_rgba(14,47,98,0.06)]">
          <button
            type="button"
            onClick={handleSearch}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5b916] text-[#0e2f62] transition-transform active:scale-95"
            aria-label="بحث"
          >
            <Search className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <Input
            type="text"
            placeholder="ما الذي تحتاجه؟ ابحث عن الخدمة أو المهني..."
            className="h-11 border-0 bg-transparent px-3 text-right text-xs font-medium shadow-none focus-visible:ring-0"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleSearch()}
          />
          <button type="button" onClick={() => navigate("/providers")} className="px-2 text-[#0e2f62]" aria-label="تصفية البحث">
            <SlidersHorizontal className="h-5 w-5" strokeWidth={1.7} />
          </button>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <Link href="/providers" className="flex items-center gap-1 text-[11px] font-bold text-[#35577f]">
              عرض الكل
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="h-1 w-7 rounded-full bg-[#f5b916]" />
              <h2 className="text-[15px] font-black text-[#0e2f62]">اختر نوع الخدمة</h2>
            </div>
          </div>

          {categories.length > 0 ? (
            <div className="grid grid-cols-4 gap-2.5">
              {categories.map((category) => (
                <Link key={category.id} href={`/providers?categoryId=${category.id}`}>
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="flex h-[94px] flex-col items-center justify-center gap-2 rounded-[16px] border border-[#e5e9ee] bg-white text-[#0e2f62] shadow-[0_4px_12px_rgba(14,47,98,0.04)] transition-colors hover:border-[#f5b916]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4f7fa] text-[#0e2f62]">
                      <CategoryIcon name={`${category.name} ${category.icon ?? ""}`} />
                    </div>
                    <span className="text-[10px] font-bold">{category.name}</span>
                    <ChevronLeft className="h-3 w-3 -rotate-90 text-[#8da0b5]" />
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white px-4 py-5 text-center text-xs text-[#708198]">
              {isLoading ? "جاري تحميل أنواع الخدمات..." : "لا توجد أنواع خدمات مضافة حالياً"}
            </p>
          )}
          {isLoading && (
            <p className="mt-2 text-center text-[10px] text-[#8da0b5]">نجهز لك خدمات قريبة منك...</p>
          )}
        </section>

        <section className="relative h-[104px] overflow-hidden rounded-[20px] bg-[#fff5db] shadow-[0_8px_18px_rgba(14,47,98,0.05)]">
          <img
            src="/assets/fazaah-worker-hero.png"
            alt=""
            className="absolute left-0 top-0 h-full w-[53%] object-cover object-bottom"
          />
          <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent to-[#fff5db]" />
          <div className="relative z-10 flex h-full flex-col justify-center px-5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#f5b916]" />
              <h2 className="text-[15px] font-black text-[#0e2f62]">محتاج مساعدة أكثر؟</h2>
            </div>
            <p className="mt-1 text-[10px] text-[#67758a]">تصفح جميع المهنيين والخدمات المتاحة.</p>
            <Link href="/providers" className="mt-2 w-fit rounded-full bg-[#f5b916] px-4 py-1.5 text-[10px] font-black text-[#0e2f62]">
              تصفح الكل
            </Link>
          </div>
        </section>

        {featuredAds.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-[#f5b916]/15 px-2 py-1 text-[10px] font-bold text-[#8c6b00]">إعلانات مدفوعة</span>
              <h2 className="text-[15px] font-black text-[#0e2f62]">مهنيون مميزون</h2>
            </div>
            <div className="space-y-2.5">
              {featuredAds.slice(0, 3).map((ad) => (
                <Link key={ad.id} href={`/providers/${ad.providerId}`}>
                  <div className="rounded-[18px] border border-[#eadba7] bg-[#fffdf4] px-4 py-3 shadow-[0_4px_12px_rgba(14,47,98,0.04)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#0e2f62]">{ad.title}</p>
                        <p className="mt-1 truncate text-[11px] text-[#708198]">{ad.providerName || "مهني موصى به"} · {ad.city}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#f5b916] px-2 py-1 text-[9px] font-black text-[#0e2f62]">إعلان</span>
                    </div>
                    {ad.description && <p className="mt-2 line-clamp-1 text-[11px] text-[#60728a]">{ad.description}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <Link href="/my-requests" className="flex items-center gap-1 text-[11px] font-bold text-[#35577f]">
              عرض الكل
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-[#0e2f62]" />
              <h2 className="text-[15px] font-black text-[#0e2f62]">خدماتك الأخيرة</h2>
            </div>
          </div>
          {recentRequests.length ? (
            <div className="space-y-2.5">
              {recentRequests.map((request) => (
                <Link key={request.id} href={`/my-requests/${request.id}`}>
                  <div className="flex items-center gap-3 rounded-[18px] border border-[#e5e9ee] bg-white px-4 py-3 shadow-[0_4px_12px_rgba(14,47,98,0.04)]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f4f7fa] text-xs font-black text-[#0e2f62]">
                      {request.isImmediate ? "عاجل" : "طلب"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-[#0e2f62]">{request.serviceType}</p>
                      <p className="mt-1 truncate text-[11px] text-[#708198]">
                        {user?.role === "provider" ? request.clientName : request.providerName || "بانتظار المهني"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#f5b916]/15 px-2 py-1 text-[10px] font-bold text-[#8c6b00]">
                      {request.status === "pending" ? "قيد الانتظار" :
                        request.status === "accepted" ? "مقبول" :
                        request.status === "completed" ? "مكتمل" :
                        request.status === "cancelled" ? "ملغي" : "قيد المتابعة"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/providers")}
              className="flex w-full items-center justify-between rounded-[18px] border border-dashed border-[#cbd5e1] bg-white px-4 py-4 text-right"
            >
              <span>
                <span className="block text-sm font-black text-[#0e2f62]">لا توجد طلبات محفوظة</span>
                <span className="mt-1 block text-[11px] text-[#708198]">تصفح المهنيين وأنشئ طلب خدمة حقيقياً.</span>
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5b916] text-[#0e2f62]">
                <ChevronLeft className="h-5 w-5" />
              </span>
            </button>
          )}
        </section>
      </main>
    </div>
  );
}