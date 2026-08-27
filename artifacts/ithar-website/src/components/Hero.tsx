import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import heroBg from '@assets/hero-bg.jpg';

export function Hero() {
  const scrollTo = (id: string) => {
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: 'rgba(0, 0, 0, 0.35)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white mb-6 leading-tight drop-shadow-lg">
            جمعية الإيثار للعمل الخيري
            <br />
            ومكافحة الفقر
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-white/95 max-w-3xl mx-auto mb-10 leading-relaxed font-medium drop-shadow-md">
            جمعية خيرية تهدف إلى تحسين حياة المحتاجين في موريتانيا من خلال مشاريع المياه والغذاء والكساء
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => scrollTo('#impact')}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-bold text-lg px-10 py-6 rounded-full shadow-2xl transition-all hover:scale-105"
            >
              تبرع الآن
            </Button>
            <Button
              onClick={() => scrollTo('#about')}
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-primary font-bold text-lg px-10 py-6 rounded-full shadow-xl transition-all hover:scale-105"
            >
              تعرف علينا
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div className="w-6 h-10 border-2 border-white/60 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 bg-white/80 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}
