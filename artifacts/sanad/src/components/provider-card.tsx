import { ProviderSummary } from "@workspace/api-client-react/src/generated/api.schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, CheckCircle2, Briefcase, Zap } from "lucide-react";
import { Link } from "wouter";

interface ProviderCardProps {
  provider: ProviderSummary;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  return (
    <Link href={`/providers/${provider.id}`}>
      <Card className="cursor-pointer overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Avatar + availability dot */}
            <div className="relative shrink-0">
              <Avatar className="w-14 h-14 border-2 border-background shadow-sm">
                <AvatarImage src={provider.avatarUrl || ""} alt={provider.name} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                  {provider.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {provider.isAvailable && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Name + rating row */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="font-bold text-sm truncate">
                    {provider.name}
                  </h3>
                  {provider.isVerified && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 px-2 py-0.5 rounded-lg text-xs font-bold shrink-0">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  {provider.rating.toFixed(1)}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{provider.district}، {provider.city}</span>
                {provider.distanceKm != null && (
                  <span className="shrink-0 text-muted-foreground/60">
                    ({provider.distanceKm.toFixed(1)} كم)
                  </span>
                )}
              </div>

              {/* Badges row */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className="text-xs font-normal bg-primary/5 text-primary border-primary/10 px-2 py-0"
                >
                  <span className="ml-1">{provider.categoryIcon}</span>
                  {provider.categoryName}
                </Badge>

                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                  <Briefcase className="w-3 h-3" />
                  {provider.completedJobs} مشروع
                </div>

                {provider.isAvailable && (
                  <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full">
                    <Zap className="w-3 h-3 fill-green-500" />
                    متاح الآن
                  </div>
                )}

                {provider.isVerified && (
                  <div className="text-xs text-green-700 dark:text-green-400 font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    موثق
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
