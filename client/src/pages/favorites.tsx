import { useListFavorites } from "@/lib/api-client-react";
import { ProviderCard } from "@/components/provider-card";
import { Heart, Loader2 } from "lucide-react";

export default function Favorites() {
  const { data: favorites, isLoading } = useListFavorites({
    query: { queryKey: ['favorites'] }
  });

  return (
    <div className="pb-24 bg-background min-h-screen">
      <div className="bg-primary pt-6 pb-8 px-4 rounded-b-[2rem] shadow-sm">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-primary-foreground">المفضلة</h1>
          <p className="text-primary-foreground/80 mt-1 text-sm">المهنيين الذين قمت بحفظهم</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !favorites || favorites.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-muted-foreground opacity-50" />
            </div>
            <h3 className="font-bold text-lg mb-2">لا يوجد مهنيين مفضلين</h3>
            <p className="text-muted-foreground text-sm">
              قم بإضافة المهنيين إلى المفضلة للرجوع إليهم لاحقاً
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
