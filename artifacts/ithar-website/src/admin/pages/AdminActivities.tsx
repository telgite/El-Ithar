import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Pencil, Trash2, Eye, EyeOff, Image } from "lucide-react";
import { adminApi } from "../lib/api";
import { imageUrl } from "../lib/api";

export function AdminActivities() {
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["admin-activities"],
    queryFn: adminApi.listActivities,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-activities"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      adminApi.updateActivity(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-activities"] });
    },
  });

  const handleDelete = (id: number, title: string) => {
    if (confirm(`هل أنت متأكد من حذف النشاط "${title}"؟`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800">الأنشطة والمشاريع</h1>
          <p className="text-gray-500 mt-1">
            {activities.length} نشاط — {activities.filter((a) => a.isActive).length} نشط
          </p>
        </div>
        <Link href="/admin/activities/new">
          <a className="flex items-center gap-2 bg-primary text-white font-bold px-5 py-3 rounded-xl hover:bg-primary/90 transition-colors">
            <Plus className="w-5 h-5" />
            إضافة نشاط
          </a>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-6 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-400 text-lg font-bold mb-4">لا توجد أنشطة بعد</p>
          <Link href="/admin/activities/new">
            <a className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">
              <Plus className="w-5 h-5" />
              أضف أول نشاط
            </a>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-all ${
                activity.isActive ? "border-gray-100" : "border-dashed border-gray-200 opacity-70"
              }`}
            >
              {/* Cover image */}
              {activity.images[0] && (
                <div className="h-32 rounded-xl overflow-hidden mb-4 bg-gray-100">
                  <img
                    src={imageUrl(activity.images[0].objectPath)}
                    alt={activity.images[0].altText || activity.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-black text-gray-800 text-lg leading-tight">
                  {activity.title}
                </h3>
                {!activity.isActive && (
                  <span className="shrink-0 text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded-lg">
                    مخفي
                  </span>
                )}
              </div>

              <p className="text-gray-500 text-sm leading-relaxed mb-3 line-clamp-2">
                {activity.description}
              </p>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-secondary/20 text-secondary-foreground font-bold px-3 py-1 rounded-full">
                  {activity.stat}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Image className="w-3 h-3" />
                  {activity.images.length} صورة
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/admin/activities/${activity.id}`}>
                  <a className="flex items-center gap-1.5 bg-primary/10 text-primary font-bold px-3 py-2 rounded-lg text-sm hover:bg-primary/20 transition-colors">
                    <Pencil className="w-4 h-4" />
                    تعديل
                  </a>
                </Link>

                <button
                  onClick={() =>
                    toggleMutation.mutate({
                      id: activity.id,
                      isActive: !activity.isActive,
                    })
                  }
                  disabled={toggleMutation.isPending}
                  className="flex items-center gap-1.5 bg-gray-100 text-gray-600 font-bold px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {activity.isActive ? (
                    <><EyeOff className="w-4 h-4" /> إخفاء</>
                  ) : (
                    <><Eye className="w-4 h-4" /> إظهار</>
                  )}
                </button>

                <button
                  onClick={() => handleDelete(activity.id, activity.title)}
                  disabled={deleteMutation.isPending}
                  className="mr-auto flex items-center gap-1.5 bg-red-50 text-red-600 font-bold px-3 py-2 rounded-lg text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
