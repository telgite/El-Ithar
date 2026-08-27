import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from "@tanstack/react-query";
import { motion } from 'framer-motion';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import ramadanFamilies from '@assets/WhatsApp_Image_2026-07-15_at_7.09.20_PM_(3)_1784321029452.jpeg';
import ramadanMeals from '@assets/WhatsApp_Image_2026-07-15_at_7.09.20_PM_(4)_1784321029451.jpeg';
import ramadanCooking from '@assets/WhatsApp_Image_2026-07-15_at_7.09.20_PM_(5)_1784321029449.jpeg';
import ramadanTeam from '@assets/WhatsApp_Image_2026-07-15_at_7.10.14_PM_1784321039714.jpeg';
import meatFamilies from '@assets/WhatsApp_Image_2026-07-15_at_7.13.44_PM_(1)_1784309095602.jpeg';
import meatTeam from '@assets/WhatsApp_Image_2026-07-15_at_7.13.44_PM_1784309095602.jpeg';
import meatPreparation from '@assets/WhatsApp_Image_2026-07-15_at_7.13.44_PM_1784320207608.jpeg';
import clothesFamilies from '@assets/WhatsApp_Image_2026-07-15_at_7.14.42_PM_1784309095599.jpeg';
import clothesChild from '@assets/WhatsApp_Image_2026-07-15_at_7.16.03_PM_(1)_1784321609267.jpeg';
import clothesTeam from '@assets/WhatsApp_Image_2026-07-15_at_7.17.05_PM_1784321609265.jpeg';
import clothesVolunteers from '@assets/WhatsApp_Image_2026-07-15_at_7.19.05_PM_1784321633380.jpeg';
import healthVisit from '@assets/WhatsApp_Image_2026-07-15_at_7.16.03_PM_1784321624063.jpeg';
import healthChildren from '@assets/WhatsApp_Image_2026-07-15_at_7.28.03_PM_1784322721198.jpeg';
import healthAid from '@assets/WhatsApp_Image_2026-07-15_at_7.23.51_PM_(1)_1784322712621.jpeg';
import healthSupplies from '@assets/WhatsApp_Image_2026-07-15_at_7.23.51_PM_1784322712622.jpeg';
import blanketStock from '@assets/WhatsApp_Image_2026-07-15_at_8.04.33_PM_1784323924095.jpeg';
import blanketDelivery from '@assets/WhatsApp_Image_2026-07-15_at_7.51.56_PM_1784323935053.jpeg';
import blanketCamp from '@assets/WhatsApp_Image_2026-07-15_at_7.51.08_PM_1784323935049.jpeg';
import blanketFamily from '@assets/WhatsApp_Image_2026-07-15_at_7.51.09_PM_1784323935052.jpeg';
import waterTower from '@assets/WhatsApp_Image_2026-07-15_at_7.39.47_PM_1784323596096.jpeg';
import waterValves from '@assets/WhatsApp_Image_2026-07-15_at_7.39.32_PM_(2)_1784323596097.jpeg';
import waterPipe from '@assets/WhatsApp_Image_2026-07-15_at_7.39.32_PM_(1)_1784323596098.jpeg';
import waterWellHead from '@assets/WhatsApp_Image_2026-07-15_at_7.39.32_PM_1784323596099.jpeg';
import waterTankVillage from '@assets/WhatsApp_Image_2026-07-15_at_7.33.45_PM_1784323596104.jpeg';
import waterDistribution from '@assets/WhatsApp_Image_2026-07-15_at_7.34.31_PM_(1)_1784323596101.jpeg';
import waterTruck from '@assets/WhatsApp_Image_2026-07-15_at_7.34.30_PM_1784323596103.jpeg';
import waterRemote from '@assets/WhatsApp_Image_2026-07-15_at_7.33.15_PM_1784323596105.jpeg';
import waterDigging from '@assets/WhatsApp_Image_2026-07-15_at_7.34.31_PM_(2)_1784323596100.jpeg';
import waterClean from '@assets/WhatsApp_Image_2026-07-15_at_7.34.31_PM_1784323596102.jpeg';
import waterFamilies from '@assets/WhatsApp_Image_2026-07-15_at_7.33.14_PM_1784323596106.jpeg';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GallerySlot {
  label: string;
  src?: string;
  alt?: string;
}

interface GallerySection {
  id: string;
  title: string;
  slots: GallerySlot[];
}

interface ApiGalleryImage {
  id: number;
  galleryId: number;
  objectPath: string;
  altText: string;
  sortOrder: number;
}

interface ApiGallery {
  id: number;
  slug: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
  images: ApiGalleryImage[];
}

// ── Hardcoded fallback (used while loading or on error) ───────────────────────

const DEFAULT_GALLERIES: GallerySection[] = [
  {
    id: 'water',
    title: 'صور حملات السقايات وحفر الآبار',
    slots: [
      { label: 'برج خزان المياه في الصحراء', src: waterTower, alt: 'برج خزان المياه في الصحراء - مشروع جمعية الإيثار' },
      { label: 'صمامات ضخ المياه الشمسية', src: waterValves, alt: 'صمامات ضخ المياه الشمسية - مشروع حفر الآبار' },
      { label: 'تركيب أنبوب بئر المياه', src: waterPipe, alt: 'تركيب أنبوب بئر المياه في الصحراء' },
      { label: 'رأس بئر المياه بين أشجار النخيل', src: waterWellHead, alt: 'رأس بئر المياه الشمسي بين أشجار النخيل' },
      { label: 'خزان مياه محمول في القرية', src: waterTankVillage, alt: 'خزان مياه محمول في القرية - سقاية للأسر الفقيرة' },
      { label: 'توزيع المياه على الأسر المحتاجة', src: waterDistribution, alt: 'توزيع المياه على الأسر المحتاجة' },
      { label: 'مشروع سقاية المياه', src: waterTruck, alt: 'مشروع سقاية المياه - جمعية الإيثار' },
      { label: 'آبار المياه في المناطق النائية', src: waterRemote, alt: 'آبار المياه في المناطق النائية' },
      { label: 'حفر الآبار وتوصيل المياه', src: waterDigging, alt: 'حفر الآبار وتوصيل المياه للقرى' },
      { label: 'مشروع مياه الشرب النقية', src: waterClean, alt: 'مشروع مياه الشرب النقية - جمعية الإيثار' },
      { label: 'إيصال المياه إلى الأسر المستفيدة', src: waterFamilies, alt: 'إيصال المياه إلى الأسر المستفيدة في القرى' },
    ],
  },
  {
    id: 'meat',
    title: 'صور حملات توزيع اللحوم',
    slots: [
      { label: 'الأسر المستفيدة', src: meatFamilies, alt: 'توزيع اللحوم - الأسر المستفيدة' },
      { label: 'فريق الجمعية', src: meatTeam, alt: 'توزيع اللحوم - فريق الجمعية' },
      { label: 'تقسيم اللحوم على الأسر الضعيفة', src: meatPreparation, alt: 'من أعمال الجمعية تقسيم الحوم على الأسر ضعيفة' },
    ],
  },
  {
    id: 'clothes',
    title: 'صور حملات توزيع ملابس',
    slots: [
      { label: 'أسر تنتظر استلام الملابس', src: clothesFamilies, alt: 'أسر تنتظر استلام الملابس - حملة توزيع الملابس' },
      { label: 'طفلة تعرض ملابسها الجديدة', src: clothesChild, alt: 'طفلة تعرض ملابسها الجديدة - حملة توزيع الملابس' },
      { label: 'فريق الجمعية يوزع الملابس على الأطفال', src: clothesTeam, alt: 'فريق الجمعية يوزع الملابس على الأطفال' },
      { label: 'متطوعو الجمعية في حملة توزيع الملابس', src: clothesVolunteers, alt: 'متطوعو جمعية الإيثار في حملة توزيع الملابس' },
    ],
  },
  {
    id: 'health',
    title: 'صور رحلات نوعية في مجال الصحة والتعليم',
    slots: [
      { label: 'رحلات في الأرياف لتوعية في مجال الصحة', src: healthSupplies, alt: 'رحلات الجمعية في الأرياف للتوعية الصحية' },
      { label: 'زيارة ميدانية لأسرة محتاجة', src: healthVisit, alt: 'زيارة ميدانية لأسرة محتاجة - رحلات الصحة والتعليم' },
      { label: 'أطفال المجتمعات المستفيدة', src: healthChildren, alt: 'أطفال المجتمعات المستفيدة من رحلات جمعية الإيثار' },
      { label: 'فريق الجمعية يقدم المساعدات الميدانية', src: healthAid, alt: 'فريق جمعية الإيثار يقدم المساعدات الميدانية للأسر' },
    ],
  },
  {
    id: 'blankets',
    title: 'صور حملات توزيع بطانيات في الشتاء',
    slots: [
      { label: 'بطانيات وملابس شتوية جاهزة للتوزيع', src: blanketStock, alt: 'بطانيات وملابس شتوية جاهزة للتوزيع - جمعية الإيثار' },
      { label: 'أسرة تستلم البطانيات في مخيمها', src: blanketCamp, alt: 'أسرة تستلم البطانيات في مخيمها' },
      { label: 'مخزون البطانيات قبيل انطلاق الحملة', src: blanketDelivery, alt: 'مخزون البطانيات قبيل انطلاق حملة التوزيع' },
      { label: 'طفلة تتلقى بطانيتها الشتوية', src: blanketFamily, alt: 'طفلة تتلقى بطانيتها الشتوية من الجمعية' },
    ],
  },
  {
    id: 'ramadan',
    title: 'صور سلال رمضان',
    slots: [
      { label: 'تحضير سلال رمضان الغذائية', src: ramadanCooking, alt: 'تحضير سلال رمضان الغذائية - المتطوعون' },
      { label: 'وجبات إفطار جماعية في المساجد', src: ramadanMeals, alt: 'وجبات إفطار جماعية في المساجد' },
      { label: 'عائلات تستلم سلال رمضان', src: ramadanFamilies, alt: 'عائلات تستلم سلال رمضان - المستفيدون' },
      { label: 'فريق الجمعية في حملة التوزيع', src: ramadanTeam, alt: 'فريق جمعية الإيثار في حملة توزيع السلال الغذائية' },
    ],
  },
];

// ── Map API response to GallerySection ────────────────────────────────────────

function apiToSection(g: ApiGallery): GallerySection {
  return {
    id: g.slug,
    title: g.title,
    slots: g.images.map((img) => ({
      label: img.altText || g.title,
      src: `/api/storage${img.objectPath}`,
      alt: img.altText || g.title,
    })),
  };
}

// ── Mobile tab strip ──────────────────────────────────────────────────────────
//
// Design rationale (satisfies all 10 requirements):
//
//  • Each tab occupies the full scroll-container width ("one tab at a time"
//    — requirement 2). Neighboring tabs are completely off-screen; there is no
//    partial text visible from any adjacent tab (requirement 5).
//  • The active pill is content-sized and centred inside its full-width slot,
//    so the pill never stretches awkwardly (premium look, requirement 10).
//  • scroll-snap-type: x mandatory  +  scroll-snap-align: center on each slot
//    gives the hard-snap feel of YouTube / Google Play (requirement 7).
//  • scrollbarWidth: none + ::-webkit-scrollbar hiding keeps native momentum
//    scrolling while the bar is invisible (requirements 3, 8).
//  • IntersectionObserver watches the slots from inside the scroll container
//    (root = container) and updates activeId when a slot becomes ≥ 60 % visible.
//    This fires for both native swipes and programmatic scrollIntoView calls, so
//    the gallery content always stays in sync (requirement 6).
//  • scrollIntoView({ inline:'center', block:'nearest' }) is RTL-safe because
//    browsers handle the direction internally (requirement 9).
//  • Dot pagination + left/right arrow buttons give discoverability on all
//    devices and supplement native swipe (requirement 10).

interface MobileTabStripProps {
  galleries: GallerySection[];
  activeId: string;
  onSelect: (id: string) => void;
}

function MobileTabStrip({ galleries, activeId, onSelect }: MobileTabStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ── Programmatic-scroll guard ─────────────────────────────────────────────
  //
  // Root cause of "arrows/dots do nothing":
  //   When a programmatic scrollIntoView starts, the IntersectionObserver
  //   immediately fires for the slot that is STILL in view (the old one,
  //   now at < 100 % but still ≥ 60 %) and calls onSelect with the OLD id,
  //   reverting the navigation before the scroll completes.
  //
  // Fix: raise a flag for the duration of the scroll animation so the
  //   observer ignores intersection events it did not cause.
  const isProgrammaticRef = useRef(false);
  const suppressTimerRef  = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── Single navigation entry-point ────────────────────────────────────────
  //
  // Used by arrows, dots, and the "sync from external activeId" effect.
  // Always updates state immediately AND scrolls; the observer is muted
  // for 900 ms so it cannot overwrite the new state mid-animation.
  const navigateTo = useCallback((id: string, instant = false) => {
    const slot = slotRefs.current[id];
    if (!slot) return;

    // Mute the observer for the duration of the scroll
    isProgrammaticRef.current = true;
    clearTimeout(suppressTimerRef.current);
    suppressTimerRef.current = setTimeout(
      () => { isProgrammaticRef.current = false; },
      instant ? 50 : 900,
    );

    // Update React state immediately — do not wait for the observer
    onSelect(id);

    // Scroll the slot into view (RTL-safe: browser handles direction)
    slot.scrollIntoView({
      behavior: instant ? 'instant' : 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [onSelect]);

  // Snap to initial active tab without animation on first paint
  useEffect(() => { navigateTo(activeId, true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When activeId changes externally (e.g. from the desktop grid), scroll
  // the mobile strip to match without calling onSelect a second time.
  const prevActiveIdRef = useRef(activeId);
  useEffect(() => {
    if (prevActiveIdRef.current === activeId) return;
    prevActiveIdRef.current = activeId;

    const slot = slotRefs.current[activeId];
    if (!slot) return;

    isProgrammaticRef.current = true;
    clearTimeout(suppressTimerRef.current);
    suppressTimerRef.current = setTimeout(
      () => { isProgrammaticRef.current = false; },
      900,
    );
    slot.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeId]);

  // ── IntersectionObserver — syncs activeId on native swipe only ───────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !('IntersectionObserver' in window)) return;

    const observers: IntersectionObserver[] = [];

    for (const [id, slot] of Object.entries(slotRefs.current)) {
      if (!slot) continue;
      const observer = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            entries[0].intersectionRatio >= 0.6 &&
            !isProgrammaticRef.current          // ← ignore during programmatic scroll
          ) {
            onSelect(id);
          }
        },
        { root: container, threshold: 0.6 },
      );
      observer.observe(slot);
      observers.push(observer);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, [galleries, onSelect]);

  // ── Arrow navigation ──────────────────────────────────────────────────────
  const currentIndex = galleries.findIndex((g) => g.id === activeId);

  function goTo(delta: number) {
    const next = galleries[currentIndex + delta];
    if (next) navigateTo(next.id);
  }

  return (
    <div className="lg:hidden mb-10" dir="rtl">
      {/*
       * Outer wrapper — clips the scroll track and positions the arrows.
       * No horizontal padding here; the container is truly edge-to-edge.
       */}
      <div className="relative -mx-4">
        {/* ── Scroll container ─────────────────────────────────────────── */}
        <div
          ref={containerRef}
          className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden"
          style={{
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          } as React.CSSProperties}
        >
          {/*
           * Inner flex row — each slot is exactly as wide as the container
           * (flex: 0 0 100%), so only ONE slot is visible at a time.
           * scroll-snap-align: center on each slot gives precise, committed
           * snapping after every swipe.
           */}
          <div className="flex">
            {galleries.map((gallery) => {
              const isActive = gallery.id === activeId;
              return (
                <div
                  key={gallery.id}
                  ref={(el) => { slotRefs.current[gallery.id] = el; }}
                  style={{ flex: '0 0 100%', scrollSnapAlign: 'center' }}
                  className="flex items-center justify-center px-12 py-3"
                >
                  <button
                    onClick={() => navigateTo(gallery.id)}
                    className={[
                      // layout
                      'w-full max-w-xs whitespace-normal text-center',
                      // typography
                      'text-sm font-bold leading-snug',
                      // shape
                      'rounded-2xl py-3.5 px-6',
                      // transitions
                      'transition-all duration-300',
                      // focus ring (accessibility)
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                      // active vs inactive states
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105'
                        : 'bg-card text-foreground/50 border border-border',
                    ].join(' ')}
                  >
                    {gallery.title}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Left / Right arrow buttons ────────────────────────────────── */}
        {/* In RTL: "previous" is to the left (next index), "next" is to the right (prev index) */}
        <button
          onClick={() => goTo(-1)}           // RTL: left arrow → previous gallery
          disabled={currentIndex === 0}
          aria-label="التبويب السابق"
          className="absolute top-1/2 -translate-y-1/2 right-1 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm text-foreground/60 hover:text-primary hover:border-primary transition-all disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => goTo(+1)}           // RTL: right arrow → next gallery
          disabled={currentIndex === galleries.length - 1}
          aria-label="التبويب التالي"
          className="absolute top-1/2 -translate-y-1/2 left-1 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm text-foreground/60 hover:text-primary hover:border-primary transition-all disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* ── Dot pagination ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {galleries.map((gallery, i) => (
          <button
            key={gallery.id}
            onClick={() => navigateTo(gallery.id)}
            aria-label={gallery.title}
            className={[
              'rounded-full transition-all duration-300',
              gallery.id === activeId
                ? 'w-5 h-2 bg-primary'
                : 'w-2 h-2 bg-border hover:bg-primary/40',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Gallery() {
  const { data: apiGalleries } = useQuery<ApiGallery[]>({
    queryKey: ["public-galleries"],
    queryFn: () => fetch("/api/galleries").then((r) => r.json()),
    staleTime: 60_000,
  });

  // Use API data when available, fall back to hardcoded defaults
  const galleries: GallerySection[] =
    apiGalleries && apiGalleries.length > 0
      ? apiGalleries
          .filter((g) => g.isActive)
          .map(apiToSection)
          .filter((g) => g.slots.length > 0)
      : DEFAULT_GALLERIES;

  const displayGalleries = galleries.length > 0 ? galleries : DEFAULT_GALLERIES;

  // ── Controlled tab state ──────────────────────────────────────────────────
  const [activeId, setActiveId] = useState<string>(displayGalleries[0]?.id ?? '');

  // Keep activeId valid if displayGalleries arrives asynchronously
  useEffect(() => {
    if (!activeId && displayGalleries.length > 0) {
      setActiveId(displayGalleries[0].id);
    }
  }, [displayGalleries, activeId]);

  // Stable callback for MobileTabStrip so IntersectionObserver doesn't recreate
  const handleSelect = useCallback((id: string) => setActiveId(id), []);

  return (
    <section id="gallery" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary mb-6">
            معرض الصور
          </h2>
          <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto">
            صور من أنشطتنا الخيرية ومشاريعنا في مختلف المناطق
          </p>
        </motion.div>

        <Tabs value={activeId} onValueChange={handleSelect} className="w-full" dir="rtl">

          {/* ── MOBILE TAB STRIP (< lg) ────────────────────────────────── */}
          <MobileTabStrip
            galleries={displayGalleries}
            activeId={activeId}
            onSelect={handleSelect}
          />

          {/* ── DESKTOP TAB GRID (≥ lg) — unchanged ─────────────────────── */}
          <TabsList className="hidden lg:grid lg:w-full lg:grid-cols-3 xl:grid-cols-6 bg-card p-2 h-auto gap-2 mb-12">
            {displayGalleries.map((gallery) => (
              <TabsTrigger
                key={gallery.id}
                value={gallery.id}
                className="text-base font-bold py-3 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg whitespace-normal"
              >
                {gallery.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Gallery content grid ──────────────────────────────────── */}
          {displayGalleries.map((gallery) => (
            <TabsContent key={gallery.id} value={gallery.id}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gallery.slots.map((slot, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Dialog>
                      <DialogTrigger asChild>
                        {slot.src ? (
                          <button className="w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-border hover:border-secondary transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative">
                            <img
                              src={slot.src}
                              alt={slot.alt || slot.label}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                          </button>
                        ) : (
                          <button className="w-full aspect-[4/3] bg-gradient-to-br from-secondary/10 to-primary/10 rounded-2xl border-2 border-dashed border-border hover:border-secondary flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                            <Camera className="w-12 h-12 text-secondary/60 group-hover:text-secondary group-hover:scale-110 transition-all duration-300" strokeWidth={1.5} />
                            <div className="text-center px-4">
                              <p className="text-lg font-bold text-foreground mb-2">{slot.label}</p>
                              <p className="text-sm text-foreground/60">انقر لإضافة صورة</p>
                            </div>
                          </button>
                        )}
                      </DialogTrigger>

                      <DialogContent className="max-w-3xl" dir="rtl">
                        {slot.src ? (
                          <div className="p-2">
                            <img
                              src={slot.src}
                              alt={slot.alt || slot.label}
                              className="w-full max-h-[75vh] object-contain rounded-xl"
                            />
                          </div>
                        ) : (
                          <div className="p-4 text-center">
                            <div className="w-full aspect-video bg-gradient-to-br from-secondary/10 to-primary/10 rounded-xl flex flex-col items-center justify-center mb-4">
                              <Camera className="w-20 h-20 text-secondary/60 mb-4" strokeWidth={1.5} />
                              <p className="text-xl font-bold text-foreground mb-2">{slot.label}</p>
                              <p className="text-base text-foreground/60">{gallery.title}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              هذه معاينة للصورة. يمكن إضافة الصور الفعلية من لوحة التحكم.
                            </p>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
