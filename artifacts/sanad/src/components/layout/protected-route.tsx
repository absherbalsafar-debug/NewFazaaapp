import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/lib/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Redirect to="/welcome" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Redirect to="/" />;

  return <>{children}</>;
}
