import { useRoute, Link } from "wouter";
import { useGetProvider, useGetProviderReviews, useGetProviderPortfolio, useAddFavorite, useRemoveFavorite } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, CheckCircle2, Phone, MessageCircle, Heart, ArrowRight, ShieldCheck, Briefcase, Clock, CalendarDays } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function ProviderDetail() {
  const [, params] = useRoute("/providers/:id");
  const id = parseInt(params?.id || "0");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: provider, isLoading, refetch } = useGetProvider(id, {
    query: { enabled: !!id, queryKey: ['provider', id] }
  });

  const { data: reviews } = useGetProviderReviews(id, {
    query: { enabled: !!id, queryKey: ['reviews', id] }
  });

  const { data: portfolio } = useGetProviderPortfolio(id, {
    query: { enabled: !!id, queryKey: ['portfolio', id] }
  });

  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const toggleFavorite = () => {
    if (!user) {
      toast({ title: "يجب تسجيل الدخول أولاً", variant: "destructive" });
      return;
    }
    
    if (provider?.isFavorited) {
      removeFavorite.mutate({ providerId: id }, { onSuccess: () => refetch() });
    } else {
      addFavorite.mutate({ providerId: id }, { onSuccess: () => refetch() });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">جاري التحميل...</div>;
  }

  if (!provider) return <div className="p-8 text-center">لم يتم العثور على المهني</div>;

  return (
    <div className="pb-24 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <Link href="/providers">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="font-bold">الملف الشخصي</h1>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleFavorite}>
          <Heart className={`w-5 h-5 ${provider.isFavorited ? "fill-destructive text-destructive" : ""}`} />
        </Button>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Avatar className="w-28 h-28 border-4 border-background shadow-md">
              <AvatarImage src={provider.avatarUrl || ""} alt={provider.name} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {provider.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {provider.isVerified && (
              <div className="absolute bottom-1 right-1 bg-background rounded-full p-0.5">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <h2 className="text-2xl font-bold">{provider.name}</h2>
            {provider.isVerified && (
              <div className="flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                موثق
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 text-sm">
              <span className="ml-1.5 text-base">{provider.categoryIcon}</span>
              {provider.categoryName}
            </Badge>
            {provider.isAvailable && (
              <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">
                متاح الآن ⚡
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{provider.city}، {provider.district}</span>
            </div>
            <div className="w-1 h-1 bg-muted-foreground/30 rounded-full"></div>
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 font-medium">
              <Star className="w-4 h-4 fill-current" />
              <span>{provider.rating.toFixed(1)} ({provider.reviewCount})</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          <Card className="bg-muted/50 border-0 shadow-none">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Briefcase className="w-6 h-6 text-primary mb-2 opacity-80" />
              <div className="font-bold text-lg">{provider.completedJobs}</div>
              <div className="text-xs text-muted-foreground mt-1">مهمة منجزة</div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50 border-0 shadow-none">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Clock className="w-6 h-6 text-primary mb-2 opacity-80" />
              <div className="font-bold text-lg">{provider.yearsExperience}</div>
              <div className="text-xs text-muted-foreground mt-1">سنوات خبرة</div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50 border-0 shadow-none">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-6 h-6 text-green-500 mb-2 opacity-80" />
              <div className="font-bold text-lg text-green-600 dark:text-green-400">متاح</div>
              <div className="text-xs text-muted-foreground mt-1">للعمل فوراً</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <Link href={`/request/new?providerId=${provider.id}`} className="flex-1">
            <Button className="w-full h-12 text-base font-bold rounded-xl bg-accent text-primary hover:bg-accent/90">
              <CalendarDays className="w-5 h-5 ml-2" />
              طلب خدمة
            </Button>
          </Link>
          <Button variant="outline" className="h-12 w-12 shrink-0 rounded-xl border-primary text-primary hover:bg-primary/5">
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button variant="outline" className="h-12 w-12 shrink-0 rounded-xl border-primary text-primary hover:bg-primary/5">
            <Phone className="w-5 h-5" />
          </Button>
        </div>

        <div className="mt-10 space-y-8">
          {/* Bio */}
          {provider.bio && (
            <section>
              <h3 className="font-bold text-lg mb-3">نبذة عن المهني</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{provider.bio}</p>
            </section>
          )}

          {/* Portfolio */}
          {portfolio && portfolio.length > 0 && (
            <section>
              <h3 className="font-bold text-lg mb-3">معرض الأعمال</h3>
              <div className="grid grid-cols-2 gap-3">
                {portfolio.map((item) => (
                  <div key={item.id} className="rounded-2xl overflow-hidden bg-muted relative group">
                    <div className="aspect-square">
                      <img src={item.imageUrl} alt={item.description || ""} className="w-full h-full object-cover" />
                    </div>
                    {item.description && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-white text-xs font-medium line-clamp-2">{item.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* No portfolio placeholder */}
          {(!portfolio || portfolio.length === 0) && (
            <section>
              <h3 className="font-bold text-lg mb-3">معرض الأعمال</h3>
              <div className="grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-2xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center">
                    <span className="text-2xl opacity-20">🖼</span>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">لم يُضف المهني صور أعمال بعد</p>
            </section>
          )}

          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <section>
              <h3 className="font-bold text-lg mb-4">التقييمات والآراء</h3>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-muted/30 p-4 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={review.clientAvatarUrl || ""} />
                          <AvatarFallback>{review.clientName?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-sm">{review.clientName || "عميل"}</span>
                      </div>
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-current" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
