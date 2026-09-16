import { useGetAdminStats, useGetServiceStats } from "@/lib/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, ClipboardList, CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const { data: stats, isLoading: isLoadingStats } = useGetAdminStats({
    query: { queryKey: ['adminStats'] }
  });

  const { data: serviceStats, isLoading: isLoadingServices } = useGetServiceStats({
    query: { queryKey: ['serviceStats'] }
  });

  if (isLoadingStats || isLoadingServices) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;
  }

  if (!stats) return null;

  const statCards = [
    { title: "إجمالي المستخدمين", value: stats.totalUsers, icon: Users, color: "text-blue-600" },
    { title: "مزودي الخدمة", value: stats.totalProviders, icon: Briefcase, color: "text-amber-600" },
    { title: "العملاء", value: stats.totalClients, icon: Users, color: "text-indigo-600" },
    { title: "إجمالي الطلبات", value: stats.totalRequests, icon: ClipboardList, color: "text-primary" },
    { title: "الطلبات المنجزة", value: stats.completedRequests, icon: CheckCircle2, color: "text-green-600" },
    { title: "مهنيين بانتظار التوثيق", value: stats.pendingProviders, icon: ShieldAlert, color: "text-destructive" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">لوحة التحكم</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إحصائيات الخدمات</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {serviceStats && serviceStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={serviceStats}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="categoryName" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="requestCount" 
                  name="عدد الطلبات" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
                <Bar 
                  dataKey="providerCount" 
                  name="عدد المهنيين" 
                  fill="hsl(var(--accent))" 
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              لا توجد بيانات متاحة
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
