import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowRight,
  Save,
  Upload,
  Trash2,
  CheckCircle,
  ImageIcon,
  Loader2,
} from "lucide-react";
import {
  Package,
  Droplets,
  GraduationCap,
  Shirt,
  Heart,
  Users,
  Home,
  Star,
  Sun,
  Leaf,
  HandHeart,
  Scissors,
} from "lucide-react";
import { adminApi, uploadImageFile, imageUrl, type Activity } from "../lib/api";

const ICONS: { name: string; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { name: "Package", label: "طرود", Icon: Package },
  { name: "Droplets", label: "مياه", Icon: Droplets },
  { name: "GraduationCap", label: "تعليم", Icon: GraduationCap },
  { name: "Shirt", label: "ملابس", Icon: Shirt },
  { name: "Heart", label: "صحة", Icon: Heart },
  { name: "Users", label: "مجتمع", Icon: Users },
  { name: "Home", label: "مسكن", Icon: Home },
  { name: "Star", label: "عام", Icon: Star },
  { name: "Sun", label: "بيئة", Icon: Sun },
  { name: "Leaf", label: "زراعة", Icon: Leaf },
  { name: "HandHeart", label: "رعاية", Icon: HandHeart },
  { name: "Scissors", label: "خدمات", Icon: Scissors },
];

interface Props {
  mode: "new" | "edit";
  id?: number;
}

export function AdminActivityEdit({ mode, id }: Props) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: activity, isLoading } = useQuery({
    queryKey: ["admin-activity", id],
    queryFn: () => adminApi.listActivities().then((list) => list.find((a) => a.id === id)),
    enabled: mode === "edit" && !!id,
  });

  const [form, setForm] = useState<{
    title: string;
    description: string;
    stat: string;
    iconName: string;
    sortOrder: number;
    isActive: boolean;
  }>({
    title: "",
    description: "",
    stat: "",
    iconName: "Heart",
    sortOrder: 0,
    isActive: true,
  });

  // Sync form with loaded activity
  const [synced, setSynced] = useState(false);
  if (activity && !synced) {
    setForm({
      title: activity.title,
      description: activity.description,
      stat: activity.stat,
      iconName: activity.iconName,
      sortOrder: activity.sortOrder,
      isActive: activity.isActive,
    });
    setSynced(true);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      mode === "new"
        ? adminApi.createActivity(form)
        : adminApi.updateActivity(id!, form),
    onSuccess: (saved: Activity) => {
      queryClient.invalidateQueries({ queryKey: ["admin-activities"] });
      queryClient.invalidateQueries({ queryKey: ["admin-activity", id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (mode === "new") {
        navigate(`/admin/activities/${saved.id}`);
      }
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: number) =>
      adminApi.deleteImage(id!, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-activities"] });
      queryClient.invalidateQueries({ queryKey: ["admin-activity", id] });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploadingImage(true);
    try {
      const { objectPath } = await uploadImageFile(file);
      await adminApi.addImage(id, objectPath, form.title);
      queryClient.invalidateQueries({ queryKey: ["admin-activities"] });
      queryClient.invalidateQueries({ queryKey: ["admin-activity", id] });
    } catch (err) {
      alert("فشل رفع الصورة. حاول مرة أخرى.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (mode === "edit" && isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const images = activity?.images ?? [];

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/admin/activities")}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800">
            {mode === "new" ? "إضافة نشاط جديد" : "تعديل النشاط"}
          </h1>
          {mode === "edit" && activity && (
            <p className="text-gray-500 text-sm mt-0.5">{activity.title}</p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-black text-gray-800 mb-5">المعلومات الأساسية</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                عنوان النشاط <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="مثال: توزيع الغذاء"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none font-bold text-gray-800 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                الوصف <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="اكتب وصفاً للنشاط..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none font-bold text-gray-800 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  الإحصائية (تظهر كشارة)
                </label>
                <input
                  type="text"
                  value={form.stat}
                  onChange={(e) => setForm({ ...form, stat: e.target.value })}
                  placeholder="+3000 سلة غذائية"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none font-bold text-gray-800 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  ترتيب العرض
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                  min={0}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none font-bold text-gray-800 transition-colors"
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <div>
                <p className="font-bold text-gray-800 text-sm">حالة النشاط</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {form.isActive ? "ظاهر على الموقع" : "مخفي عن الزوار"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  form.isActive ? "bg-primary" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    form.isActive ? "translate-x-1" : "translate-x-6"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Icon picker */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-black text-gray-800 mb-4">أيقونة النشاط</h2>
          <div className="grid grid-cols-6 gap-2">
            {ICONS.map(({ name, label, Icon }) => (
              <button
                key={name}
                type="button"
                onClick={() => setForm({ ...form, iconName: name })}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                  form.iconName === name
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-100 hover:border-gray-200 text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-bold">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Image gallery — only for existing activities */}
        {mode === "edit" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-800">صور النشاط</h2>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="flex items-center gap-2 bg-primary/10 text-primary font-bold px-4 py-2 rounded-xl hover:bg-primary/20 transition-colors text-sm disabled:opacity-50"
              >
                {uploadingImage ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الرفع...</>
                ) : (
                  <><Upload className="w-4 h-4" /> رفع صورة</>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {images.length === 0 ? (
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="font-bold text-gray-400">لا توجد صور بعد</p>
                <p className="text-sm text-gray-400 mt-1">انقر لرفع أول صورة</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img) => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100">
                    <img
                      src={imageUrl(img.objectPath)}
                      alt={img.altText || "صورة النشاط"}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        if (confirm("هل تريد حذف هذه الصورة؟")) {
                          deleteImageMutation.mutate(img.id);
                        }
                      }}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Trash2 className="w-6 h-6 text-white" />
                    </button>
                  </div>
                ))}
                {/* Add more button */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <Upload className="w-6 h-6 text-gray-300 mb-1" />
                  <span className="text-xs text-gray-400 font-bold">إضافة</span>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === "new" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm font-bold">
            💡 احفظ النشاط أولاً لتتمكن من رفع الصور له.
          </div>
        )}

        {/* Save button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.title || !form.description}
            className="flex items-center gap-2 bg-primary text-white font-black px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {saveMutation.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> جارٍ الحفظ...</>
            ) : saved ? (
              <><CheckCircle className="w-5 h-5" /> تم الحفظ!</>
            ) : (
              <><Save className="w-5 h-5" /> حفظ النشاط</>
            )}
          </button>

          {saveMutation.isError && (
            <p className="text-red-600 text-sm font-bold">
              {saveMutation.error?.message ?? "حدث خطأ، حاول مرة أخرى"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
