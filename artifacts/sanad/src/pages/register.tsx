import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister, useListCategories } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, ArrowRight, ArrowLeft, Loader2, UserRound, Wrench } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  phone: z.string().min(9, "رقم الهاتف غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  role: z.enum(["client", "provider"]),
  categoryId: z.coerce.number().optional().nullable(),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  yearsExperience: z.coerce.number().optional().nullable(),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { login: setAuth } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      phone: "",
      password: "",
      role: "client",
    },
  });

  const role = form.watch("role");
  const registerMutation = useRegister();
  const { data: categories } = useListCategories();

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    if (step === 1 && values.role === "provider") {
      setStep(2);
      return;
    }

    const payload = {
      ...values,
      categoryId: values.categoryId || undefined,
      city: values.city || undefined,
      district: values.district || undefined,
      bio: values.bio || undefined,
      yearsExperience: values.yearsExperience || undefined,
    };

    registerMutation.mutate({ data: payload as any }, {
      onSuccess: (res) => {
        setAuth(res.token, res.user as any);
        toast({
          title: "تم التسجيل بنجاح",
          description: "مرحباً بك في منصة سند",
        });
        setLocation("/");
      },
      onError: () => {
        toast({
          title: "خطأ في التسجيل",
          description: "قد يكون رقم الهاتف مستخدماً من قبل",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">إنشاء حساب جديد</h1>
          <p className="text-muted-foreground">
            {step === 1 ? "انضم إلى منصة سند الآن" : "أكمل بياناتك كمزود خدمة"}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 && (
              <>
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>نوع الحساب</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-3">
                          <div 
                            className={`border-2 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${field.value === 'client' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'}`}
                            onClick={() => field.onChange('client')}
                          >
                            <UserRound className="w-6 h-6" />
                            <span className="font-bold text-sm">عميل</span>
                          </div>
                          <div 
                            className={`border-2 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${field.value === 'provider' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'}`}
                            onClick={() => field.onChange('provider')}
                          >
                            <Wrench className="w-6 h-6" />
                            <span className="font-bold text-sm">مزود خدمة</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الكامل</FormLabel>
                      <FormControl>
                        <Input placeholder="محمد عبدلله" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف</FormLabel>
                      <FormControl>
                        <Input placeholder="7xxxxxxxx" type="tel" dir="ltr" className="text-left" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كلمة المرور</FormLabel>
                      <FormControl>
                        <Input placeholder="••••••••" type="password" dir="ltr" className="text-left" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {step === 2 && (
              <>
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مجال الخدمة</FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر مجال عملك" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.icon} {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المدينة</FormLabel>
                        <FormControl>
                          <Input placeholder="صنعاء" {...field} value={field.value || ''} />
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
                        <FormLabel>المنطقة</FormLabel>
                        <FormControl>
                          <Input placeholder="حدة" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="yearsExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>سنوات الخبرة</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نبذة عنك</FormLabel>
                      <FormControl>
                        <Textarea placeholder="صف خبراتك والخدمات التي تقدمها..." className="resize-none" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="flex gap-3 mt-6">
              {step === 2 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-12 w-12 shrink-0 rounded-xl"
                  onClick={() => setStep(1)}
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
              )}
              <Button 
                type="submit" 
                className="flex-1 h-12 text-base font-bold rounded-xl" 
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : step === 1 && role === "provider" ? (
                  <>
                    التالي
                    <ArrowLeft className="w-5 h-5 mr-2" />
                  </>
                ) : (
                  <>
                    تسجيل الحساب
                    <ArrowLeft className="w-5 h-5 mr-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">لديك حساب بالفعل؟ </span>
          <Link href="/login" className="text-primary font-bold hover:underline">
            سجل دخول
          </Link>
        </div>
      </div>
    </div>
  );
}
