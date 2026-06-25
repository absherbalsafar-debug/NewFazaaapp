import { useState } from "react";
import { useListProviders, useListCategories } from "@workspace/api-client-react";
import { ProviderCard } from "@/components/provider-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X, CheckCircle2, Zap } from "lucide-react";
import { CitySelector } from "@/components/city-selector";
import { motion, AnimatePresence } from "framer-motion";

export default function Providers() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("categoryId") ? parseInt(searchParams.get("categoryId")!) : null;
  const initialSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState<number | null>(initialCategory);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCity, setFilterCity] = useState("");
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);

  const { data: categories } = useListCategories();
  const { data: providersPage, isLoading } = useListProviders({
    categoryId: activeCategory ?? undefined,
    search: search || undefined,
    city: filterCity || undefined,
  }, { query: { queryKey: ['providers', activeCategory, search, filterCity, filterAvailable] } });

  const providers = providersPage?.providers ?? [];
  const filtered = providers
    .filter(p => !filterVerified || p.isVerified)
    .filter(p => !filterAvailable || p.isAvailable);

  const hasActiveFilters = filterCity || filterAvailable || filterVerified;

  return (
    <div className="pb-28 min-h-[100dvh] bg-background" dir="rtl">
      {/* Search Header */}
      <div className="bg-primary pt-5 pb-5 px-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-white font-bold text-lg mb-3">استعرض المهنيين</h1>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="ابحث عن مهني أو خدمة..."
                className="h-11 pr-10 pl-4 rounded-xl bg-background border-0 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative ${
                showFilters || hasActiveFilters ? 'bg-accent text-primary' : 'bg-white/20 text-white'
              }`}
            >
              <SlidersHorizontal className="w-4.5 h-4.5" />
              {hasActiveFilters && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-card border-b border-border"
          >
            <div className="max-w-md mx-auto px-4 py-4 space-y-3">
              <CitySelector value={filterCity} onChange={setFilterCity} placeholder="جميع المحافظات" />
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterAvailable(!filterAvailable)}
                  className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border-2 text-sm font-medium transition-colors ${
                    filterAvailable ? 'border-green-500 bg-green-50 text-green-700' : 'border-border text-foreground'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${filterAvailable ? 'fill-green-500 text-green-500' : ''}`} />
                  متاح الآن
                </button>
                <button
                  onClick={() => setFilterVerified(!filterVerified)}
                  className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border-2 text-sm font-medium transition-colors ${
                    filterVerified ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${filterVerified ? 'fill-primary/20 text-primary' : ''}`} />
                  موثقون فقط
                </button>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={() => { setFilterCity(""); setFilterAvailable(false); setFilterVerified(false); }}
                  className="w-full h-9 rounded-xl border border-destructive/30 text-destructive text-sm flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  إزالة الفلاتر
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-md mx-auto px-4 mt-4">
        {/* Categories scroll */}
        <div className="flex overflow-x-auto pb-3 -mx-4 px-4 gap-2 scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={`h-9 px-4 rounded-full shrink-0 text-sm font-medium border transition-colors ${
              activeCategory === null ? 'bg-primary text-white border-primary' : 'bg-card border-border text-foreground'
            }`}
          >
            الكل
          </button>
          {(categories ?? []).map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`h-9 px-3 rounded-full shrink-0 text-sm font-medium border transition-colors flex items-center gap-1.5 ${
                activeCategory === cat.id ? 'bg-primary text-white border-primary' : 'bg-card border-border text-foreground'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-3 mt-1">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "جاري البحث..." : `${filtered.length} مهني`}
          </p>
          {hasActiveFilters && (
            <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
              فلاتر مفعّلة
            </span>
          )}
        </div>

        {/* Provider list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-bold text-lg mb-2">لا توجد نتائج</h3>
            <p className="text-muted-foreground text-sm">جرب تغيير معايير البحث</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => <ProviderCard key={p.id} provider={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
