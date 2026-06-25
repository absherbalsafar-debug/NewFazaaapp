import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetProvider, useCreateRequest } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Calendar, MapPin, AlignLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const requestSchema = z.object({
  serviceType: z.string().min(2, "الرجاء تحديد نوع الخدمة"),
  description: z.string().min(10, "الرجاء كتابة وصف تفصيلي للمشكلة"),
  city: z.string().min(2, "الرجاء تحديد المدينة"),
  district: z.string().min(2, "الرجاء تحديد المنطقة"),
  isImmediate: z.boolean().default(true),
  scheduledAt: z.string().optional().nullable(),
});

export default function NewRequest() {
  const searchParams = new URLSearchParams(window.location.search);
  const providerId = searchParams.get("providerId") ? parseInt(searchParams.get("providerId")!) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: provider } = useGetProvider(providerId, {
    query: { enabled: !!providerId, queryKey: ['provider', providerId] }
  });

  const createRequestMutation = useCreateRequest();

  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      serviceType: "",
      description: "",
      city: "صنعاء", // Defaulting for MVP
      district: "",
      isImmediate: true,
      scheduledAt: "",
    },
  });

  const isImmediate = form.watch("isImmediate");

  const onSubmit = (values: z.infer<typeof requestSchema>) => {
    if (!providerId) return;

    createRequestMutation.mutate({
      data: {
        providerId,
        serviceType: values.serviceType,
        description: values.description,
        city: values.city,
        district: values.district,
        isImmediate: values.isImmediate,
        scheduledAt: values.isImmediate ? undefined : values.scheduledAt,
      }
    }, {
      onSuccess: () => {
        setIsSuccess(true);
      },
      onError: () => {
        toast({
          title: "حدث خطأ",
          description: "لم نتمكن من إرسال الطلب، الرجاء المحاولة مرة أخرى",
          variant: "destructive"
        });
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">تم إرسال الطلب بنجاح!</h1>
        <p className="text-muted-foreground mb-8">سيقوم المهني بمراجعة طلبك والرد عليك في أقرب وقت ممكن.</p>
        
        <Link href="/my-requests" className="w-full max-w-xs">
          <Button className="w-full h-14 rounded-xl text-base font-bold bg-primary text-primary-foreground">
            متابعة طلباتي
          </Button>
        </Link>
        <Link href="/" className="w-full max-w-xs mt-3">
          <Button variant="ghost" className="w-full">
            العودة للرئيسية
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-background min-h-screen">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => window.history.back()}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <h1 className="font-bold">طلب خدمة جديدة</h1>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        {provider && (
          <div className="bg-muted/40 p-4 rounded-2xl flex items-center gap-4 mb-8">
            <Avatar className="w-14 h-14 border border-border">
              <AvatarImage src={provider.avatarUrl || ""} />
              <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">طلب خدمة من:</p>
              <p className="font-bold">{provider.name}</p>
              <p className="text-xs text-primary">{provider.categoryName}</p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h2 className="font-bold flex items-center gap-2">
                <AlignLeft className="w-5 h-5 text-primary" />
                تفاصيل الخدمة
              </h2>
              
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع الخدمة المطلوبة</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: إصلاح تسريب مياه، تأسيس كهرباء..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وصف المشكلة</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="اشرح المشكلة بالتفصيل لمساعدة المهني على فهم المطلوب..." 
                        className="min-h-[120px] resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h2 className="font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                الموقع
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدينة</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المنطقة / الحي</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: حدة، شعوب..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h2 className="font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                الموعد
              </h2>
              
              <FormField
                control={form.control}
                name="isImmediate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border p-4 bg-muted/20">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-bold">أحتاج الخدمة الآن</FormLabel>
                      <p className="text-xs text-muted-foreground">أريد من المهني الحضور في أسرع وقت ممكن</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {!isImmediate && (
                <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>موعد الزيارة المقترح</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-base font-bold rounded-xl mt-8" 
              disabled={createRequestMutation.isPending || !providerId}
            >
              {createRequestMutation.isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                "تأكيد وإرسال الطلب"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
