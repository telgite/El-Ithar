import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useCountUp } from '@/hooks/use-count-up';
import { Users, Award, MapPin } from 'lucide-react';
import { useListContent } from '@workspace/api-client-react';

export function About() {
  const { data: contentItems = [] } = useListContent();

  const content = useMemo(
    () => Object.fromEntries(contentItems.map((i) => [i.key, i.value])),
    [contentItems],
  );

  const aboutText =
    content.about_text ??
    'الإيثار هي جمعية خيرية تأسست عام 2018 بهدف خدمة المجتمعات المحتاجة في موريتانيا. نؤمن بأن العطاء والإيثار قيم أساسية تبني مجتمعاً أفضل للجميع.';

  const beneficiariesTarget = parseInt(content.about_beneficiaries ?? '10000');
  const projectsTarget = parseInt(content.about_projects ?? '90');
  const statesTarget = parseInt(content.about_states ?? '5');

  const beneficiaries = useCountUp(beneficiariesTarget, 2500);
  const projects = useCountUp(projectsTarget, 2000);
  const states = useCountUp(statesTarget, 1500);

  const stats = [
    {
      icon: Users,
      value: beneficiaries.count,
      suffix: '+',
      label: 'مستفيد',
      ref: beneficiaries.elementRef,
    },
    {
      icon: Award,
      value: projects.count,
      suffix: '+',
      label: 'مشروع',
      ref: projects.elementRef,
    },
    {
      icon: MapPin,
      value: states.count,
      suffix: '+',
      label: 'ولايات',
      ref: states.elementRef,
    },
  ];

  return (
    <section id="about" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary mb-6">
            من نحن
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            {aboutText}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
                ref={stat.ref as React.RefObject<HTMLDivElement>}
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon className="w-10 h-10 text-primary" strokeWidth={1.5} />
                </div>
                <div className="text-5xl md:text-6xl font-black text-primary mb-2">
                  {stat.value.toLocaleString('ar-SA')}
                  <span className="text-secondary text-4xl">{stat.suffix}</span>
                </div>
                <p className="text-xl font-bold text-foreground/70">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
