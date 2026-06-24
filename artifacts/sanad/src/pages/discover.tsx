import { Link } from "wouter";
import { motion } from "framer-motion";
import { TrendingUp, Star, Sparkles, Tag, ChevronLeft, Award } from "lucide-react";
import { useListProviders, useListCategories } from "@workspace/api-client-react";
import { ProviderCard } from "@/components/provider-card";

const OFFERS = [
  { id: 1, title: "خصم ٢٠٪ على خدمات الكهرباء", sub: "صالح حتى نهاية الشهر", color: "from-yellow-500 to-amber-600", icon: "⚡" },
  { id: 2, title: "أول طلب مجاناً للمستخدمين الجدد", sub: "للمستخدمين الجدد فقط", color: "from-emerald-600 to-green-700", icon: "🎁" },
  { id: 3, title: "خدمة تنظيف شاملة بسعر مميز", sub: "احجز الآن واحصل على خصم", color: "from-blue-500 to-blue-700", icon: "🧹" },
];

const BADGES = [
  { icon: "🏆", label: "الأعلى تقييماً", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { icon: "⚡", label: "الأسرع استجابة", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { icon: "✅", label: "موثق رسمياً", color: "bg-green-100 text-green-800 border-green-200" },
  { icon: "🆕", label: "جديد على المنصة", color: "bg-purple-100 text-purple-800 border-purple-200" },
];

export default function Discover() {
  const { data: categories } = useListCategories();
  const { data: topRated } = useListProviders({ limit: 6 }, { query: { queryKey: ['discover-top'] } });
  const { data: newest } = useListProviders({ limit: 4, sortBy: 'experience' }, { query: { queryKey: ['discover-new'] } });

  return (
    <div className="pb-24" dir="rtl">
      {/* Header */}
      <div className="bg-primary px-4 pt-6 pb-8 rounded-b-[2.5rem]">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-bold text-white">اكتشف</h1>
          </div>
          <p className="text-white/60 text-sm">أفضل المهنيين والخدمات في منطقتك</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-8">
        {/* Offers Banner */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Tag className="w-4 h-4 text-accent" />
              عروض مميزة
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {OFFERS.map((offer) => (
              <div
                key={offer.id}
                className={`min-w-[220px] rounded-2xl bg-gradient-to-br ${offer.color} p-4 text-white shrink-0`}
              >
                <div className="text-3xl mb-2">{offer.icon}</div>
                <p className="font-bold text-sm leading-tight mb-1">{offer.title}</p>
                <p className="text-white/70 text-xs">{offer.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            شارات التميز
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {BADGES.map((b) => (
              <div key={b.label} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 border text-sm font-medium ${b.color}`}>
                <span>{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>
        </section>

        {/* Most Requested Services */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              الأكثر طلباً
            </h2>
            <Link href="/providers" className="text-primary text-xs font-medium flex items-center gap-1">
              عرض الكل <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(categories ?? []).slice(0, 6).map((cat) => (
              <Link key={cat.id} href={`/providers?categoryId=${cat.id}`}>
                <div className="rounded-2xl bg-card border border-border p-3 flex flex-col items-center gap-2 hover:border-primary/40 transition-colors cursor-pointer">
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-medium text-center line-clamp-1">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Top Rated */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Star className="w-4 h-4 text-accent fill-accent" />
              الأعلى تقييماً
            </h2>
            <Link href="/providers?sortBy=rating" className="text-primary text-xs font-medium flex items-center gap-1">
              عرض الكل <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {(topRated?.providers ?? []).slice(0, 4).map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        </section>

        {/* Newest Providers */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              مهنيون جدد
            </h2>
          </div>
          <div className="space-y-3">
            {(newest?.providers ?? []).slice(0, 4).map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
