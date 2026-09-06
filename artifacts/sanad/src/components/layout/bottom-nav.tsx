import { Link, useLocation } from "wouter";
import { Home, Search, ClipboardList, MessageSquare, User, WalletCards, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";

export function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role === "admin") return null;

  const items = user.role === "provider" ? [
    { href: "/provider-dashboard", icon: Home, label: "لوحتي" },
    { href: "/my-requests", icon: ClipboardList, label: "الطلبات" },
    { href: "/messages", icon: MessageSquare, label: "الرسائل" },
    { href: "/profile", icon: User, label: "ملفي" },
    { href: "/settings", icon: WalletCards, label: "الإعدادات" },
  ] : [
    { href: "/", icon: Home, label: "الرئيسية" },
    { href: "/providers", icon: Search, label: "استعرض" },
    { href: "/my-requests", icon: ClipboardList, label: "طلباتي" },
    { href: "/messages", icon: MessageSquare, label: "الرسائل" },
    { href: "/profile", icon: User, label: "حسابي" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-border pb-safe"
      style={{ boxShadow: '0 -4px 24px rgba(15,32,66,0.08)' }}
    >
      <div className="flex justify-around items-center h-[60px] max-w-lg mx-auto px-2">
        {items.map((item) => {
          const isActive =
            item.href === "/" ? location === "/" : location.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative"
            >
              <div className="relative flex flex-col items-center gap-0.5 px-3 py-1">
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-primary/8 rounded-xl"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon
                  className={cn(
                    "relative w-[22px] h-[22px] transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span
                  className={cn(
                    "relative text-[10px] font-medium transition-colors leading-none",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
