import { useListConversations } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Loader2, Search, Edit } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ar } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion } from "framer-motion";

function formatMsgTime(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'hh:mm a', { locale: ar });
  if (isYesterday(d)) return "أمس";
  return format(d, 'MM/dd', { locale: ar });
}

export default function Messages() {
  const { data: conversations, isLoading } = useListConversations({
    query: { queryKey: ['conversations'] }
  });
  const [search, setSearch] = useState("");

  const filtered = (conversations ?? []).filter(c =>
    !search || c.otherUserName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-24 bg-background min-h-[100dvh]" dir="rtl">
      {/* Header */}
      <div className="gradient-primary px-4 pt-8 pb-5 relative overflow-hidden">
        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="max-w-lg mx-auto relative">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">الرسائل</h1>
            <button className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
              <Edit className="w-4.5 h-4.5 text-white" />
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث في المحادثات..."
              className="h-10 pr-10 pl-4 rounded-xl bg-white border-0 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !filtered || filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 px-6 text-center">
            <div className="w-20 h-20 bg-primary/8 rounded-3xl flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="font-bold text-base text-foreground mb-1">لا توجد رسائل</h3>
            <p className="text-muted-foreground text-sm">
              {search ? 'لا توجد نتائج للبحث' : 'تواصل مع المهنيين بعد طلب خدمة'}
            </p>
          </div>
        ) : (
          <div>
            {filtered.map((conv, i) => (
              <Link key={conv.id} href={`/messages/${conv.otherUserId}`}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/40 cursor-pointer transition-colors ${i < filtered.length - 1 ? 'border-b border-border/60' : ''}`}
                >
                  {/* Avatar with online dot */}
                  <div className="relative shrink-0">
                    <Avatar className="w-13 h-13 border border-border">
                      <AvatarImage src={conv.otherUserAvatarUrl || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                        {conv.otherUserName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -left-0.5 w-4 h-4 bg-primary rounded-full border-2 border-background" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
                        {conv.otherUserName}
                      </h3>
                      <span className="text-[10px] text-muted-foreground shrink-0 mr-2">
                        {formatMsgTime(conv.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate flex-1 ${conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {conv.lastMessage || "صورة 📷"}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="shrink-0 min-w-[20px] h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                          {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
