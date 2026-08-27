import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, ZoomIn } from 'lucide-react';

interface ActivityImage {
  id: number;
  objectPath: string;
  altText?: string | null;
}

interface ActivityGalleryProps {
  images: ActivityImage[];
  activityTitle: string;
}

function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: ActivityImage[];
  startIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);

  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + images.length) % images.length),
    [images.length],
  );
  const next = useCallback(
    () => setCurrent((c) => (c + 1) % images.length),
    [images.length],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  const img = images[current];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Image container */}
      <div
        className="relative max-w-[92vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={`/api/storage${img.objectPath}`}
          alt={img.altText || ''}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl select-none"
          draggable={false}
        />

        {/* Navigation — only show when multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
              aria-label="السابق"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <button
              onClick={next}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
              aria-label="التالي"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
          {current + 1} / {images.length}
        </div>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
        aria-label="إغلاق"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export function ActivityGallery({ images, activityTitle }: ActivityGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  /* ── Single image: full-width cover (existing behavior) ── */
  if (images.length === 1) {
    return (
      <>
        <div
          className="h-52 overflow-hidden cursor-zoom-in relative group/gal"
          onClick={() => openLightbox(0)}
        >
          <img
            src={`/api/storage${images[0].objectPath}`}
            alt={images[0].altText || activityTitle}
            className="w-full h-full object-cover group-hover/gal:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover/gal:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover/gal:opacity-100 transition-opacity drop-shadow" />
          </div>
        </div>

        {lightboxIndex !== null && (
          <Lightbox images={images} startIndex={lightboxIndex} onClose={closeLightbox} />
        )}
      </>
    );
  }

  /* ── Multiple images: hero + thumbnail strip ── */
  const [cover, ...thumbs] = images;

  return (
    <>
      <div className="overflow-hidden">
        {/* Hero image */}
        <div
          className="h-52 overflow-hidden cursor-zoom-in relative group/hero"
          onClick={() => openLightbox(0)}
        >
          <img
            src={`/api/storage${cover.objectPath}`}
            alt={cover.altText || activityTitle}
            className="w-full h-full object-cover group-hover/hero:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover/hero:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover/hero:opacity-100 transition-opacity drop-shadow" />
          </div>
        </div>

        {/* Thumbnail strip */}
        <div
          className={`grid gap-0.5 mt-0.5 ${thumbs.length === 1 ? 'grid-cols-1' : thumbs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
        >
          {thumbs.map((img, i) => {
            const globalIndex = i + 1;
            const isLast = i === thumbs.length - 1;
            const hiddenCount = images.length - 4; // images beyond 4 are hidden
            const showOverlay = isLast && hiddenCount > 0;

            return (
              <div
                key={img.id}
                className="relative h-24 overflow-hidden cursor-zoom-in group/thumb"
                onClick={() => openLightbox(globalIndex)}
              >
                <img
                  src={`/api/storage${img.objectPath}`}
                  alt={img.altText || activityTitle}
                  className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-400"
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/25 transition-colors duration-200" />

                {/* +N overlay for overflow */}
                {showOverlay && hiddenCount > 0 && (
                  <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">+{hiddenCount + 1}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox images={images} startIndex={lightboxIndex} onClose={closeLightbox} />
      )}
    </>
  );
}
