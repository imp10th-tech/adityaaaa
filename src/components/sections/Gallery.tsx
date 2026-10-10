import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';
import { SectionDivider } from '@/components/SectionDivider';
import { MEMES_FALLBACK, GALLERY_FALLBACK_HEADINGS, type MemeItem } from '@/data/content';
import { fetchSiteSettings, getSetting, fetchGallery } from '@/lib/queries';
import type { SiteSettings } from '@/lib/queries';

export function Gallery() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [memes, setMemes] = useState<MemeItem[]>(MEMES_FALLBACK);
  const [lightbox, setLightbox] = useState<MemeItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    fetchSiteSettings().then(setSettings).catch(() => {});
    fetchGallery().then(setMemes).catch(() => {});
  }, []);

  const headingTop = getSetting(settings, 'gallery_heading_top', GALLERY_FALLBACK_HEADINGS.top);
  const headingMain = getSetting(settings, 'gallery_heading_main', GALLERY_FALLBACK_HEADINGS.main);

  const openLightbox = (item: MemeItem, index: number) => {
    setLightbox(item);
    setCurrentIndex(index);
  };

  const closeLightbox = () => setLightbox(null);

  const navigate = (dir: number) => {
    const newIndex = (currentIndex + dir + memes.length) % memes.length;
    setCurrentIndex(newIndex);
    setLightbox(memes[newIndex]);
  };

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, currentIndex, memes.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      navigate(diff > 0 ? -1 : 1);
    }
    touchStartX.current = null;
  };

  return (
    <section
      id="gallery"
      className="relative py-24 px-4 bg-gradient-to-b from-katana-black via-katana-coal to-katana-black overflow-hidden"
    >
      <div className="absolute inset-0 bg-grain opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <ScrollReveal>
          <p className="text-center font-cinematic text-katana-gold/60 text-sm tracking-[0.4em] uppercase mb-2">
            Meme Gallery
          </p>
          <h2 className="text-center font-display font-700 text-katana-bone text-2xl sm:text-3xl md:text-5xl tracking-[0.03em] text-glow-crimson leading-tight">
            {headingTop}
          </h2>
          <p className="text-center font-display font-700 text-katana-crimson text-xl sm:text-2xl md:text-4xl tracking-[0.1em] uppercase mt-1">
            {headingMain}
          </p>
        </ScrollReveal>

        <SectionDivider />

        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {memes.map((meme, i) => (
            <ScrollReveal key={i} delay={(i % 4) * 0.1} className="break-inside-avoid">
              <motion.button
                whileHover={{ y: -5, scale: 1.02 }}
                onClick={() => openLightbox(meme, i)}
                className="relative group cursor-pointer rounded-sm overflow-hidden katana-border katana-border-glow bg-katana-coal w-full block"
                aria-label={`View ${meme.caption}`}
              >
                <img
                  src={meme.url}
                  alt={meme.caption}
                  className="w-full h-auto object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-katana-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="font-body text-katana-silver/80 text-xs leading-relaxed">{meme.caption}</p>
                </div>
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-katana-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-4 h-4 text-katana-crimson" />
                </div>
              </motion.button>
            </ScrollReveal>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="fixed inset-0 z-[500] bg-katana-black/95 backdrop-blur-md flex items-center justify-center p-4"
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-katana-silver/60 hover:text-katana-crimson transition-colors z-10"
              style={{ top: 'max(1rem, env(safe-area-inset-top))', right: 'max(1rem, env(safe-area-inset-right))' }}
              aria-label="Close"
            >
              <X className="w-8 h-8" />
            </button>
            <motion.div
              key={currentIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full"
            >
              <img src={lightbox.url} alt={lightbox.caption} className="w-full max-h-[70vh] object-contain rounded-sm" />
              <p className="mt-4 text-center font-cinematic italic text-katana-silver/80 text-sm md:text-base">
                {lightbox.caption}
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <button onClick={() => navigate(-1)} className="px-6 py-2 font-display uppercase tracking-wider text-sm text-katana-silver/60 hover:text-katana-crimson border border-katana-silver/20 hover:border-katana-crimson/50 rounded-sm transition-all">
                  ← Prev
                </button>
                <button onClick={() => navigate(1)} className="px-6 py-2 font-display uppercase tracking-wider text-sm text-katana-silver/60 hover:text-katana-crimson border border-katana-silver/20 hover:border-katana-crimson/50 rounded-sm transition-all">
                  Next →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
