import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto max-w-md h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/">
            <span className="text-xl font-bold text-primary tracking-tight cursor-pointer">فزعة</span>
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
