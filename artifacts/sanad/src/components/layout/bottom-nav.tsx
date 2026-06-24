import { Link, useLocation } from "wouter";
import { Home, Compass, ClipboardList, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";

export function BottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role === "admin") return null;

  const items = [
    { href: "/", icon: Home, label: "الرئيسية" },
    { href: "/discover", icon: Compass, label: "اكتشف" },
    { href: "/my-requests", icon: ClipboardList, label: "طلباتي" },
    { href: "/messages", icon: MessageSquare, label: "الرسائل" },
    { href: "/profile", icon: User, label: "حسابي" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-1">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? location === "/"
              : location.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 relative"
            >
              <div className="relative flex flex-col items-center gap-0.5">
                {isActive && (
                  <motion.div
                    layoutId="nav-bubble"
                    className="absolute -inset-2 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon
                  className={cn(
                    "relative w-5 h-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive ? "rgba(var(--color-primary-rgb, 21 128 61) / 0.15)" : "none"}
                />
                <span
                  className={cn(
                    "relative text-[10px] transition-colors font-medium",
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
