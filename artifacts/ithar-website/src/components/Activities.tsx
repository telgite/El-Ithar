import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useListActivities } from '@workspace/api-client-react';
import {
  Package,
  Droplets,
  GraduationCap,
  Shirt,
  Heart,
  Users,
  Home,
  Star,
  Sun,
  Leaf,
  HandHeart,
  Scissors,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Package,
  Droplets,
  GraduationCap,
  Shirt,
  Heart,
  Users,
  Home,
  Star,
  Sun,
  Leaf,
  HandHeart,
  Scissors,
};

const CARD_STYLES = [
  { color: 'text-primary', bgColor: 'bg-primary/10' },
  { color: 'text-secondary-foreground', bgColor: 'bg-secondary/20' },
  { color: 'text-primary', bgColor: 'bg-primary/15' },
  { color: 'text-secondary-foreground', bgColor: 'bg-secondary/25' },
];

// Default activities shown while API data loads
const DEFAULT_ACTIVITIES = [
  { id: -1, title: 'توزيع الغذاء', description: 'نوزع سلال غذائية متكاملة على الأسر المحتاجة خلال المواسم والمناسبات.', stat: '+3000 سلة غذائية', iconName: 'Package', isActive: true, images: [], sortOrder: 1 },
  { id: -2, title: 'حفر الآبار', description: 'نحفر آباراً للمياه في المناطق المحرومة لتأمين المياه النظيفة للأسر.', stat: '32 بئر مياه', iconName: 'Droplets', isActive: true, images: [], sortOrder: 2 },
  { id: -4, title: 'كساء وملابس', description: 'نوفر الملابس والأغطية لأسر تعاني البرد والحاجة في مختلف المناطق.', stat: '+2000 قطعة ملابس', iconName: 'Shirt', isActive: true, images: [], sortOrder: 4 },
  { id: -5, title: 'رحلات نوعية في مجال الصحة والتعليم', description: 'تنظم الجمعية رحلات نوعية لتقديم الخدمات الصحية والدعم التعليمي للمجتمعات المحتاجة، من خلال مبادرات ميدانية تهدف إلى تحسين جودة الحياة وتعزيز فرص التعليم والرعاية الصحية.', stat: '+150 مستفيد من الرحلات', iconName: 'HandHeart', isActive: true, images: [], sortOrder: 10 },
];

export function Activities() {
  const { data: allActivities, isLoading } = useListActivities();

  const activities = (
    allActivities?.filter((a) => a.isActive) ?? []
  );

  const displayActivities = (!isLoading && activities.length > 0) ? activities : DEFAULT_ACTIVITIES;

  return (
    <section id="activities" className="py-20 lg:py-32 bg-card">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary mb-6">
            أنشطتنا الخيرية
          </h2>
          <p className="text-lg md:text-xl text-foreground/70 max-w-3xl mx-auto">
            نقدم مساعدات متنوعة للمحتاجين في مختلف المجالات
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {displayActivities.map((activity, index) => {
            const Icon = ICON_MAP[activity.iconName] ?? Heart;
            const style = CARD_STYLES[index % CARD_STYLES.length];
            const coverImage = activity.images[0];

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="bg-background border-2 border-border rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group"
              >
                <div className="p-8">
                  <div
                    className={`w-16 h-16 ${style.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`w-8 h-8 ${style.color}`} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-primary mb-4">
                    {activity.title}
                  </h3>
                  <p className="text-base md:text-lg text-foreground/70 leading-relaxed mb-6">
                    {activity.description}
                  </p>
                  {activity.stat && (
                    <Badge className="bg-secondary text-secondary-foreground font-bold text-sm px-4 py-2">
                      {activity.stat}
                    </Badge>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
