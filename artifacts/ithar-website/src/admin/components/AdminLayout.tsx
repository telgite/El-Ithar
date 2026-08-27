import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Activity,
  FileText,
  LogOut,
  Menu,
  X,
  ExternalLink,
  GalleryHorizontal,
  Share2,
} from "lucide-react";
import { adminApi } from "../lib/api";
import logoSrc from "@assets/logo.png";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/admin", label: "الرئيسية", icon: LayoutDashboard, exact: true },
  { href: "/admin/activities", label: "الأنشطة والمشاريع", icon: Activity, exact: false },
  { href: "/admin/gallery", label: "إدارة المعرض", icon: GalleryHorizontal, exact: false },
  { href: "/admin/content", label: "محتوى الموقع", icon: FileText, exact: false },
  { href: "/admin/social", label: "وسائل التواصل", icon: Share2, exact: false },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: adminApi.logout,
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/admin/login";
    },
  });

  const isActive = (href: string, exact: boolean) => {
    if (exact) return location === href;
    return location.startsWith(href);
  };

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-primary text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/20">
        <img src={logoSrc} alt="شعار جمعية الإيثار" className="h-10 w-10 object-contain" />
        <div>
          <p className="font-black text-sm leading-tight">جمعية الإيثار</p>
          <p className="text-white/70 text-xs">لوحة التحكم</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                active
                  ? "bg-white text-primary shadow-md"
                  : "text-white/80 hover:bg-white/15 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/20 space-y-2">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-sm font-bold transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          عرض الموقع
        </a>
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-sm font-bold transition-all text-right"
        >
          <LogOut className="w-4 h-4" />
          {logoutMutation.isPending ? "جارٍ الخروج..." : "تسجيل الخروج"}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex font-['Tajawal',sans-serif]">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 shadow-xl">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-64 z-50 flex flex-col shadow-xl">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:mr-64 flex flex-col min-h-screen">
        {/* Top bar (mobile) */}
        <header className="lg:hidden bg-primary text-white flex items-center justify-between px-4 py-3 shadow-md">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-white/10"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src={logoSrc} alt="شعار" className="h-7 w-7 rounded-full" />
            <span className="font-black text-sm">جمعية الإيثار</span>
          </div>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
