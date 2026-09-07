import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Phone, PhoneOff } from "lucide-react";
import { apiRequest, useAuth } from "@/lib/auth";

interface IncomingCall {
  id: string;
  callerId: number;
  callerName: string;
  callerAvatarUrl?: string | null;
}

export function CallManager() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);

  useEffect(() => {
    if (!user || location.startsWith("/call/")) {
      setIncoming(null);
      return;
    }

    let cancelled = false;
    const checkIncoming = async () => {
      try {
        const calls = await apiRequest("/calls/incoming") as IncomingCall[];
        if (!cancelled && calls.length > 0) setIncoming(calls[0]);
      } catch {
        // The page remains usable if the optional call polling is unavailable.
      }
    };

    void checkIncoming();
    const timer = window.setInterval(() => void checkIncoming(), 1800);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [user, location]);

  if (!incoming) return null;

  const reject = async () => {
    await apiRequest(`/calls/${incoming.id}/end`, { method: "POST" }).catch(() => undefined);
    setIncoming(null);
  };

  const accept = () => {
    setIncoming(null);
    setLocation(`/call/${incoming.id}`);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/55 flex items-end justify-center p-4" dir="rtl">
      <div className="w-full max-w-md rounded-3xl bg-card border border-border p-5 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Phone className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">مكالمة واردة داخل فزعة</p>
            <h2 className="font-bold text-lg">{incoming.callerName}</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button type="button" onClick={reject} className="h-12 rounded-2xl border border-border text-muted-foreground flex items-center justify-center gap-2">
            <PhoneOff className="w-5 h-5" />
            رفض
          </button>
          <button type="button" onClick={accept} className="h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center gap-2 font-bold">
            <Phone className="w-5 h-5" />
            قبول
          </button>
        </div>
      </div>
    </div>
  );
}