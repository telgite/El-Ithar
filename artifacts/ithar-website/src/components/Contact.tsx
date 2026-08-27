import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, ExternalLink } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { useListContent } from '@workspace/api-client-react';

export function Contact() {
  const { data: contentItems = [] } = useListContent();

  const content = useMemo(
    () => Object.fromEntries(contentItems.map((i) => [i.key, i.value])),
    [contentItems],
  );

  const contacts = [
    {
      icon: FaWhatsapp,
      label: 'واتساب',
      value: content.contact_whatsapp ?? '+222 11 17 61 27',
      href: content.contact_whatsapp_href ?? 'https://wa.me/22211176127',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Phone,
      label: 'هاتف',
      value: content.contact_phone ?? '+222 51 01 11 47',
      href: content.contact_phone_href ?? 'tel:+22251011147',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Mail,
      label: 'البريد الإلكتروني',
      value: content.contact_email ?? 'contact@ithar.net',
      href: `mailto:${content.contact_email ?? 'contact@ithar.net'}`,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: MapPin,
      label: 'الموقع',
      value: content.contact_location ?? 'نواكشوط، موريتانيا',
      href: 'https://www.google.com/maps/dir/?api=1&destination=18.0735,-15.9582',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <section id="contact" className="py-20 lg:py-32 bg-card">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-primary mb-6">
            تواصل معنا
          </h2>
          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto">
            نحن هنا للإجابة على استفساراتكم وتلقي تبرعاتكم الكريمة
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {contacts.map((contact, index) => {
            const Icon = contact.icon;
            return (
              <motion.a
                key={index}
                href={contact.href}
                target={contact.href.startsWith('http') ? '_blank' : undefined}
                rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex flex-col items-center text-center p-6 bg-background rounded-2xl border-2 border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
              >
                <div
                  className={`w-16 h-16 ${contact.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className={`w-8 h-8 ${contact.color}`} />
                </div>
                <p className="font-bold text-foreground/60 text-sm mb-1">{contact.label}</p>
                <p className="font-black text-foreground text-lg leading-tight">{contact.value}</p>
              </motion.a>
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
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold text-lg px-8 py-6 rounded-2xl transition-all"
          >
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=18.0735,-15.9582"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin className="ml-2 w-5 h-5" />
              عرض على الخريطة
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
