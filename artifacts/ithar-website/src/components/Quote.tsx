import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Quote as QuoteIcon } from 'lucide-react';
import { useListContent } from '@workspace/api-client-react';

export function Quote() {
  const { data: contentItems = [] } = useListContent();

  const content = useMemo(
    () => Object.fromEntries(contentItems.map((i) => [i.key, i.value])),
    [contentItems],
  );

  const quoteText =
    content.quote_text ??
    'من خلال جمعية الإيثار، استطعنا الوصول إلى قرى نائية وتوفير المياه النظيفة لمئات العائلات. العمل الخيري ليس مجرد مساعدة، بل بناء مستقبل أفضل للجميع.';
  const quoteAuthor = content.quote_author ?? 'الشيخ إبراهيم أبن';
  const quoteRole = content.quote_role ?? 'مدير المشاريع';

  return (
    <section className="py-20 lg:py-32 bg-primary">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center relative"
        >
          <QuoteIcon
            className="w-16 h-16 md:w-20 md:h-20 text-white/20 absolute top-0 right-4 md:right-0 -translate-y-4"
            strokeWidth={1.5}
          />

          <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-relaxed mb-8 relative z-10 px-4">
            {quoteText}
          </p>

          <div className="h-1 w-24 bg-white/40 mx-auto mb-6" />

          <p className="text-xl md:text-2xl font-medium text-white/90">
            {quoteAuthor}
            {quoteRole && (
              <span className="text-white/70"> — {quoteRole}</span>
            )}
          </p>

          <QuoteIcon
            className="w-16 h-16 md:w-20 md:h-20 text-white/20 absolute bottom-0 left-4 md:left-0 translate-y-4 rotate-180"
            strokeWidth={1.5}
          />
        </motion.div>
      </div>
    </section>
  );
}
