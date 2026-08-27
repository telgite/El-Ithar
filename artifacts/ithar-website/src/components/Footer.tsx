import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import logoSrc from '@assets/logo.png';
import { SocialIcon } from './SocialIcon';

type SocialPlatform = {
  id: number;
  platform: string;
  name: string;
  url: string;
};

async function fetchSocialPlatforms(): Promise<SocialPlatform[]> {
  const res = await fetch('/api/social');
  if (!res.ok) return [];
  return res.json();
}

export function Footer() {
  const { data: socials = [] } = useQuery({
    queryKey: ['public-social'],
    queryFn: fetchSocialPlatforms,
    staleTime: 60_000,
  });

  return (
    <footer className="bg-primary py-12 lg:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Logo & Name */}
          <div className="flex flex-col items-center gap-4 mb-4">
            <div className="bg-white rounded-full p-3 shadow-xl shadow-black/20">
              <img
                src={logoSrc}
                alt="شعار جمعية الإيثار"
                className="h-24 w-24 object-contain block"
              />
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-white">
              جمعية الإيثار للعمل الخيري ومكافحة الفقر
            </h3>
          </div>

          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            العطاء والإيثار لبناء مستقبل أفضل
          </p>

          {/* Social Icons — only rendered when at least one platform is live */}
          {socials.length > 0 && (
            <div className="flex items-center justify-center gap-4 mb-8">
              {socials.map((social) => (
                <motion.a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors duration-300 border border-white/20"
                >
                  <SocialIcon platform={social.platform} className="w-6 h-6 text-white" />
                </motion.a>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-white/20 mb-6 max-w-md mx-auto" />

          {/* Copyright */}
          <p className="text-base text-white/70">
            © 2024 جمعية الإيثار. جميع الحقوق محفوظة.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
