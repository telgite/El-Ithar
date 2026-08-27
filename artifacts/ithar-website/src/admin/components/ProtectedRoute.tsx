import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../lib/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, navigate] = useLocation();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["admin-me"],
    queryFn: adminApi.me,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      navigate("/admin/login");
    }
  }, [isLoading, isError, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-primary text-lg font-bold">جارٍ التحميل...</div>
      </div>
    );
  }

  if (isError || !user) return null;

  return <>{children}</>;
}
