import { ProviderSummary } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, CheckCircle2, Briefcase, MessageSquare, Phone } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

interface ProviderCardProps {
  provider: ProviderSummary;
  compact?: boolean;
}

export function ProviderCard({ provider, compact = false }: ProviderCardProps) {
  const whatsappNumber: string | null = null;

  if (compact) {
    return (
      <Link href={`/providers/${provider.id}`}>
        <div className="flex-shrink-0 w-44 bg-white rounded-2xl p-3 border border-border card-shadow cursor-pointer hover:border-primary/30 hover:card-shadow-lg transition-all">
          <div className="relative mb-2.5">
            <Avatar className="w-full h-32 rounded-xl">
              <AvatarImage src={provider.avatarUrl || ""} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold rounded-xl">
                {provider.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {provider.isAvailable && (
              <span className="absolute top-2 right-2 flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                متاح
              </span>
            )}
            {provider.isVerified && (
              <span className="absolute top-2 left-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </span>
            )}
          </div>
          <p className="font-bold text-sm truncate mb-0.5">{provider.name}</p>
          <p className="text-xs text-muted-foreground truncate mb-1.5">{provider.categoryName}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5 text-amber-500">
              <Star className="w-3 h-3 fill-amber-500" />
              <span className="text-xs font-bold text-foreground">{provider.rating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-muted-foreground">{provider.completedJobs} مشروع</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      className="bg-white rounded-2xl border border-border card-shadow overflow-hidden hover:border-primary/25 hover:card-shadow-lg transition-all duration-200"
    >
      <Link href={`/providers/${provider.id}`}>
        <div className="p-4">
          <div className="flex gap-3.5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar className="w-16 h-16 rounded-2xl">
                <AvatarImage src={provider.avatarUrl || ""} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold rounded-2xl">
                  {provider.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {provider.isAvailable && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Name + verified + rating */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="font-bold text-sm truncate text-foreground">{provider.name}</h3>
                  {provider.isVerified && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 fill-accent/10" />
                  )}
                </div>
                <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-100 text-amber-600 px-1.5 py-0.5 rounded-lg text-xs font-bold shrink-0">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {provider.rating.toFixed(1)}
                </div>
              </div>

              {/* Category + specialty */}
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-sm">{provider.categoryIcon}</span>
                <span className="text-xs text-muted-foreground font-medium">{provider.categoryName}</span>
              </div>

              {/* Location + jobs */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{provider.city}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3 shrink-0" />
                  <span>{provider.completedJobs} مشروع</span>
                </div>
                {provider.yearsExperience > 0 && (
                  <span>{provider.yearsExperience} سنوات</span>
                )}
              </div>
            </div>
          </div>

          {/* Tags row */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {provider.isVerified && (
              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" />
                موثق
              </span>
            )}
            {provider.isAvailable && (
              <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full">
                ⚡ متاح الآن
              </span>
            )}
            {provider.distanceKm != null && (
              <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                📍 {provider.distanceKm.toFixed(1)} كم
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Action buttons */}
      <div className="flex border-t border-border divide-x divide-border rtl:divide-x-reverse">
        <Link href={`/request/new?providerId=${provider.id}`} className="flex-1">
          <button className="w-full py-2.5 text-xs font-bold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5">
            طلب خدمة
          </button>
        </Link>
        <Link href={`/messages/${provider.id}`} className="flex-none">
          <button className="px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        </Link>
        {whatsappNumber && (
          <a
            href={`https://wa.me/967${whatsappNumber}?text=مرحباً، وجدتك على منصة فزعة`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-none"
            onClick={e => e.stopPropagation()}
          >
            <button className="px-4 py-2.5 text-xs text-green-600 hover:bg-green-50 transition-colors">
              <Phone className="w-3.5 h-3.5" />
            </button>
          </a>
        )}
      </div>
    </motion.div>
  );
}
