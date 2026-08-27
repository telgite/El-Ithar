import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowRight, Upload, Trash2, Loader2, ImageIcon, GripVertical,
  Save, X, ZoomIn, RefreshCw, MoreVertical,
} from "lucide-react";
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
  arrayMove,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { adminApi, uploadImageFile, imageUrl, type GalleryImage } from "../lib/api";

// ── Hook: detect touch/hover-less devices ────────────────────────────────────

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(hover: none)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ image, onClose }: { image: GalleryImage; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={onClose}>
      <button
        className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>
      <img
        src={imageUrl(image.objectPath)}
        alt={image.altText}
        className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      {image.altText && (
        <p className="absolute bottom-6 text-white/80 font-bold text-sm bg-black/50 px-4 py-2 rounded-full">
          {image.altText}
        </p>
      )}
    </div>
  );
}

// ── Mobile Bottom Sheet ───────────────────────────────────────────────────────

interface MobileActionSheetProps {
  image: GalleryImage;
  isDeleting: boolean;
  isReplacing: boolean;
  onPreview: () => void;
  onReplace: () => void;
  onDelete: () => void;
  onClose: () => void;
}

function MobileActionSheet({
  image, isDeleting, isReplacing, onPreview, onReplace, onDelete, onClose,
}: MobileActionSheetProps) {
  // Trap body scroll while sheet is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" dir="rtl">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Sheet panel */}
      <div className="relative bg-white rounded-t-2xl shadow-2xl animate-slide-up overflow-hidden">
        {/* Handle pill */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Image preview strip */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
          <img
            src={imageUrl(image.objectPath)}
            alt={image.altText || "صورة"}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
          <p className="text-gray-700 font-bold text-sm truncate flex-1">
            {image.altText || "صورة المعرض"}
          </p>
        </div>

        {/* Actions */}
        <div className="py-2">
          {/* Preview */}
          <button
            onClick={() => { onClose(); onPreview(); }}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-right"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <ZoomIn className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-bold text-gray-800 text-base">معاينة الصورة</span>
          </button>

          {/* Replace */}
          <button
            onClick={() => { onClose(); onReplace(); }}
            disabled={isReplacing}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-right disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              {isReplacing ? (
                <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5 text-green-600" />
              )}
            </div>
            <span className="font-bold text-gray-800 text-base">استبدال الصورة</span>
          </button>

          {/* Delete */}
          <button
            onClick={() => { onClose(); onDelete(); }}
            disabled={isDeleting}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 active:bg-red-100 transition-colors text-right disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              {isDeleting ? (
                <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5 text-red-500" />
              )}
            </div>
            <span className="font-bold text-red-600 text-base">حذف الصورة</span>
          </button>
        </div>

        {/* Cancel */}
        <div className="px-4 pb-6 pt-1">
          <button
            onClick={onClose}
            className="w-full py-4 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 font-bold text-gray-700 text-base transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sortable Image Card ───────────────────────────────────────────────────────

interface SortableImageCardProps {
  image: GalleryImage;
  galleryId: number;
  isMobile: boolean;
  onDelete: (id: number) => void;
  onReplace: (id: number) => void;
  onPreview: (img: GalleryImage) => void;
  onMobileMenu: (img: GalleryImage) => void;
  isDeleting: boolean;
  isReplacing: boolean;
}

function SortableImageCard({
  image, isMobile, onDelete, onReplace, onPreview, onMobileMenu, isDeleting, isReplacing,
}: SortableImageCardProps) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: image.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  if (isMobile) {
    // ── Mobile card: no hover, permanent ⋮ button, tap image = nothing ──────
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`relative bg-gray-100 rounded-xl overflow-hidden aspect-square ${
          isDragging ? "ring-2 ring-primary shadow-xl" : ""
        }`}
      >
        {/* Image — touch area is drag-only (no tap action to avoid accidents) */}
        <div
          {...attributes}
          {...listeners}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          <img
            src={imageUrl(image.objectPath)}
            alt={image.altText || "صورة المعرض"}
            className="w-full h-full object-cover"
            loading="lazy"
            draggable={false}
          />
        </div>

        {/* ⋮ More button — always visible, not part of drag listeners */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onMobileMenu(image); }}
          className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/55 flex items-center justify-center shadow-lg z-10"
          aria-label="خيارات الصورة"
        >
          <MoreVertical className="w-4 h-4 text-white" />
        </button>

        {/* Drag hint chip — bottom right */}
        <div
          {...attributes}
          {...listeners}
          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/40 text-white z-10 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Alt text */}
        {image.altText && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 pt-4 pb-1 pointer-events-none">
            <p className="text-white text-xs font-bold truncate">{image.altText}</p>
          </div>
        )}
      </div>
    );
  }

  // ── Desktop card: original hover-overlay behavior ─────────────────────────
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-gray-100 rounded-xl overflow-hidden aspect-square flex flex-col ${
        isDragging ? "ring-2 ring-primary shadow-xl" : ""
      }`}
    >
      {/* Image */}
      <div className="flex-1 overflow-hidden cursor-pointer" onClick={() => onPreview(image)}>
        <img
          src={imageUrl(image.objectPath)}
          alt={image.altText || "صورة المعرض"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Overlay controls */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        <button
          onClick={() => onPreview(image)}
          title="معاينة"
          className="p-2 bg-white/90 rounded-full hover:bg-white shadow transition-all"
        >
          <ZoomIn className="w-4 h-4 text-gray-700" />
        </button>
        <button
          onClick={() => onReplace(image.id)}
          disabled={isReplacing}
          title="استبدال"
          className="p-2 bg-white/90 rounded-full hover:bg-white shadow transition-all disabled:opacity-50"
        >
          {isReplacing ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 text-primary" />
          )}
        </button>
        <button
          onClick={() => onDelete(image.id)}
          disabled={isDeleting}
          title="حذف"
          className="p-2 bg-white/90 rounded-full hover:bg-red-50 shadow transition-all disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4 text-red-500" />
          )}
        </button>
      </div>

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 text-white cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        title="اسحب لتغيير الترتيب"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Alt text caption */}
      {image.altText && (
        <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-white text-xs font-bold truncate">{image.altText}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface Props {
  id: number;
}

export function AdminGalleryEdit({ id }: Props) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [localImages, setLocalImages] = useState<GalleryImage[] | null>(null);
  const [orderChanged, setOrderChanged] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null);
  const [replacingId, setReplacingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  // Mobile bottom sheet
  const [mobileMenuImage, setMobileMenuImage] = useState<GalleryImage | null>(null);

  const uploadRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  const { data: gallery, isLoading } = useQuery({
    queryKey: ["admin-gallery", id],
    queryFn: () => adminApi.getGallery(id),
  });

  if (gallery && !orderChanged && localImages === null) {
    setLocalImages([...gallery.images]);
  }
  if (gallery && !orderChanged && localImages !== null) {
    const serverIds = gallery.images.map((img) => img.id).join(",");
    const localIds = localImages.map((img) => img.id).join(",");
    if (serverIds !== localIds) {
      setLocalImages([...gallery.images]);
    }
  }

  const images = localImages ?? gallery?.images ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLocalImages((prev) => {
      if (!prev) return prev;
      const oldIdx = prev.findIndex((img) => img.id === active.id);
      const newIdx = prev.findIndex((img) => img.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
    setOrderChanged(true);
  }

  const saveOrderMutation = useMutation({
    mutationFn: () =>
      adminApi.reorderGalleryImages(id, images.map((img) => img.id)),
    onSuccess: (updatedImages) => {
      setLocalImages(updatedImages);
      setOrderChanged(false);
      queryClient.invalidateQueries({ queryKey: ["admin-gallery", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-galleries"] });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imgId: number) => adminApi.deleteGalleryImage(id, imgId),
    onSuccess: (_data, imgId) => {
      setLocalImages((prev) => prev?.filter((img) => img.id !== imgId) ?? null);
      setOrderChanged(false);
      queryClient.invalidateQueries({ queryKey: ["admin-gallery", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-galleries"] });
      setDeletingId(null);
    },
    onError: () => setDeletingId(null),
  });

  const handleDelete = useCallback((imgId: number) => {
    if (!confirm("هل تريد حذف هذه الصورة؟")) return;
    setDeletingId(imgId);
    deleteImageMutation.mutate(imgId);
  }, [deleteImageMutation]);

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setUploadingCount(fileArray.length);
    try {
      for (const file of fileArray) {
        try {
          const { objectPath } = await uploadImageFile(file);
          const newImg = await adminApi.addGalleryImage(id, objectPath, "");
          setLocalImages((prev) => (prev ? [...prev, newImg] : [newImg]));
          setUploadingCount((c) => Math.max(0, c - 1));
        } catch {
          setUploadingCount((c) => Math.max(0, c - 1));
          alert("فشل رفع إحدى الصور. حاول مرة أخرى.");
        }
      }
    } finally {
      setUploadingCount(0);
      queryClient.invalidateQueries({ queryKey: ["admin-gallery", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-galleries"] });
      if (uploadRef.current) uploadRef.current.value = "";
    }
  };

  const handleReplace = useCallback((imgId: number) => {
    setReplacingId(imgId);
    replaceRef.current?.click();
  }, []);

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replacingId === null) {
      setReplacingId(null);
      return;
    }
    try {
      const { objectPath } = await uploadImageFile(file);
      const updated = await adminApi.updateGalleryImage(id, replacingId, { objectPath });
      setLocalImages((prev) =>
        prev?.map((img) => (img.id === replacingId ? updated : img)) ?? null,
      );
      queryClient.invalidateQueries({ queryKey: ["admin-gallery", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-galleries"] });
    } catch {
      alert("فشل استبدال الصورة. حاول مرة أخرى.");
    } finally {
      setReplacingId(null);
      if (replaceRef.current) replaceRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 font-bold">المعرض غير موجود</p>
        <button onClick={() => navigate("/admin/gallery")} className="mt-4 text-primary font-bold underline">
          العودة إلى المعارض
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/admin/gallery")}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
        >
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-gray-800 truncate">{gallery.title}</h1>
          <p className="text-gray-400 text-sm font-mono" dir="ltr">{gallery.slug}</p>
        </div>

        <button
          onClick={() => uploadRef.current?.click()}
          disabled={uploadingCount > 0}
          className="flex items-center gap-2 bg-primary text-white font-bold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
        >
          {uploadingCount > 0 ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> يرفع {uploadingCount}...</>
          ) : (
            <><Upload className="w-4 h-4" /> رفع صور</>
          )}
        </button>
      </div>

      {/* Order toolbar */}
      {orderChanged && (
        <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="flex-1 text-amber-800 font-bold text-sm">
            🔄 تم تغيير الترتيب — احفظ لتطبيق التغييرات
          </p>
          <button
            onClick={() => saveOrderMutation.mutate()}
            disabled={saveOrderMutation.isPending}
            className="flex items-center gap-1.5 bg-amber-600 text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {saveOrderMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الحفظ...</>
            ) : (
              <><Save className="w-4 h-4" /> حفظ الترتيب</>
            )}
          </button>
          <button
            onClick={() => { setLocalImages([...(gallery?.images ?? [])]); setOrderChanged(false); }}
            className="text-amber-700 font-bold text-sm hover:underline"
          >
            إلغاء
          </button>
        </div>
      )}

      {/* Image grid */}
      {images.length === 0 && uploadingCount === 0 ? (
        <div
          className="border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => uploadRef.current?.click()}
        >
          <ImageIcon className="w-14 h-14 text-gray-200 mx-auto mb-4" strokeWidth={1.5} />
          <p className="font-black text-gray-400 text-lg mb-1">لا توجد صور في هذا المعرض</p>
          <p className="text-gray-400 text-sm">انقر هنا أو استخدم زر "رفع صور" لإضافة صور</p>
        </div>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img) => (
                  <SortableImageCard
                    key={img.id}
                    image={img}
                    galleryId={id}
                    isMobile={isMobile}
                    onDelete={handleDelete}
                    onReplace={handleReplace}
                    onPreview={setPreviewImage}
                    onMobileMenu={setMobileMenuImage}
                    isDeleting={deletingId === img.id}
                    isReplacing={replacingId === img.id}
                  />
                ))}

                {/* Upload placeholders */}
                {Array.from({ length: uploadingCount }).map((_, i) => (
                  <div
                    key={`uploading-${i}`}
                    className="aspect-square rounded-xl bg-gray-100 border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-2"
                  >
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs text-gray-400 font-bold">جارٍ الرفع...</span>
                  </div>
                ))}

                {/* Add more */}
                <div
                  onClick={() => uploadRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                >
                  <Upload className="w-7 h-7 text-gray-300 group-hover:text-primary mb-1 transition-colors" />
                  <span className="text-xs text-gray-400 group-hover:text-primary font-bold transition-colors">إضافة</span>
                </div>
              </div>
            </SortableContext>
          </DndContext>

          <p className="text-sm text-gray-400 mt-4 text-center">
            {isMobile
              ? "💡 اضغط مطولاً واسحب الصورة لتغيير ترتيبها"
              : "💡 اسحب الصور بالإمساك بأيقونة ≡ لتغيير ترتيبها"}
          </p>
        </>
      )}

      {/* Hidden file inputs */}
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleUploadFiles(e.target.files)}
      />
      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleReplaceFile}
      />

      {/* Desktop lightbox */}
      {previewImage && (
        <Lightbox image={previewImage} onClose={() => setPreviewImage(null)} />
      )}

      {/* Mobile bottom sheet */}
      {mobileMenuImage && (
        <MobileActionSheet
          image={mobileMenuImage}
          isDeleting={deletingId === mobileMenuImage.id}
          isReplacing={replacingId === mobileMenuImage.id}
          onPreview={() => setPreviewImage(mobileMenuImage)}
          onReplace={() => handleReplace(mobileMenuImage.id)}
          onDelete={() => handleDelete(mobileMenuImage.id)}
          onClose={() => setMobileMenuImage(null)}
        />
      )}
    </div>
  );
}
