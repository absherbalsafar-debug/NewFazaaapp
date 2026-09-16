import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, ShieldBan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type Complaint = { id: number; clientName: string; subject: string; description: string; status: string; priority: string; providerId: number; evidence: Array<{ id: number; objectPath: string; originalName: string }> };

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("fazaah_token");
  const response = await fetch(`/api${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "تعذر تنفيذ العملية");
  return response.json();
}

export default function AdminComplaints() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const load = () => request("/admin/complaints").then(setItems).catch((error) => toast({ title: "تعذر تحميل الشكاوى", description: error.message, variant: "destructive" })).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const update = async (id: number, data: Record<string, unknown>) => { try { await request(`/admin/complaints/${id}`, { method: "PATCH", body: JSON.stringify(data) }); toast({ title: "تم تحديث الشكوى" }); load(); } catch (error) { toast({ title: "تعذر التحديث", description: error instanceof Error ? error.message : "حاول مرة أخرى", variant: "destructive" }); } };
  return <div className="p-6" dir="rtl"><div className="mb-6 flex items-center gap-3"><div className="rounded-2xl bg-amber-100 p-3 text-amber-700"><AlertTriangle /></div><div><h1 className="text-2xl font-black">الشكاوى والنزاعات</h1><p className="mt-1 text-sm text-muted-foreground">راجع الأدلة واحمِ العملاء واتخذ إجراءً موثقًا ضد المهنيين.</p></div></div><div className="space-y-4">{loading ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /> : !items.length ? <div className="rounded-2xl border border-border p-8 text-center text-muted-foreground">لا توجد شكاوى مسجلة</div> : items.map((item) => <article key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-black">#{item.id} — {item.subject}</h2><Badge variant="outline">{item.status}</Badge><Badge variant="outline">أولوية {item.priority}</Badge></div><p className="mt-2 text-sm text-muted-foreground">العميل: {item.clientName} · المهني: #{item.providerId}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => update(item.id, { status: "under_review" })}>قيد المراجعة</Button><Button size="sm" variant="outline" className="text-amber-700" onClick={() => update(item.id, { suspendProvider: true, status: "resolved", resolutionNote: "تم إيقاف المهني مؤقتًا لحماية العملاء" })}><ShieldBan className="ml-1 h-4 w-4" />إيقاف مؤقت</Button><Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => update(item.id, { status: "resolved" })}><CheckCircle2 className="ml-1 h-4 w-4" />حل الشكوى</Button></div></div><p className="mt-4 rounded-xl bg-muted/50 p-3 text-sm leading-6">{item.description}</p>{item.evidence?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{item.evidence.map((file) => <a key={file.id} className="rounded-lg border border-primary/20 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/5" href={`/api/storage/objects/${file.objectPath.replace(/^\/objects\//, "")}`} target="_blank" rel="noreferrer">عرض الدليل: {file.originalName || "ملف"}</a>)}</div>}</article>)}</div></div>;
}
