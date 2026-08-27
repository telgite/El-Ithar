import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCountUp } from '@/hooks/use-count-up';
import { Droplets, Users, Shirt, Package } from 'lucide-react';
import { useListContent } from '@workspace/api-client-react';

export function Impact() {
  const { data: contentItems = [] } = useListContent();

  const content = useMemo(
    () => Object.fromEntries(contentItems.map((i) => [i.key, i.value])),
    [contentItems],
  );

  const wellsTarget = parseInt(content.impact_wells ?? '50');
  const familiesTarget = parseInt(content.impact_families ?? '5000');
  const clothesTarget = parseInt(content.impact_clothes ?? '2000');
  const basketsTarget = parseInt(content.impact_baskets ?? '3000');

  const wells = useCountUp(wellsTarget, 2500);
  const families = useCountUp(familiesTarget, 2500);
  const clothes = useCountUp(clothesTarget, 2500);
  const baskets = useCountUp(basketsTarget, 2500);

  const stats = [
    {
      icon: Droplets,
      value: wells.count,
      suffix: '+',
      label: 'بئر مياه',
      ref: wells.elementRef,
    },
    {
      icon: Users,
      value: families.count,
      suffix: '+',
      label: 'عائلة استفادت',
      ref: families.elementRef,
    },
    {
      icon: Shirt,
      value: clothes.count,
      suffix: '+',
      label: 'قطعة ملابس',
      ref: clothes.elementRef,
    },
    {
      icon: Package,
      value: baskets.count,
      suffix: '+',
      label: 'سلة غذائية',
      ref: baskets.elementRef,
    },
  ];

  return (
    <section id="impact" className="py-20 lg:py-32 bg-primary/5">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary mb-6">
            أثرنا على أرض الواقع
          </h2>
          <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto">
            أرقام حقيقية تعكس حجم ما أنجزناه معاً
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center bg-background rounded-2xl p-6 shadow-sm border border-border"
                ref={stat.ref as React.RefObject<HTMLDivElement>}
              >
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-primary" strokeWidth={1.5} />
                </div>
                <div className="text-4xl font-black text-primary mb-1">
                  {stat.value.toLocaleString('ar-SA')}
                  <span className="text-secondary text-2xl">{stat.suffix}</span>
                </div>
                <p className="text-sm font-bold text-foreground/60">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h3 className="text-2xl md:text-3xl font-black text-primary mb-4">
            كن جزءاً من التغيير
          </h3>
          <p className="text-foreground/70 max-w-xl mx-auto mb-8 text-lg leading-relaxed">
            تبرعك يصل مباشرة إلى من يحتاجه — بشفافية كاملة وأمانة تامة
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white font-black text-lg px-10 py-6 rounded-2xl"
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          >
            تواصل معنا للتبرع
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
