import { useState, useRef, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useGetMessages, useSendMessage } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Loader2, Phone, MoreVertical, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function Chat() {
  const [, params] = useRoute("/messages/:id");
  const otherUserId = parseInt(params?.id || "0");
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: messages, isLoading, refetch } = useGetMessages(otherUserId, {
    query: { enabled: !!otherUserId, queryKey: ['messages', otherUserId], refetchInterval: 3000 }
  });

  const sendMutation = useSendMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    sendMutation.mutate({ id: otherUserId, data: { content: trimmed } }, {
      onSuccess: () => { setContent(""); refetch(); inputRef.current?.focus(); }
    });
  };

  const otherMessage = messages?.find(m => m.senderId === otherUserId);
  const otherName = otherMessage?.senderName || "مستخدم";
  const otherAvatar = (otherMessage as any)?.senderAvatarUrl || "";

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background" dir="rtl">
      {/* Header */}
      <div className="shrink-0 gradient-primary px-4 pt-3 pb-3 flex items-center gap-3">
        <Link href="/messages">
          <button className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center shrink-0">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </Link>
        <Avatar className="w-10 h-10 border-2 border-white/20 shrink-0">
          <AvatarImage src={otherAvatar} />
          <AvatarFallback className="bg-white/20 text-white font-bold">
            {otherName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-white text-sm truncate">{otherName}</h1>
          <p className="text-white/60 text-[10px]">آخر ظهور منذ قليل</p>
        </div>
        <button className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center shrink-0">
          <Phone className="w-4.5 h-4.5 text-white" />
        </button>
        <button className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center shrink-0">
          <MoreVertical className="w-4.5 h-4.5 text-white" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{ background: 'linear-gradient(to bottom, hsl(220 25% 96%), hsl(220 20% 98%))' }}
      >
        {messages?.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-12">
            <div className="w-16 h-16 bg-primary/8 rounded-3xl flex items-center justify-center">
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-muted-foreground text-sm font-medium">أرسل أول رسالة لبدء المحادثة</p>
          </div>
        )}

        {messages?.map((msg, i) => {
          const isMe = msg.senderId === user?.id;
          const showTime = i === 0 || (messages[i - 1] && msg.senderId !== messages[i - 1].senderId);
          return (
            <AnimatePresence key={msg.id}>
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex ${isMe ? 'justify-start' : 'justify-end'} items-end gap-2`}
              >
                {!isMe && showTime && (
                  <Avatar className="w-7 h-7 shrink-0 mb-0.5">
                    <AvatarImage src={otherAvatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {otherName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                {!isMe && !showTime && <div className="w-7 shrink-0" />}

                <div className={`max-w-[72%] ${isMe ? 'items-start' : 'items-end'} flex flex-col gap-0.5`}>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'gradient-primary text-white rounded-tr-sm shadow-sm'
                        : 'bg-white text-foreground rounded-tl-sm border border-border/60 shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className={`flex items-center gap-1 ${isMe ? 'pr-1' : 'pl-1'}`}>
                    <span className="text-[9px] text-muted-foreground">
                      {msg.createdAt ? format(new Date(msg.createdAt), 'hh:mm a', { locale: ar }) : ''}
                    </span>
                    {isMe && <CheckCheck className="w-3 h-3 text-primary/60" />}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          );
        })}
      </div>

      {/* Input bar */}
      <div className="shrink-0 bg-white border-t border-border px-3 py-3 pb-safe">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-lg mx-auto">
          <Input
            ref={inputRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="flex-1 rounded-2xl bg-muted/60 border-transparent focus-visible:ring-1 focus-visible:ring-primary text-sm h-10"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-2xl w-10 h-10 gradient-primary hover:opacity-90 shrink-0 transition-opacity"
            disabled={!content.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending
              ? <Loader2 className="w-4.5 h-4.5 animate-spin" />
              : <Send className="w-4.5 h-4.5 rtl:-scale-x-100" />
            }
          </Button>
        </form>
      </div>
    </div>
  );
}
