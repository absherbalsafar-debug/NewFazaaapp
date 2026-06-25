import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

const loginSchema = z.object({
  phone: z.string().min(9, "رقم الهاتف غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login: setAuth } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const loginMutation = useLogin();

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        setAuth(res.token, res.user as any);
        toast({
          title: "مرحباً بك مجدداً",
          description: "تم تسجيل الدخول بنجاح",
        });
        setLocation("/");
      },
      onError: () => {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: "تأكد من رقم الهاتف وكلمة المرور",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">تسجيل الدخول</h1>
          <p className="text-muted-foreground">أدخل بياناتك للوصول إلى حسابك</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <div className="flex items-center justify-between">
                    <FormLabel>كلمة المرور</FormLabel>
                    <Link href="/forgot-password" className="text-xs text-primary font-medium hover:underline">
                      نسيت كلمة المرور؟
                    </Link>
                  </div>
                  <FormControl>
                    <Input placeholder="••••••••" type="password" dir="ltr" className="text-left" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-bold rounded-xl mt-6" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  دخول
                  <ArrowRight className="w-5 h-5 mr-2" />
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">ليس لديك حساب؟ </span>
          <Link href="/register" className="text-primary font-bold hover:underline">
            سجل الآن
          </Link>
        </div>
      </div>
    </div>
  );
}
