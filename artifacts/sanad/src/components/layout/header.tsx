import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Bell } from "lucide-react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-md items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-primary shadow-sm">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <Link href="/">
            <span className="cursor-pointer text-lg font-black tracking-tight text-primary">فزعة</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          {user && (
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="rounded-full relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full"></span>
              </Button>
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
