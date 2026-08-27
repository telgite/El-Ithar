import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { adminApi } from "../lib/api";

type ContentSectionDef = {
  label: string;
  fields: { key: string; label: string; multiline?: boolean; type?: "text" | "number" }[];
};

const CONTENT_SECTIONS: ContentSectionDef[] = [
  {
    label: "الصفحة الرئيسية (Hero)",
    fields: [
      { key: "hero_title", label: "العنوان الرئيسي" },
      { key: "hero_subtitle", label: "النص الفرعي", multiline: true },
    ],
  },
  {
    label: "من نحن",
    fields: [
      { key: "about_text", label: "نص التعريف بالجمعية", multiline: true },
      { key: "about_founded_year", label: "سنة التأسيس", type: "number" },
      { key: "about_beneficiaries", label: "عدد المستفيدين", type: "number" },
      { key: "about_projects", label: "عدد المشاريع", type: "number" },
      { key: "about_states", label: "عدد الولايات", type: "number" },
    ],
  },
  {
    label: "قسم الاقتباس",
    fields: [
      { key: "quote_text", label: "نص الاقتباس", multiline: true },
      { key: "quote_author", label: "اسم الشخصية" },
      { key: "quote_role", label: "المنصب / الصفة" },
    ],
  },
  {
    label: "أرقام الإنجازات",
    fields: [
      { key: "impact_wells", label: "عدد الآبار المحفورة", type: "number" },
      { key: "impact_families", label: "الأسر المستفيدة", type: "number" },
      { key: "impact_clothes", label: "قطع الملابس الموزعة", type: "number" },
      { key: "impact_baskets", label: "السلال الغذائية", type: "number" },
    ],
  },
  {
    label: "معلومات التواصل",
    fields: [
      { key: "contact_whatsapp", label: "رقم واتساب (للعرض)" },
      { key: "contact_whatsapp_href", label: "رابط واتساب (للنقر)" },
      { key: "contact_phone", label: "رقم الهاتف (للعرض)" },
      { key: "contact_phone_href", label: "رابط الهاتف (tel:...)" },
      { key: "contact_email", label: "البريد الإلكتروني" },
      { key: "contact_location", label: "الموقع الجغرافي" },
    ],
  },
];

function ContentField({
  contentKey,
  label,
  initialValue,
  multiline,
  type = "text",
}: {
  contentKey: string;
  label: string;
  initialValue: string;
  multiline?: boolean;
  type?: "text" | "number";
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const mutation = useMutation({
    mutationFn: () => adminApi.updateContent(contentKey, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-content"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const isDirty = value !== initialValue;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-gray-700">{label}</label>
      <div className="flex gap-2">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none text-gray-800 font-bold text-sm transition-colors resize-none leading-relaxed"
          />
        ) : (
          <input
            type={type === "number" ? "number" : "text"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none text-gray-800 font-bold text-sm transition-colors"
          />
        )}
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !isDirty}
          className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all self-start ${
            saved
              ? "bg-green-100 text-green-700"
              : isDirty
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <><Check className="w-4 h-4" /> تم</>
          ) : (
            "حفظ"
          )}
        </button>
      </div>
    </div>
  );
}

export function AdminContent() {
  const { data: contentItems = [], isLoading } = useQuery({
    queryKey: ["admin-content"],
    queryFn: adminApi.listContent,
  });

  const contentMap = Object.fromEntries(contentItems.map((i) => [i.key, i.value]));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800">محتوى الموقع</h1>
        <p className="text-gray-500 mt-1">
          عدّل نصوص الموقع — تظهر التغييرات فوراً للزوار بعد الحفظ
        </p>
      </div>

      <div className="space-y-6">
        {CONTENT_SECTIONS.map((section) => (
          <div
            key={section.label}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <h2 className="text-lg font-black text-gray-800 mb-5 pb-3 border-b border-gray-100">
              {section.label}
            </h2>
            <div className="space-y-4">
              {section.fields.map((field) => (
                <ContentField
                  key={field.key}
                  contentKey={field.key}
                  label={field.label}
                  initialValue={contentMap[field.key] ?? ""}
                  multiline={field.multiline}
                  type={field.type}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
