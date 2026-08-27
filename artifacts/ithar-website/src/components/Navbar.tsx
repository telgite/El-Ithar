import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoSrc from '@assets/logo.png';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { name: 'الرئيسية', href: '#hero' },
    { name: 'من نحن', href: '#about' },
    { name: 'أنشطتنا', href: '#activities' },
    { name: 'إنجازاتنا', href: '#impact' },
    { name: 'تواصل معنا', href: '#contact' },
  ];

  const scrollTo = (id: string) => {
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <motion.header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-card/95 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => scrollTo('#hero')}
        >
          <div className={`flex-shrink-0 transition-all duration-300 ${
            isScrolled
              ? ''
              : 'bg-white rounded-full p-1.5 shadow-md'
          }`}>
            <img
              src={logoSrc}
              alt="شعار جمعية الإيثار"
              className="h-10 w-10 object-contain block"
            />
          </div>
          <span className={`font-black text-lg md:text-xl leading-tight transition-colors ${isScrolled ? 'text-primary' : 'text-white drop-shadow-md'}`}>
            جمعية الإيثار
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {links.map((link) => (
            <button
              key={link.name}
              onClick={() => scrollTo(link.href)}
              className={`text-base font-medium transition-colors hover:text-secondary ${
                isScrolled ? 'text-foreground/80' : 'text-foreground lg:text-primary-foreground lg:drop-shadow-md'
              }`}
            >
              {link.name}
            </button>
          ))}
        </nav>

        {/* CTA Button */}
        <div className="hidden lg:block">
          <Button 
            onClick={() => scrollTo('#impact')}
            className={`font-bold rounded-full px-8 ${isScrolled ? '' : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg'}`}
          >
            تبرع الآن
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden text-primary p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} className={!isScrolled && !isMobileMenuOpen ? 'text-white' : ''} /> : <Menu size={24} className={!isScrolled ? 'text-white' : ''} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-card border-t"
          >
            <div className="flex flex-col py-4 px-4 gap-4">
              {links.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollTo(link.href)}
                  className="text-right text-lg font-medium py-2 text-foreground/80 hover:text-primary"
                >
                  {link.name}
                </button>
              ))}
              <Button 
                onClick={() => scrollTo('#impact')}
                className="w-full mt-2 font-bold rounded-full"
              >
                تبرع الآن
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
