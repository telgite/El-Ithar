import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Activity, FileText, Image, ArrowLeft } from "lucide-react";
import { adminApi } from "../lib/api";

export function AdminDashboard() {
  const { data: activities = [] } = useQuery({
    queryKey: ["admin-activities"],
    queryFn: adminApi.listActivities,
  });

  const { data: galleries = [] } = useQuery({
    queryKey: ["admin-galleries"],
    queryFn: adminApi.listGalleries,
  });

  const { data: content = [] } = useQuery({
    queryKey: ["admin-content"],
    queryFn: adminApi.listContent,
  });

  const totalGalleryImages = galleries.reduce((sum, g) => sum + g.images.length, 0);
  const activeCount = activities.filter((a) => a.isActive).length;

  const stats = [
    {
      label: "الأنشطة النشطة",
      value: activeCount,
      total: activities.length,
      icon: Activity,
      href: "/admin/activities",
      color: "bg-primary/10 text-primary",
    },
    {
      label: "الصور المرفوعة",
      value: totalGalleryImages,
      icon: Image,
      href: "/admin/gallery",
      color: "bg-secondary/20 text-secondary-foreground",
    },
    {
      label: "عناصر المحتوى",
      value: content.length,
      icon: FileText,
      href: "/admin/content",
      color: "bg-blue-50 text-blue-700",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800">لوحة التحكم</h1>
        <p className="text-gray-500 mt-1">مرحباً بك في نظام إدارة موقع جمعية الإيثار</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <a className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 block">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-3xl font-black text-gray-800 mb-1">{stat.value}</p>
                {stat.total !== undefined && (
                  <p className="text-xs text-gray-400 mb-1">من أصل {stat.total}</p>
                )}
                <p className="text-sm font-bold text-gray-500">{stat.label}</p>
              </a>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            إدارة الأنشطة
          </h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            أضف أنشطة جديدة أو عدّل الموجودة وأرفق صوراً لكل نشاط. تظهر الأنشطة
            النشطة على الموقع الرئيسي.
          </p>
          <Link href="/admin/activities">
            <a className="inline-flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm">
              إدارة الأنشطة
              <ArrowLeft className="w-4 h-4" />
            </a>
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            تعديل المحتوى
          </h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            عدّل نصوص الصفحة الرئيسية، قسم «من نحن»، الاقتباسات، أرقام الإنجازات
            ومعلومات التواصل.
          </p>
          <Link href="/admin/content">
            <a className="inline-flex items-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm">
              تعديل المحتوى
              <ArrowLeft className="w-4 h-4" />
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
