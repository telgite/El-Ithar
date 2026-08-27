import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Check, Globe, Eye, EyeOff, Power } from "lucide-react";
import { adminApi } from "../lib/api";
import type { SocialMedia } from "../lib/api";
import { SocialIcon } from "@/components/SocialIcon";

// ── Arabic display labels ──────────────────────────────────────────────────
const PLATFORM_LABELS: Record<string, string> = {
  facebook:  "فيسبوك",
  instagram: "انستغرام",
  twitter:   "إكس (تويتر)",
  youtube:   "يوتيوب",
  tiktok:    "تيك توك",
  telegram:  "تيليغرام",
  whatsapp:  "واتساب",
  linkedin:  "لينكدإن",
};

// ── Single platform card ───────────────────────────────────────────────────
function PlatformCard({ platform }: { platform: SocialMedia }) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState(platform.url);
  const [urlSaved, setUrlSaved] = useState(false);

  // Keep local URL in sync if a toggle mutation refreshes the data
  useEffect(() => {
    setUrl(platform.url);
  }, [platform.url]);

  // Toggle mutation (enabled / visible) — auto-saves on click
  const toggleMutation = useMutation({
    mutationFn: (data: Partial<Pick<SocialMedia, "enabled" | "visible">>) =>
      adminApi.updateSocial(platform.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-social"] });
    },
  });

  // URL mutation — saves when the button is clicked
  const urlMutation = useMutation({
    mutationFn: () => adminApi.updateSocial(platform.id, { url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-social"] });
      setUrlSaved(true);
      setTimeout(() => setUrlSaved(false), 2000);
    },
  });

  const isDirty = url !== platform.url;

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 ${
        !platform.enabled ? "opacity-60" : ""
      }`}
    >
      {/* ── Header: icon + name + toggles ─────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-50">
        {/* Icon badge */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            platform.enabled ? "bg-primary/10" : "bg-gray-100"
          }`}
        >
          <SocialIcon
            platform={platform.platform}
            className={`w-6 h-6 transition-colors ${
              platform.enabled ? "text-primary" : "text-gray-400"
            }`}
          />
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-800 text-base leading-tight">
            {PLATFORM_LABELS[platform.platform] ?? platform.name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{platform.platform}</p>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Visible toggle */}
          <button
            onClick={() => toggleMutation.mutate({ visible: !platform.visible })}
            disabled={toggleMutation.isPending}
            title={platform.visible ? "مرئي — انقر للإخفاء" : "مخفي — انقر للإظهار"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
              platform.visible
                ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
          >
            {platform.visible ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {platform.visible ? "مرئي" : "مخفي"}
            </span>
          </button>

          {/* Enabled toggle */}
          <button
            onClick={() => toggleMutation.mutate({ enabled: !platform.enabled })}
            disabled={toggleMutation.isPending}
            title={platform.enabled ? "مفعّل — انقر لتعطيله" : "معطّل — انقر لتفعيله"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
              platform.enabled
                ? "bg-green-50 text-green-600 hover:bg-green-100"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {platform.enabled ? "مفعّل" : "معطّل"}
            </span>
          </button>
        </div>
      </div>

      {/* ── Body: URL input ────────────────────────────────────────────── */}
      <div className="px-6 py-4">
        <label className="block text-sm font-bold text-gray-600 mb-2">
          رابط الصفحة
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={`https://www.${platform.platform}.com/ithar`}
              dir="ltr"
              className="w-full pr-9 pl-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none text-gray-800 text-sm transition-colors placeholder:text-gray-300"
            />
          </div>
          <button
            onClick={() => urlMutation.mutate()}
            disabled={urlMutation.isPending || !isDirty}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              urlSaved
                ? "bg-green-100 text-green-700"
                : isDirty
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {urlMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : urlSaved ? (
              <>
                <Check className="w-4 h-4" /> تم
              </>
            ) : (
              "حفظ"
            )}
          </button>
        </div>

        {/* Warning when platform is active but URL is missing */}
        {platform.enabled && platform.visible && !url.trim() && (
          <p className="text-xs text-amber-500 mt-2 font-semibold">
            ⚠️ لن يظهر الأيقون على الموقع حتى تُدخل الرابط وتحفظ
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export function AdminSocial() {
  const { data: platforms = [], isLoading } = useQuery({
    queryKey: ["admin-social"],
    queryFn: adminApi.listSocial,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const liveCount = platforms.filter(
    (p) => p.enabled && p.visible && p.url.trim() !== ""
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800">
          وسائل التواصل الاجتماعي
        </h1>
        <p className="text-gray-500 mt-1">
          فعّل المنصات وأدخل روابطها — تظهر فقط المنصات المفعّلة والمرئية التي
          لها رابط على الموقع
        </p>
      </div>

      {/* Live count badge */}
      <div className="mb-6 inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold text-sm">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
        {liveCount === 0
          ? "لا توجد منصات ظاهرة حالياً على الموقع"
          : `${liveCount} ${liveCount === 1 ? "منصة ظاهرة" : "منصات ظاهرة"} على الموقع`}
      </div>

      {/* Platform cards — 2-column on large screens */}
      <div className="grid gap-4 lg:grid-cols-2">
        {platforms.map((platform) => (
          <PlatformCard key={platform.id} platform={platform} />
        ))}
      </div>
    </div>
  );
}
