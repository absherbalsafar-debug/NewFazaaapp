import { useState } from "react";
import { useListAdminUsers, useUpdateUserStatus } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { UserStatusUpdateStatus } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");
  const { toast } = useToast();

  const { data: usersPage, isLoading, refetch } = useListAdminUsers({
    search: search || undefined,
    role: role !== "all" ? role : undefined
  }, { query: { queryKey: ['adminUsers', search, role] } });

  const updateStatusMutation = useUpdateUserStatus();

  const handleUpdateStatus = (id: number, status: UserStatusUpdateStatus) => {
    updateStatusMutation.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: "تم تحديث حالة المستخدم" });
        refetch();
      }
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">إدارة المستخدمين</h1>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="بحث بالاسم أو رقم الهاتف..." 
            className="pl-3 pr-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="تصفية حسب نوع الحساب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="client">عميل</SelectItem>
            <SelectItem value="provider">مزود خدمة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>رقم الهاتف</TableHead>
              <TableHead>الدور</TableHead>
              <TableHead>تاريخ التسجيل</TableHead>
              <TableHead>الحالة</TableHead>
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
                  لا يوجد مستخدمين
                </TableCell>
              </TableRow>
            ) : (
              usersPage.users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell dir="ltr" className="text-right">{u.phone}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{u.role === 'client' ? 'عميل' : u.role === 'provider' ? 'مزود خدمة' : 'مدير'}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(u.createdAt), 'yyyy/MM/dd', { locale: ar })}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      u.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' :
                      u.status === 'banned' ? 'bg-red-50 text-red-600 border-red-200' :
                      'bg-yellow-50 text-yellow-600 border-yellow-200'
                    }>
                      {u.status === 'active' ? 'نشط' : u.status === 'banned' ? 'محظور' : 'قيد الانتظار'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {u.status !== 'active' && (
                        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleUpdateStatus(u.id, 'active')}>
                          تنشيط
                        </Button>
                      )}
                      {u.status !== 'banned' && u.role !== 'admin' && (
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleUpdateStatus(u.id, 'banned')}>
                          حظر
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
