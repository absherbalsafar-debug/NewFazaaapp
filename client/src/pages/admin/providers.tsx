import { useListAdminUsers, useVerifyProvider } from "@/lib/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminProviders() {
  const { toast } = useToast();

  const { data: usersPage, isLoading, refetch } = useListAdminUsers({
    role: "provider",
  }, { query: { queryKey: ['adminProviders'] } });

  const verifyMutation = useVerifyProvider();

  const handleVerify = (id: number, isVerified: boolean) => {
    verifyMutation.mutate({ id, data: { isVerified } }, {
      onSuccess: () => {
        toast({ title: isVerified ? "تم توثيق المهني" : "تم إلغاء التوثيق" });
        refetch();
      }
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">إدارة المهنيين</h1>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>التصنيف</TableHead>
              <TableHead>المدينة</TableHead>
              <TableHead>التقييم / الأعمال</TableHead>
              <TableHead>التوثيق</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : !usersPage?.users.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  لا يوجد مهنيين
                </TableCell>
              </TableRow>
            ) : (
              usersPage.users.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.categoryName || "-"}</TableCell>
                  <TableCell>{p.city || "-"}</TableCell>
                  <TableCell>
                    <span className="text-amber-500 font-bold">{p.rating?.toFixed(1) || "-"}</span> / {p.completedJobs || 0}
                  </TableCell>
                  <TableCell>
                    {p.isVerified ? (
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 gap-1">
                        <ShieldCheck className="w-3 h-3" /> موثق
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200 gap-1">
                        <ShieldAlert className="w-3 h-3" /> غير موثق
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {!p.isVerified ? (
                        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleVerify(p.id, true)}>
                          توثيق
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleVerify(p.id, false)}>
                          إلغاء التوثيق
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
