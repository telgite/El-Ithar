import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Pencil, Trash2, Image, X, Check, Eye, EyeOff, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { adminApi, imageUrl, type Gallery } from "../lib/api";

// ── Create / Rename Modal ─────────────────────────────────────────────────────

interface GalleryModalProps {
  mode: "create" | "rename";
  gallery?: Gallery;
  onClose: () => void;
  onSubmit: (title: string, slug: string) => void;
  isPending: boolean;
}

function GalleryModal({ mode, gallery, onClose, onSubmit, isPending }: GalleryModalProps) {
  const [title, setTitle] = useState(gallery?.title ?? "");
  const [slug, setSlug] = useState(gallery?.slug ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim(), slug.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10" dir="rtl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-800">
            {mode === "create" ? "إنشاء معرض جديد" : "تعديل اسم المعرض"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              اسم المعرض <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: صور حملات التوزيع"
              autoFocus
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none font-bold text-gray-800 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              المعرّف (slug) — اختياري
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, ""))}
              placeholder="مثال: water-wells"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none font-mono text-gray-700 transition-colors"
              dir="ltr"
            />
            <p className="text-xs text-gray-400 mt-1">يُنشأ تلقائياً إن تُرك فارغاً</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-black px-5 py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <span className="animate-pulse">جارٍ الحفظ...</span>
              ) : (
                <><Check className="w-4 h-4" /> حفظ</>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sortable Gallery Card ─────────────────────────────────────────────────────

interface GalleryCardProps {
  gallery: Gallery;
  onRename: (gallery: Gallery) => void;
  onDelete: (gallery: Gallery) => void;
  onToggleActive: (gallery: Gallery) => void;
  isDeleting: boolean;
  isTogglingActive: boolean;
}

function SortableGalleryCard({
  gallery,
  onRename,
  onDelete,
  onToggleActive,
  isDeleting,
  isTogglingActive,
}: GalleryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: gallery.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.75 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-colors ${
        gallery.isActive ? "border-gray-100" : "border-dashed border-gray-300 opacity-70"
      } ${isDragging ? "shadow-xl" : ""}`}
    >
      {/* Drag handle + thumbnail strip */}
      <div className="relative h-36 bg-gray-50 overflow-hidden">
        {gallery.images.length > 0 ? (
          <div className="flex h-full">
            {gallery.images.slice(0, 3).map((img, i) => (
              <div
                key={img.id}
                className="flex-1 overflow-hidden"
                style={{ opacity: 1 - i * 0.15 }}
              >
                <img
                  src={imageUrl(img.objectPath)}
                  alt={img.altText}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Image className="w-10 h-10 text-gray-200" strokeWidth={1.5} />
          </div>
        )}

        {/* Drag handle — top-left overlay */}
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 transition-colors cursor-grab active:cursor-grabbing shadow-sm"
          title="اسحب لإعادة الترتيب"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Hidden badge */}
        {!gallery.isActive && (
          <span className="absolute top-2 left-2 text-xs bg-gray-800/70 text-white font-bold px-2 py-0.5 rounded-lg">
            مخفي
          </span>
        )}
      </div>

      {/* Info + actions */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-black text-gray-800 text-base leading-tight line-clamp-2">
            {gallery.title}
          </h3>
        </div>

        <p className="text-xs text-gray-400 mb-4 font-mono" dir="ltr">{gallery.slug}</p>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs bg-secondary/15 text-secondary-foreground font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Image className="w-3 h-3" />
            {gallery.images.length} صورة
          </span>

          <Link
            href={`/admin/gallery/${gallery.id}`}
            className="flex items-center gap-1.5 bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-lg text-sm hover:bg-primary/20 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            إدارة الصور
          </Link>

          <button
            onClick={() => onRename(gallery)}
            className="flex items-center gap-1.5 bg-gray-100 text-gray-600 font-bold px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            تعديل الاسم
          </button>

          {/* Visibility toggle */}
          <button
            onClick={() => onToggleActive(gallery)}
            disabled={isTogglingActive}
            title={gallery.isActive ? "إخفاء المعرض" : "إظهار المعرض"}
            className={`flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50 ${
              gallery.isActive
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            {gallery.isActive ? (
              <><Eye className="w-3.5 h-3.5" /> ظاهر</>
            ) : (
              <><EyeOff className="w-3.5 h-3.5" /> مخفي</>
            )}
          </button>

          <button
            onClick={() => onDelete(gallery)}
            disabled={isDeleting}
            className="mr-auto flex items-center gap-1.5 bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded-lg text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            حذف
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AdminGallery() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [renamingGallery, setRenamingGallery] = useState<Gallery | null>(null);
  // Local ordered list for optimistic reordering
  const [localOrder, setLocalOrder] = useState<number[] | null>(null);

  const { data: galleries = [], isLoading } = useQuery({
    queryKey: ["admin-galleries"],
    queryFn: adminApi.listGalleries,
  });

  // Derive display order: use localOrder if mid-drag, otherwise server order
  const displayGalleries =
    localOrder !== null
      ? localOrder.map((id) => galleries.find((g) => g.id === id)!).filter(Boolean)
      : galleries;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const createMutation = useMutation({
    mutationFn: ({ title, slug }: { title: string; slug: string }) =>
      adminApi.createGallery({ title, slug: slug || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-galleries"] });
      setShowCreate(false);
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title, slug }: { id: number; title: string; slug: string }) =>
      adminApi.updateGallery(id, { title, slug: slug || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-galleries"] });
      setRenamingGallery(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteGallery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-galleries"] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      adminApi.updateGallery(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-galleries"] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      // PATCH each gallery with its new sortOrder index
      await Promise.all(
        orderedIds.map((id, index) =>
          adminApi.updateGallery(id, { sortOrder: index + 1 }),
        ),
      );
    },
    onSuccess: () => {
      setLocalOrder(null);
      queryClient.invalidateQueries({ queryKey: ["admin-galleries"] });
    },
    onError: () => {
      setLocalOrder(null);
      queryClient.invalidateQueries({ queryKey: ["admin-galleries"] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentIds = displayGalleries.map((g) => g.id);
    const oldIndex = currentIds.indexOf(active.id as number);
    const newIndex = currentIds.indexOf(over.id as number);
    if (oldIndex === -1 || newIndex === -1) return;

    const newIds = arrayMove(currentIds, oldIndex, newIndex);
    setLocalOrder(newIds);
    reorderMutation.mutate(newIds);
  };

  const handleDelete = (gallery: Gallery) => {
    if (confirm(`هل أنت متأكد من حذف معرض "${gallery.title}"؟\nسيتم حذف جميع الصور داخله.`)) {
      deleteMutation.mutate(gallery.id);
    }
  };

  const handleToggleActive = (gallery: Gallery) => {
    toggleActiveMutation.mutate({ id: gallery.id, isActive: !gallery.isActive });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800">إدارة المعرض</h1>
          <p className="text-gray-500 mt-1">
            {galleries.length} معرض —{" "}
            {galleries.reduce((sum, g) => sum + g.images.length, 0)} صورة إجمالاً
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-white font-bold px-5 py-3 rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          معرض جديد
        </button>
      </div>

      {/* Gallery grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-32 bg-gray-100 rounded-xl mb-4" />
              <div className="h-5 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : galleries.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <Image className="w-12 h-12 text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
          <p className="text-gray-400 text-lg font-bold mb-4">لا توجد معارض بعد</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            أنشئ أول معرض
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
            <GripVertical className="w-3.5 h-3.5" />
            اسحب البطاقات لإعادة ترتيب المعارض
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayGalleries.map((g) => g.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayGalleries.map((gallery) => (
                  <SortableGalleryCard
                    key={gallery.id}
                    gallery={gallery}
                    onRename={setRenamingGallery}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                    isDeleting={deleteMutation.isPending && deleteMutation.variables === gallery.id}
                    isTogglingActive={
                      toggleActiveMutation.isPending &&
                      toggleActiveMutation.variables?.id === gallery.id
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      {/* Create modal */}
      {showCreate && (
        <GalleryModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSubmit={(title, slug) => createMutation.mutate({ title, slug })}
          isPending={createMutation.isPending}
        />
      )}

      {/* Rename modal */}
      {renamingGallery && (
        <GalleryModal
          mode="rename"
          gallery={renamingGallery}
          onClose={() => setRenamingGallery(null)}
          onSubmit={(title, slug) =>
            renameMutation.mutate({ id: renamingGallery.id, title, slug })
          }
          isPending={renameMutation.isPending}
        />
      )}
    </div>
  );
}
